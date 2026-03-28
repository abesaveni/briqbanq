"""
Application configuration module.
All settings loaded from environment variables via Pydantic Settings.
No hardcoded configuration values allowed.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = Field(default="BrickBanq", description="Application name")
    app_env: str = Field(default="development", description="Environment")
    debug: bool = Field(default=True, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://brickbanq:brickbanq@localhost:5432/brickbanq",
        description="Async database URL",
    )
    database_url_sync: str = Field(
        default="postgresql+psycopg2://brickbanq:brickbanq@localhost:5432/brickbanq",
        description="Sync database URL for migrations",
    )

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL",
    )

    # JWT
    jwt_secret_key: str = Field(
        default="change-me-in-production",
        description="JWT secret key",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_access_token_expire_minutes: int = Field(
        default=240, description="Access token expiry in minutes"
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7, description="Refresh token expiry in days"
    )

    # AWS
    aws_region: str = Field(default="us-east-1", description="AWS region")
    aws_access_key_id: Optional[str] = Field(
        default=None, description="AWS access key ID"
    )
    aws_secret_access_key: Optional[str] = Field(
        default=None, description="AWS secret access key"
    )
    s3_bucket_name: str = Field(
        default="brickbanq-documents", description="S3 bucket name"
    )
    sqs_queue_url: Optional[str] = Field(
        default=None, description="SQS queue URL"
    )

    # Rate Limiting
    rate_limit_default: str = Field(
        default="100/minute", description="Default rate limit"
    )
    rate_limit_login: str = Field(
        default="5/minute", description="Login rate limit"
    )
    rate_limit_register: str = Field(
        default="10/minute", description="Registration rate limit"
    )

    # Email (SMTP)
    mail_username: str = Field(default="brickbanq@gmail.com", description="SMTP username")
    mail_password: Optional[str] = Field(default=None, description="SMTP password (App Password)")
    mail_from: str = Field(default="brickbanq@gmail.com", description="SMTP sender email")
    mail_port: int = Field(default=587, description="SMTP port")
    mail_server: str = Field(default="smtp.gmail.com", description="SMTP server")
    mail_tls: bool = Field(default=True, description="Use TLS")
    mail_ssl: bool = Field(default=False, description="Use SSL")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


# Singleton settings instance
settings = Settings()
