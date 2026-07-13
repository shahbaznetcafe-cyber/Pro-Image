from io import BytesIO
import unittest
from dataclasses import replace

from PIL import Image, ImageDraw

from app.image_tools.output_quality import assess_output
from app.image_tools.presets import PRESETS
from app.image_tools.processor import ProcessingOptions, process_image


class OutputQualityTests(unittest.TestCase):
    def test_processed_marketplace_output_passes_quality_gate(self) -> None:
        source = Image.new("RGB", (900, 600), (92, 92, 92))
        draw = ImageDraw.Draw(source)
        draw.ellipse((320, 50, 580, 550), fill=(225, 175, 20))
        source_buffer = BytesIO()
        source.save(source_buffer, "PNG")

        output_bytes, _ = process_image(
            source_buffer.getvalue(),
            PRESETS["amazon_main"],
            ProcessingOptions(
                cleanup_background=True,
                smart_center=True,
                subject_fill_percent=84,
            ),
        )
        result = assess_output(output_bytes, PRESETS["amazon_main"])

        self.assertEqual(result["status"], "pass")
        self.assertGreaterEqual(result["metrics"]["subject_fill_percent"], 75)
        self.assertLessEqual(result["metrics"]["subject_fill_percent"], 90)

    def test_blank_output_is_blocked(self) -> None:
        image = Image.new("RGB", (1000, 1000), "white")
        buffer = BytesIO()
        image.save(buffer, "JPEG")

        result = assess_output(buffer.getvalue(), PRESETS["daraz_square"])

        self.assertEqual(result["status"], "fail")
        self.assertTrue(
            any(check["label"] == "Product detected" for check in result["checks"])
        )

    def test_checkerboard_halo_cannot_pass_quality_gate(self) -> None:
        image = Image.new("RGBA", (600, 600), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        tile = 12
        for y in range(80, 520, tile):
            for x in range(100, 500, tile):
                color = (175, 175, 175, 255) if (x // tile + y // tile) % 2 else (225, 225, 225, 255)
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=color)
        draw.ellipse((180, 100, 420, 500), fill=(225, 115, 25, 255))
        buffer = BytesIO()
        image.save(buffer, "PNG")

        result = assess_output(buffer.getvalue(), replace(PRESETS["transparent_product"], width=600, height=600))

        self.assertNotEqual(result["status"], "pass")
        self.assertTrue(any(check["label"] == "Background remnants" and check["status"] != "pass" for check in result["checks"]))


if __name__ == "__main__":
    unittest.main()
