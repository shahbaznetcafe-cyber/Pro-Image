import unittest
from io import BytesIO
from unittest.mock import AsyncMock, patch

from PIL import Image, ImageDraw
from starlette.testclient import TestClient

from app.integrations.saas import UsageReservation
from app.main import app

_DEV_RESERVATION = UsageReservation(None, "development", 0, 0, 0, 30, None)


def _blank_jpg() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (1000, 1000), "white").save(buffer, "JPEG")
    return buffer.getvalue()


def _product_png() -> bytes:
    image = Image.new("RGB", (900, 600), (92, 92, 92))
    ImageDraw.Draw(image).ellipse((320, 50, 580, 550), fill=(225, 175, 20))
    buffer = BytesIO()
    image.save(buffer, "PNG")
    return buffer.getvalue()


class QuotaPolicyTests(unittest.TestCase):
    def test_strict_block_does_not_reserve_quota(self) -> None:
        client = TestClient(app)
        with patch(
            "app.image_tools.routes.reserve_usage",
            new=AsyncMock(return_value=_DEV_RESERVATION),
        ) as reserve:
            response = client.post(
                "/tools/generate-seller-pack",
                data={"preset_ids": "daraz_square", "strict_quality": "true"},
                files={"file": ("p.jpg", _blank_jpg(), "image/jpeg")},
            )

        self.assertEqual(response.status_code, 422)
        reserve.assert_not_called()

    def test_successful_pack_reserves_quota(self) -> None:
        client = TestClient(app)
        with patch(
            "app.image_tools.routes.reserve_usage",
            new=AsyncMock(return_value=_DEV_RESERVATION),
        ) as reserve:
            response = client.post(
                "/tools/generate-seller-pack",
                data={
                    "preset_ids": "amazon_main",
                    "strict_quality": "true",
                    "cleanup_background": "true",
                    "smart_center": "true",
                },
                files={"file": ("p.png", _product_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 200)
        reserve.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
