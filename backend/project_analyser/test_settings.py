"""
Test settings — uses SQLite so tests can create/destroy test databases
without needing CREATE DATABASE privileges on Neon PostgreSQL.
"""
from .settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test.sqlite3",
    }
}

# Avoid https redirects in tests.
DEBUG = True
SECURE_SSL_REDIRECT = False

# Allow the default Django test client host.
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]

# Disable Sentry during tests
SENTRY_DSN = ""
import sentry_sdk

# Keep Sentry disabled even if settings.py initialized it.
if hasattr(sentry_sdk, 'get_client'):
    # sentry-sdk 2.x
    client = sentry_sdk.get_client()
    if client.is_active():
        client.close()
else:
    # sentry-sdk 1.x fallback
    sentry_sdk.Hub.current.bind_client(None)

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
