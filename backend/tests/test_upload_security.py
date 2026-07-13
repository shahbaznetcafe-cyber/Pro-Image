import asyncio
import unittest
from io import BytesIO

from fastapi import HTTPException
from PIL import Image
from starlette.datastructures import Headers, UploadFile

from app.image_tools.security import read_and_validate_upload


def _upload(data: bytes, content_type: str = "image/png", filename: str = "x.png") -> UploadFile:
    return UploadFile(
        file=BytesIO(data),
        filename=filename,
        headers=Headers({"content-type": content_type}),
    )


def _real_png() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (10, 10), "white").save(buffer, "PNG")
    return buffer.getvalue()


class UploadSecurityTests(unittest.TestCase):
    def test_accepts_real_png(self) -> None:
        data = _real_png()
        result = asyncio.run(read_and_validate_upload(_upload(data)))
        self.assertEqual(result, data)

    def test_rejects_spoofed_content_type(self) -> None:
        # Bytes are not an image, but the header claims image/png.
        with self.assertRaises(HTTPException) as context:
            asyncio.run(
                read_and_validate_upload(_upload(b"this is definitely not an image"))
            )
        self.assertEqual(context.exception.status_code, 400)

    def test_rejects_disallowed_content_type(self) -> None:
        with self.assertRaises(HTTPException) as context:
            asyncio.run(
                read_and_validate_upload(_upload(b"%PDF-1.4", "application/pdf"))
            )
        self.assertEqual(context.exception.status_code, 400)

    def test_rejects_empty_file(self) -> None:
        with self.assertRaises(HTTPException) as context:
            asyncio.run(read_and_validate_upload(_upload(b"")))
        self.assertEqual(context.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
