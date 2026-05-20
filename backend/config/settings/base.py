"""
NamRent Platform — Base Settings
Common settings shared across all environments.
"""
from pathlib import Path
from datetime import timedelta
from celery.schedules import crontab
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("SECRET_KEY", default="django-insecure-change-me-in-production")

DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "storages",
    "django_celery_beat",
    "drf_spectacular",
]

LOCAL_APPS = [
    "common",
    "apps.accounts",
    "apps.clients",
    "apps.dealers",
    "apps.vehicles",
    "apps.service_requests",
    "apps.procurement",
    "apps.tradeins",
    "apps.maintenance",
    "apps.contracts",
    "apps.invoices",
    "apps.documents",
    "apps.notifications",
    "apps.activity",
    "apps.reports",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
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

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database — PostgreSQL
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="namrent"),
        "USER": config("DB_USER", default="namrent"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "OPTIONS": {"connect_timeout": 10},
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Windhoek"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & Media
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "EXCEPTION_HANDLER": "common.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

# ---------------------------------------------------------------------------
# JWT — 30 min access token aligns with session idle timeout
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = config("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("REDIS_URL", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# ---------------------------------------------------------------------------
# Email — SendGrid
# ---------------------------------------------------------------------------
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
SENDGRID_API_KEY = config("SENDGRID_API_KEY", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="NamRent <no-reply@namrent.com>")
SERVER_EMAIL = config("SERVER_EMAIL", default="no-reply@namrent.com")

# ---------------------------------------------------------------------------
# File Storage
# DigitalOcean Spaces (S3-compatible). To migrate to AWS S3, change the four
# SPACES_* env vars — no code changes required.
# ---------------------------------------------------------------------------
USE_S3 = config("USE_S3", default=False, cast=bool)

if USE_S3:
    AWS_ACCESS_KEY_ID = config("SPACES_ACCESS_KEY")
    AWS_SECRET_ACCESS_KEY = config("SPACES_SECRET_KEY")
    AWS_STORAGE_BUCKET_NAME = config("SPACES_BUCKET_NAME")
    AWS_S3_ENDPOINT_URL = config("SPACES_ENDPOINT_URL")  # https://ams3.digitaloceanspaces.com
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
    AWS_DEFAULT_ACL = "private"
    AWS_S3_FILE_OVERWRITE = False
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"

# ---------------------------------------------------------------------------
# DRF Spectacular — API docs
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "NamRent API",
    "DESCRIPTION": "Vehicle access, leasing, trade-in, and fleet management platform.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# ---------------------------------------------------------------------------
# Security headers (tightened further in production.py)
# ---------------------------------------------------------------------------
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True

# ---------------------------------------------------------------------------
# Frontend URL — used in email links (invitations, password reset)
# ---------------------------------------------------------------------------
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")

# ---------------------------------------------------------------------------
# Celery Beat Schedule
# Periodic tasks are seeded into the DatabaseScheduler on first run.
# Times are in the project timezone (Africa/Windhoek).
# ---------------------------------------------------------------------------
CELERY_BEAT_SCHEDULE = {
    "send-vehicle-expiry-reminders": {
        "task": "apps.vehicles.tasks.send_vehicle_expiry_reminders",
        "schedule": crontab(hour=7, minute=0),
    },
    "mark-overdue-invoices": {
        "task": "apps.invoices.tasks.mark_overdue_invoices",
        "schedule": crontab(hour=6, minute=0),
    },
    "send-contract-expiry-reminders": {
        "task": "apps.contracts.tasks.send_contract_expiry_reminders",
        "schedule": crontab(hour=7, minute=30),
    },
    "expire-stale-invitations": {
        "task": "apps.accounts.tasks.expire_stale_invitations",
        "schedule": crontab(hour=1, minute=0),
    },
    "cleanup-expired-reset-tokens": {
        "task": "apps.accounts.tasks.cleanup_expired_reset_tokens",
        "schedule": crontab(hour=1, minute=30),
    },
}

# ---------------------------------------------------------------------------
# App-level constants
# ---------------------------------------------------------------------------
FILE_UPLOAD_MAX_SIZE_MB = 20  # Enforced in document serializer
