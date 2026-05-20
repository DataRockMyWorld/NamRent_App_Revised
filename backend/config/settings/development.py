"""
NamRent Platform — Development Settings
"""
from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Show emails in console during development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Use local media storage in dev
USE_S3 = False

# Relax password validation for dev
AUTH_PASSWORD_VALIDATORS = []

CORS_ALLOW_ALL_ORIGINS = True
