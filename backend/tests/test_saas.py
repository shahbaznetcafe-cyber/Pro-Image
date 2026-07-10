import asyncio
import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.core.config import get_settings
from app.integrations.saas import check_saas_schema, reserve_usage


class SaasEntitlementTests(unittest.TestCase):
    def tearDown(self) -> None:
        get_settings.cache_clear()

    def test_local_development_allows_generation_without_supabase(self) -> None:
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "development",
                "SUPABASE_URL": "",
                "SUPABASE_PUBLISHABLE_KEY": "",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            reservation = asyncio.run(
                reserve_usage(
                    None,
                    action="seller_pack",
                    file_count=1,
                    original_filename="product.png",
                    original_size_kb=100,
                    expected_output_count=3,
                )
            )

        self.assertEqual(reservation.plan, "development")
        self.assertIsNone(reservation.job_id)

    def test_configured_saas_requires_login_token(self) -> None:
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "development",
                "SUPABASE_URL": "https://example.supabase.co",
                "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_test",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            with self.assertRaises(HTTPException) as context:
                asyncio.run(
                    reserve_usage(
                        None,
                        action="seller_pack",
                        file_count=1,
                        original_filename="product.png",
                        original_size_kb=100,
                        expected_output_count=3,
                    )
                )

        self.assertEqual(context.exception.status_code, 401)

    def test_schema_preflight_reports_missing_objects(self) -> None:
        class Response:
            def __init__(self, is_success: bool) -> None:
                self.is_success = is_success

        class Client:
            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, traceback):
                return None

            async def options(self, url, headers):
                return Response("seller_subscriptions" not in url)

        with patch.dict(
            os.environ,
            {
                "APP_ENV": "production",
                "SUPABASE_URL": "https://example.supabase.co",
                "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_test",
            },
            clear=False,
        ), patch("app.integrations.saas.httpx.AsyncClient", return_value=Client()):
            get_settings.cache_clear()
            result = asyncio.run(check_saas_schema())

        self.assertFalse(result["ok"])
        self.assertIn("supabase-schema.sql", result["message"])


if __name__ == "__main__":
    unittest.main()
