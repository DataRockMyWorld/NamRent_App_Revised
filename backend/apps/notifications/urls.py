from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, MarkAllReadView, MarkReadView

router = DefaultRouter()
router.register(r"", NotificationViewSet, basename="notification")

urlpatterns = [
    path("mark-all-read/", MarkAllReadView.as_view(), name="notifications-mark-all-read"),
    path("<uuid:pk>/read/", MarkReadView.as_view(), name="notification-mark-read"),
] + router.urls
