import json
import logging
import os
import sys
import unittest
from unittest.mock import patch

from app.core.config import get_settings
from app.core.logging import JsonFormatter
from app.core.observability import init_sentry


class JsonFormatterTests(unittest.TestCase):
    def test_includes_core_and_extra_fields(self) -> None:
        record = logging.LogRecord(
            "sbz.request", logging.INFO, __file__, 10, "request", None, None
        )
        record.request_id = "abc-123"
        record.status_code = 200

        payload = json.loads(JsonFormatter().format(record))

        self.assertEqual(payload["level"], "INFO")
        self.assertEqual(payload["logger"], "sbz.request")
        self.assertEqual(payload["message"], "request")
        self.assertEqual(payload["request_id"], "abc-123")
        self.assertEqual(payload["status_code"], 200)
        self.assertIn("ts", payload)
        # Internal LogRecord attributes must not leak into the JSON line.
        self.assertNotIn("args", payload)
        self.assertNotIn("msg", payload)

    def test_exception_is_serialised(self) -> None:
        try:
            raise ValueError("boom")
        except ValueError:
            record = logging.LogRecord(
                "sbz", logging.ERROR, __file__, 1, "failed", None, sys.exc_info()
            )

        payload = json.loads(JsonFormatter().format(record))
        self.assertIn("exception", payload)
        self.assertIn("boom", payload["exception"])


class SentryInitTests(unittest.TestCase):
    def tearDown(self) -> None:
        get_settings.cache_clear()

    def test_disabled_without_dsn(self) -> None:
        with patch.dict(os.environ, {"SENTRY_DSN": ""}, clear=False):
            get_settings.cache_clear()
            self.assertFalse(init_sentry())


if __name__ == "__main__":
    unittest.main()
