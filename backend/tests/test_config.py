import os
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from app.core.config import get_settings


class ConfigTests(unittest.TestCase):
    def tearDown(self) -> None:
        get_settings.cache_clear()

    def test_csv_slash_and_clamp_transforms(self) -> None:
        with patch.dict(
            os.environ,
            {
                "ALLOWED_ORIGINS": "https://a.com, https://b.com",
                "SBZ_API_KEYS": "k1, k2",
                "SUPABASE_URL": "https://x.supabase.co/",
                "PUBLIC_RATE_LIMIT_PER_MINUTE": "-3",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            settings = get_settings()

        self.assertEqual(settings.allowed_origins, ["https://a.com", "https://b.com"])
        self.assertEqual(settings.api_keys, {"k1", "k2"})
        self.assertEqual(settings.supabase_url, "https://x.supabase.co")
        self.assertEqual(settings.public_rate_limit_per_minute, 0)
        self.assertTrue(settings.api_auth_enabled)

    def test_blank_int_keeps_default(self) -> None:
        with patch.dict(
            os.environ, {"JOB_RETENTION_SECONDS": ""}, clear=False
        ):
            get_settings.cache_clear()
            self.assertEqual(get_settings().job_retention_seconds, 3600)

    def test_invalid_int_fails_fast(self) -> None:
        with patch.dict(
            os.environ, {"PUBLIC_RATE_LIMIT_PER_MINUTE": "not-a-number"}, clear=False
        ):
            get_settings.cache_clear()
            with self.assertRaises(ValidationError):
                get_settings()


if __name__ == "__main__":
    unittest.main()
