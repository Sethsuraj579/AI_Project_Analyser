"""
Django settings for project_analyser project.
AI Project Analyser - Django + GraphQL Backend
Production-ready configuration with environment-based secrets.
"""
import os
import environ
import sentry_sdk
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ──────────────────────────────────────────────────────────────
# Environment variables (loaded from .env file)
# ──────────────────────────────────────────────────────────────
env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"]),
)
env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")

DEBUG = env("DJANGO_DEBUG")

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "graphene_django",
    "graphql_jwt.refresh_token.apps.RefreshTokenConfig",
    # Local
    "analyser",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "project_analyser.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "project_analyser.wsgi.application"

# ──────────────────────────────────────────────────────────────
# Database — PostgreSQL via Neon (falls back to SQLite for local dev)
# ──────────────────────────────────────────────────────────────
# Get database URL from environment or use SQLite for local development
DATABASE_URL = env("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")

# Configure database based on URL
if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
    DATABASES = {
        "default": {
            **env.db_url("DATABASE_URL"),
            "CONN_MAX_AGE": 0,  # Don't persist connections with Neon pooler
            "OPTIONS": {
                "sslmode": "require",
                "connect_timeout": 10,
            }
        }
    }
else:
    DATABASES = {
        "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ──────────────────────────────────────────────────────────────
# Authentication — JWT via django-graphql-jwt
# ──────────────────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    "graphql_jwt.backends.JSONWebTokenBackend",
    "django.contrib.auth.backends.ModelBackend",
]

GRAPHQL_JWT = {
    "JWT_VERIFY_EXPIRATION": True,
    "JWT_EXPIRATION_DELTA": timedelta(hours=24),
    "JWT_REFRESH_EXPIRATION_DELTA": timedelta(days=7),
    "JWT_AUTH_HEADER_PREFIX": "Bearer",
}

# ──────────────────────────────────────────────────────────────
# Google OAuth
# ──────────────────────────────────────────────────────────────
GOOGLE_OAUTH_CLIENT_ID = env("GOOGLE_OAUTH_CLIENT_ID", default="")

# ──────────────────────────────────────────────────────────────
# Razorpay
# ──────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID = env("RAZORPAY_KEY_ID", default="")
RAZORPAY_KEY_SECRET = env("RAZORPAY_KEY_SECRET", default="")
RAZORPAY_WEBHOOK_SECRET = env("RAZORPAY_WEBHOOK_SECRET", default="")

# ──────────────────────────────────────────────────────────────
# Email — console backend for dev, SMTP for production
# ──────────────────────────────────────────────────────────────
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
    EMAIL_PORT = env.int("EMAIL_PORT", default=587)
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
    EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="AI Project Analyser <noreply@analyser.local>")

# ──────────────────────────────────────────────────────────────
# CORS — production-safe origins
# ──────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────────────────────
# GraphQL — Graphene + JWT middleware
# ──────────────────────────────────────────────────────────────
GRAPHENE = {
    "SCHEMA": "project_analyser.schema.schema",
    "MIDDLEWARE": [
        "graphql_jwt.middleware.JSONWebTokenMiddleware",
    ],
}

# ──────────────────────────────────────────────────────────────
# Celery — async task queue backed by Redis (Upstash)
# ──────────────────────────────────────────────────────────────
import certifi

REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")

# Add ssl_cert_reqs parameter for rediss:// URLs with proper certificate validation
if REDIS_URL.startswith("rediss://"):
    if "ssl_cert_reqs" not in REDIS_URL:
        CELERY_BROKER_URL = f"{REDIS_URL}?ssl_cert_reqs=CERT_REQUIRED&ssl_ca_certs={certifi.where()}"
        CELERY_RESULT_BACKEND = f"{REDIS_URL}?ssl_cert_reqs=CERT_REQUIRED&ssl_ca_certs={certifi.where()}"
    else:
        CELERY_BROKER_URL = REDIS_URL
        CELERY_RESULT_BACKEND = REDIS_URL
else:
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 300  # 5 min hard limit per task
CELERY_WORKER_POOL = "solo"  # Use solo pool on Windows to avoid multiprocessing issues

# ──────────────────────────────────────────────────────────────
# Sentry — error monitoring
# ──────────────────────────────────────────────────────────────
# environ.Env has issues parsing URLs with @, so fallback to manual parsing
SENTRY_DSN = env("SENTRY_DSN", default="")
if not SENTRY_DSN:
    # Fallback: manually parse .env for SENTRY_DSN
    try:
        with open(BASE_DIR / ".env", "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("SENTRY_DSN="):
                    SENTRY_DSN = line.split("=", 1)[1]
                    break
    except Exception:
        SENTRY_DSN = ""
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.2 if not DEBUG else 1.0,
        profiles_sample_rate=0.1,
        send_default_pii=False,
        default_integrations=False,
        environment="development" if DEBUG else "production",
    )

# ──────────────────────────────────────────────────────────────
# Logging — structured JSON logs
# ──────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.json.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
        },
        "verbose": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose" if DEBUG else "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "graphene": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "analyser": {"handlers": ["console"], "level": "DEBUG" if DEBUG else "INFO", "propagate": False},
        "celery": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

# ──────────────────────────────────────────────────────────────
# Security hardening
# ──────────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0  # 1 year in production
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
