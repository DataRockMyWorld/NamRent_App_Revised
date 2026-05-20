from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Invitation, InvitationStatus, PasswordResetToken, User, UserRole


class UserModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="jane@test.com",
            password="testpass",
            first_name="Jane",
            last_name="Doe",
            role=UserRole.NAMRENT_OPS,
        )

    def test_get_full_name(self):
        self.assertEqual(self.user.get_full_name(), "Jane Doe")

    def test_str_contains_name_and_email(self):
        self.assertIn("Jane Doe", str(self.user))
        self.assertIn("jane@test.com", str(self.user))

    def test_is_namrent_staff_for_ops(self):
        self.assertTrue(self.user.is_namrent_staff)

    def test_is_namrent_staff_for_admin(self):
        self.user.role = UserRole.NAMRENT_ADMIN
        self.assertTrue(self.user.is_namrent_staff)

    def test_is_namrent_staff_false_for_client(self):
        self.user.role = UserRole.CLIENT_USER
        self.assertFalse(self.user.is_namrent_staff)

    def test_is_client_for_client_admin(self):
        self.user.role = UserRole.CLIENT_ADMIN
        self.assertTrue(self.user.is_client)

    def test_is_client_for_client_user(self):
        self.user.role = UserRole.CLIENT_USER
        self.assertTrue(self.user.is_client)

    def test_is_client_false_for_staff(self):
        self.assertFalse(self.user.is_client)

    def test_is_dealer(self):
        self.user.role = UserRole.DEALER_ADMIN
        self.assertTrue(self.user.is_dealer)

    def test_is_dealer_false_for_others(self):
        self.assertFalse(self.user.is_dealer)


class InvitationModelTest(TestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="pass",
            first_name="Admin",
            last_name="User",
            role=UserRole.NAMRENT_ADMIN,
        )

    def test_default_status_is_pending(self):
        inv = Invitation.objects.create(
            email="new@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.admin,
            expires_at=timezone.now() + timedelta(hours=72),
        )
        self.assertEqual(inv.status, InvitationStatus.PENDING)

    def test_token_is_auto_generated(self):
        inv = Invitation.objects.create(
            email="new2@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.admin,
            expires_at=timezone.now() + timedelta(hours=72),
        )
        self.assertIsNotNone(inv.token)

    def test_str(self):
        inv = Invitation.objects.create(
            email="new3@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.admin,
            expires_at=timezone.now() + timedelta(hours=72),
        )
        self.assertIn("new3@test.com", str(inv))
