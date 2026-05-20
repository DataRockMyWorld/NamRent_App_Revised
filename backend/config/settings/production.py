"""
NamRent Platform — Production Settings
"""
from .base import *  # noqa
from decouple import config

DEBUG = False

# HTTPS enforcement
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Use SendGrid for transactional email
EMAIL_BACKEND = "sendgrid_backend.SendgridBackend"

USE_S3 = True
