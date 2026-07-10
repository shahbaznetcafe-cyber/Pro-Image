from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 40_000_000

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


async def read_and_validate_upload(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WebP images are allowed.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 15MB or smaller.")

    try:
        with Image.open(BytesIO(data)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    return data
