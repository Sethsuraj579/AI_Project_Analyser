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

# Disable Sentry during tests
SENTRY_DSN = ""

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
