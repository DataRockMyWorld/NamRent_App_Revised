from django.urls import reverse
from rest_framework import status

from apps.accounts.models import UserRole
from apps.notifications.models import Notification, NotificationType, notify
from common.test_helpers import NamRentAPITestCase


class NotificationViewTest(NamRentAPITestCase):

    def setUp(self):
        self.user = self.make_user(role=UserRole.NAMRENT_OPS, email="ops@test.com")
        self.other = self.make_user(role=UserRole.NAMRENT_OPS, email="other@test.com")
        self.auth(self.user)

        # Create two notifications for self.user
        notify(self.user, NotificationType.GENERAL, "First", "Body 1")
        notify(self.user, NotificationType.GENERAL, "Second", "Body 2")
        # One notification for other user
        notify(self.other, NotificationType.GENERAL, "Other", "Other body")

    def test_user_sees_only_own_notifications(self):
        res = self.client.get(reverse("notification-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 2)

    def test_unread_filter(self):
        res = self.client.get(reverse("notification-list"), {"is_read": "false"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 2)

    def test_mark_single_notification_read(self):
        notif = Notification.objects.filter(recipient=self.user).first()
        url = reverse("notification-mark-read", kwargs={"pk": notif.id})
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
        self.assertIsNotNone(notif.read_at)

    def test_mark_all_read(self):
        res = self.client.post(reverse("notifications-mark-all-read"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["marked_read"], 2)
        self.assertEqual(Notification.objects.filter(recipient=self.user, is_read=False).count(), 0)

    def test_cannot_mark_other_users_notification_read(self):
        other_notif = Notification.objects.filter(recipient=self.other).first()
        url = reverse("notification-mark-read", kwargs={"pk": other_notif.id})
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_read_filter_returns_only_read(self):
        notif = Notification.objects.filter(recipient=self.user).first()
        url = reverse("notification-mark-read", kwargs={"pk": notif.id})
        self.client.post(url)

        res = self.client.get(reverse("notification-list"), {"is_read": "true"})
        self.assertEqual(res.data["count"], 1)
