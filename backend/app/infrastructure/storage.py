"""
Storage infrastructure module.
Uses AWS S3 when credentials are configured, otherwise falls back to local disk.
"""

import pathlib
import uuid as _uuid
from typing import Optional

from app.core.config import settings

# Local fallback directory (created at import time)
_LOCAL_DIR = pathlib.Path(__file__).parent.parent.parent / "uploads" / "documents"
_LOCAL_DIR.mkdir(parents=True, exist_ok=True)


def _use_s3() -> bool:
    return bool(settings.aws_access_key_id and settings.aws_secret_access_key)


class StorageClient:
    """Storage client: S3 when configured, local disk otherwise."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if not self._client:
            import boto3
            self._client = boto3.client(
                "s3",
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
            )
        return self._client

    async def upload_file(
        self, file_content: bytes, key: str, content_type: str = "application/octet-stream"
    ) -> str:
        """Upload a file and return the key. Falls back to local disk if S3 fails."""
        if _use_s3():
            from botocore.exceptions import ClientError
            try:
                client = self._get_client()
                client.put_object(
                    Bucket=settings.s3_bucket_name,
                    Key=key,
                    Body=file_content,
                    ContentType=content_type,
                    ServerSideEncryption="AES256",
                )
                return key
            except ClientError:
                # S3 credentials invalid or bucket unreachable — fall through to local
                pass

        # Local fallback
        safe_name = f"{_uuid.uuid4().hex}_{pathlib.Path(key).name}"
        dest = _LOCAL_DIR / safe_name
        dest.write_bytes(file_content)
        return f"local://{safe_name}"

    async def generate_signed_url(self, key: str, expiry: int = 3600) -> str:
        """Return a URL to access the stored file."""
        if _use_s3():
            from botocore.exceptions import ClientError
            try:
                client = self._get_client()
                url = client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": settings.s3_bucket_name, "Key": key},
                    ExpiresIn=expiry,
                )
                return url
            except ClientError as e:
                raise RuntimeError(f"Failed to generate signed URL: {e}")
        else:
            # Local fallback: Detect if image or document
            if key.startswith("local://"):
                filename = key[len("local://"):]
            else:
                filename = pathlib.Path(key).name
            
            # Simple heuristic: if it's an image extension, check /images
            ext = pathlib.Path(filename).suffix.lower()
            images_dir = _LOCAL_DIR.parent / "images"
            if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"} and (images_dir / filename).exists():
                return f"/uploads/images/{filename}"
                
            return f"/uploads/documents/{filename}"

    async def delete_file(self, key: str) -> None:
        """Delete the stored file."""
        if _use_s3():
            from botocore.exceptions import ClientError
            try:
                client = self._get_client()
                client.delete_object(Bucket=settings.s3_bucket_name, Key=key)
            except ClientError as e:
                raise RuntimeError(f"Failed to delete file from S3: {e}")
        else:
            if key.startswith("local://"):
                filename = key[len("local://"):]
            else:
                filename = pathlib.Path(key).name
            dest = _LOCAL_DIR / filename
            if dest.exists():
                dest.unlink()


# Singleton storage client
storage_client = StorageClient()
