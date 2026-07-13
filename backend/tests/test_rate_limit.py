import asyncio
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.core.config import get_settings
from app.core.rate_limit import public_rate_limit, reset_rate_limits


def _request(ip: str = "9.9.9.9") -> SimpleNamespace:
    return SimpleNamespace(headers={}, client=SimpleNamespace(host=ip))


class RateLimitTests(unittest.TestCase):
    def setUp(self) -> None:
        reset_rate_limits()

    def tearDown(self) -> None:
        reset_rate_limits()
        get_settings.cache_clear()

    def test_allows_up_to_limit_then_blocks_with_retry_after(self) -> None:
        with patch.dict(
            os.environ, {"PUBLIC_RATE_LIMIT_PER_MINUTE": "2"}, clear=False
        ):
            get_settings.cache_clear()
            request = _request()
            asyncio.run(public_rate_limit(request))
            asyncio.run(public_rate_limit(request))
            with self.assertRaises(HTTPException) as context:
                asyncio.run(public_rate_limit(request))

        self.assertEqual(context.exception.status_code, 429)
        self.assertIn("Retry-After", context.exception.headers or {})

    def test_separate_ips_have_independent_budgets(self) -> None:
        with patch.dict(
            os.environ, {"PUBLIC_RATE_LIMIT_PER_MINUTE": "1"}, clear=False
        ):
            get_settings.cache_clear()
            asyncio.run(public_rate_limit(_request("1.1.1.1")))
            # A different IP is unaffected by the first IP's spent budget.
            asyncio.run(public_rate_limit(_request("2.2.2.2")))

    def test_disabled_when_zero(self) -> None:
        with patch.dict(
            os.environ, {"PUBLIC_RATE_LIMIT_PER_MINUTE": "0"}, clear=False
        ):
            get_settings.cache_clear()
            request = _request()
            for _ in range(5):
                asyncio.run(public_rate_limit(request))


if __name__ == "__main__":
    unittest.main()
