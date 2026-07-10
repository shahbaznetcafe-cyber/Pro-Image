from io import BytesIO
import unittest

from PIL import Image, ImageDraw

from app.image_tools.presets import PRESETS
from app.image_tools.processor import ProcessingOptions, process_image


class ProcessorTests(unittest.TestCase):
    def test_fake_checkerboard_is_removed_and_subject_is_scaled(self) -> None:
        source = Image.new("RGB", (900, 500), "white")
        draw = ImageDraw.Draw(source)
        tile = 20
        for y in range(0, source.height, tile):
            for x in range(0, source.width, tile):
                color = (222, 222, 222) if (x // tile + y // tile) % 2 else (242, 242, 242)
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=color)

        draw.ellipse((340, 60, 560, 450), fill=(235, 190, 20))
        draw.ellipse((395, 165, 435, 205), fill="white")
        draw.ellipse((465, 165, 505, 205), fill="white")
        draw.rectangle((820, 410, 850, 440), fill=(160, 160, 160))

        source_buffer = BytesIO()
        source.save(source_buffer, "PNG")
        output_bytes, report = process_image(
            source_buffer.getvalue(),
            PRESETS["transparent_product"],
            ProcessingOptions(cleanup_background=True, smart_center=True),
        )

        output = Image.open(BytesIO(output_bytes)).convert("RGBA")
        alpha = output.getchannel("A")
        bounds = alpha.getbbox()

        self.assertEqual(report["cleanup_method"], "central_subject")
        self.assertEqual(report["subject_fill_percent"], 84)
        self.assertIsNotNone(bounds)
        assert bounds is not None
        self.assertLess(bounds[2] - bounds[0], 1000)
        self.assertGreater(bounds[3] - bounds[1], 1250)
        self.assertEqual(alpha.getpixel((80, 800)), 0)
        self.assertEqual(alpha.getpixel((1520, 800)), 0)

    def test_clean_source_alpha_is_preserved(self) -> None:
        source = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
        ImageDraw.Draw(source).ellipse((100, 40, 400, 460), fill=(20, 120, 210, 255))
        source_buffer = BytesIO()
        source.save(source_buffer, "PNG")

        _, report = process_image(
            source_buffer.getvalue(),
            PRESETS["transparent_product"],
            ProcessingOptions(cleanup_background=True, smart_center=True),
        )

        self.assertEqual(report["cleanup_method"], "source_alpha")

    def test_checkerboard_cleanup_produces_real_white_marketplace_canvas(self) -> None:
        source = Image.new("RGB", (900, 500), "white")
        draw = ImageDraw.Draw(source)
        tile = 20
        for y in range(0, source.height, tile):
            for x in range(0, source.width, tile):
                color = (222, 222, 222) if (x // tile + y // tile) % 2 else (242, 242, 242)
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=color)
        draw.ellipse((340, 60, 560, 450), fill=(235, 190, 20))

        source_buffer = BytesIO()
        source.save(source_buffer, "PNG")
        output_bytes, _ = process_image(
            source_buffer.getvalue(),
            PRESETS["amazon_main"],
            ProcessingOptions(cleanup_background=True, smart_center=True),
        )

        output = Image.open(BytesIO(output_bytes)).convert("RGB")
        self.assertEqual(output.getpixel((0, 0)), (255, 255, 255))
        self.assertEqual(output.getpixel((1999, 1999)), (255, 255, 255))


if __name__ == "__main__":
    unittest.main()
