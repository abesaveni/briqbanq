"""
AWS SQS queue infrastructure module.
For async job processing and event-driven workflows.
"""

from typing import Optional
import json

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


class QueueClient:
    """SQS queue client for async event processing."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if not self._client:
            self._client = boto3.client(
                "sqs",
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
            )
        return self._client

    async def send_message(self, message: dict, group_id: Optional[str] = None) -> str:
        """Send a message to the SQS queue."""
        if not settings.sqs_queue_url:
            return "queue_disabled"

        try:
            client = self._get_client()
            params = {
                "QueueUrl": settings.sqs_queue_url,
                "MessageBody": json.dumps(message),
            }
            if group_id:
                params["MessageGroupId"] = group_id

            response = client.send_message(**params)
            return response["MessageId"]
        except ClientError as e:
            raise RuntimeError(f"Failed to send message: {e}")


# Singleton queue client
queue_client = QueueClient()
