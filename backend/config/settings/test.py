"""
NamRent Platform — Test Settings
Fast, isolated settings for running the test suite.
"""
from .base import *  # noqa

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "namrent_test",
        "USER": "namrent",
        "PASSWORD": "",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

# Fast password hashing for tests
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

USE_S3 = False

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
