import json
import unittest
import zipfile
from dataclasses import replace
from io import BytesIO

from PIL import Image, ImageDraw

from app.image_tools.connectors import CONNECTORS, connector_status
from app.image_tools.output_quality import assess_output
from app.image_tools.presets import PRESETS
from app.image_tools.processor import ProcessingOptions, process_image
from app.image_tools.routes import _build_zip


class MarketplacePresetTests(unittest.TestCase):
    def _source(self) -> bytes:
        image = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
        ImageDraw.Draw(image).rounded_rectangle((100, 50, 400, 450), radius=45, fill=(35, 115, 70, 255))
        buffer = BytesIO()
        image.save(buffer, "PNG")
        return buffer.getvalue()

    def test_global_marketplace_catalog_is_available(self) -> None:
        expected = {
            "amazon_main", "walmart_main", "ebay_main", "mercadolibre_main",
            "noon_main", "allegro_main", "kaufland_main", "coupang_main",
            "aliexpress_square", "zalando_packshot", "shopee_main", "lazada_main",
        }
        self.assertTrue(expected.issubset(PRESETS))
        self.assertGreaterEqual(len(PRESETS), 27)

    def test_policy_file_size_limit_is_enforced(self) -> None:
        output, _ = process_image(
            self._source(),
            PRESETS["amazon_main"],
            ProcessingOptions(cleanup_background=True, smart_center=True, subject_fill_percent=85),
        )
        tiny_limit = replace(PRESETS["amazon_main"], max_file_bytes=10)
        result = assess_output(output, tiny_limit)
        self.assertEqual(result["status"], "fail")
        self.assertTrue(any(check["label"] == "File size" and check["status"] == "fail" for check in result["checks"]))

    def test_connector_status_does_not_expose_secret_values(self) -> None:
        result = connector_status(CONNECTORS["amazon_sp_api"])
        self.assertIn(result["status"], {"ready", "setup_required"})
        self.assertNotIn("secret", result)
        self.assertNotIn("values", result)

    def test_zip_contains_policy_and_connector_manifest(self) -> None:
        zip_path, _ = _build_zip(
            project_slug="marketplace-test",
            image_inputs=[{"filename": "product.png", "image_bytes": self._source(), "product_slug": "product"}],
            presets=[PRESETS["amazon_main"], PRESETS["shopee_main"]],
            options=ProcessingOptions(cleanup_background=True, smart_center=True, subject_fill_percent=85),
        )
        try:
            with zipfile.ZipFile(zip_path) as archive:
                manifest = json.loads(archive.read("marketplace-test/marketplace-manifest.json"))
            self.assertEqual(manifest["schema_version"], "1.0")
            self.assertEqual(len(manifest["presets"]), 2)
            self.assertEqual(manifest["presets"][0]["connector"]["id"], "amazon_sp_api")
            self.assertEqual(manifest["presets"][1]["confidence"], "regional")
        finally:
            zip_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
