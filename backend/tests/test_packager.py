import tempfile
import unittest
import zipfile
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw

from app.image_tools.packager import StrictQualityBlocked, build_seller_pack_zip
from app.image_tools.presets import PRESETS
from app.image_tools.processor import ProcessingOptions


def _product_png() -> bytes:
    image = Image.new("RGB", (900, 600), (92, 92, 92))
    ImageDraw.Draw(image).ellipse((320, 50, 580, 550), fill=(225, 175, 20))
    buffer = BytesIO()
    image.save(buffer, "PNG")
    return buffer.getvalue()


def _blank_png() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (1000, 1000), "white").save(buffer, "JPEG")
    return buffer.getvalue()


class PackagerTests(unittest.TestCase):
    def _inputs(self, data: bytes) -> list[dict]:
        return [{"filename": "p.png", "image_bytes": data, "product_slug": "p"}]

    def test_builds_zip_with_report_manifest_and_progress(self) -> None:
        progress: list[tuple[int, int]] = []
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "out.zip"
            report = build_seller_pack_zip(
                output,
                project_slug="demo",
                image_inputs=self._inputs(_product_png()),
                presets=[PRESETS["amazon_main"]],
                options=ProcessingOptions(cleanup_background=True, smart_center=True),
                progress_cb=lambda completed, total: progress.append((completed, total)),
            )

            self.assertTrue(output.exists())
            with zipfile.ZipFile(output) as archive:
                names = archive.namelist()

            self.assertIn("demo/report.json", names)
            self.assertIn("demo/marketplace-manifest.json", names)
            self.assertTrue(
                any(name.endswith(PRESETS["amazon_main"].filename) for name in names)
            )

        self.assertEqual(report["output_count"], 1)
        self.assertEqual(progress[-1], (1, 1))

    def test_strict_quality_block_raises_and_removes_zip(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "out.zip"
            with self.assertRaises(StrictQualityBlocked) as context:
                build_seller_pack_zip(
                    output,
                    project_slug="demo",
                    image_inputs=self._inputs(_blank_png()),
                    presets=[PRESETS["daraz_square"]],
                    strict_quality=True,
                )

            self.assertTrue(context.exception.failed_outputs)
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
