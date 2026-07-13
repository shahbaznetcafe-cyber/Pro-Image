import asyncio
import os
import shutil
import tempfile
import unittest
from io import BytesIO
from typing import Any
from unittest.mock import patch

from PIL import Image
from starlette.testclient import TestClient

from app.core.config import get_settings


def _png() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (900, 900), (240, 240, 240)).save(buffer, "PNG")
    return buffer.getvalue()


class FakeRedis:
    """Minimal async stand-in for the arq redis pool used in tests."""

    def __init__(self) -> None:
        self.kv: dict[str, Any] = {}
        self.enqueued: list[tuple] = []

    async def set(self, key: str, value: Any, ex: int | None = None) -> None:
        self.kv[key] = value

    async def get(self, key: str) -> Any:
        return self.kv.get(key)

    async def enqueue_job(self, function: str, *args: Any, **kwargs: Any) -> None:
        self.enqueued.append((function, args, kwargs))


class BatchJobsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp()
        self.env = patch.dict(
            os.environ,
            {
                "APP_ENV": "development",
                "SUPABASE_URL": "",
                "SUPABASE_PUBLISHABLE_KEY": "",
                "REDIS_URL": "redis://fake:6379/0",
                "JOBS_OUTPUT_DIR": self.tmp,
            },
            clear=False,
        )
        self.env.start()
        get_settings.cache_clear()

    def tearDown(self) -> None:
        self.env.stop()
        get_settings.cache_clear()
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _client(self, pool: Any) -> TestClient:
        # Do not enter the lifespan: we inject a fake pool directly so no real
        # Redis connection is attempted.
        from app.main import app

        client = TestClient(app)
        client.app.state.arq = pool
        return client

    def _first_preset(self, client: TestClient) -> str:
        return client.get("/tools/presets").json()["presets"][0]["id"]

    def test_submit_process_download_flow(self) -> None:
        from app.worker import process_batch_job

        fake = FakeRedis()
        client = self._client(fake)
        preset_id = self._first_preset(client)

        submit = client.post(
            "/tools/batch-jobs",
            data={"preset_ids": preset_id, "project_name": "demo"},
            files=[("files", ("a.png", _png(), "image/png"))],
        )
        self.assertEqual(submit.status_code, 202)
        job_id = submit.json()["job_id"]
        self.assertTrue(fake.enqueued)

        self.assertEqual(
            client.get(f"/tools/batch-jobs/{job_id}").json()["status"], "queued"
        )
        self.assertEqual(
            client.get(f"/tools/batch-jobs/{job_id}/download").status_code, 409
        )

        asyncio.run(process_batch_job({"redis": fake}, job_id))

        meta = client.get(f"/tools/batch-jobs/{job_id}").json()
        self.assertEqual(meta["status"], "completed")
        self.assertEqual(meta["completed_outputs"], meta["total_outputs"])

        download = client.get(f"/tools/batch-jobs/{job_id}/download")
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download.headers["content-type"], "application/zip")

    def test_strict_quality_blocks_download(self) -> None:
        from app.worker import process_batch_job

        fake = FakeRedis()
        client = self._client(fake)
        preset_id = self._first_preset(client)

        submit = client.post(
            "/tools/batch-jobs",
            data={"preset_ids": preset_id, "strict_quality": "true"},
            files=[("files", ("a.png", _png(), "image/png"))],
        )
        job_id = submit.json()["job_id"]
        asyncio.run(process_batch_job({"redis": fake}, job_id))

        self.assertEqual(
            client.get(f"/tools/batch-jobs/{job_id}").json()["status"], "blocked"
        )
        self.assertEqual(
            client.get(f"/tools/batch-jobs/{job_id}/download").status_code, 422
        )

    def test_unknown_job_returns_404(self) -> None:
        client = self._client(FakeRedis())
        self.assertEqual(
            client.get("/tools/batch-jobs/does-not-exist").status_code, 404
        )

    def test_queue_disabled_returns_503(self) -> None:
        with patch.dict(os.environ, {"REDIS_URL": ""}, clear=False):
            get_settings.cache_clear()
            client = self._client(None)
            preset_id = self._first_preset(client)
            response = client.post(
                "/tools/batch-jobs",
                data={"preset_ids": preset_id},
                files=[("files", ("a.png", _png(), "image/png"))],
            )
            self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
