from datetime import timedelta

from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from apps.accounts.models import (
    Invitation,
    InvitationStatus,
    PasswordResetToken,
    User,
    UserRole,
)
from common.test_helpers import NamRentAPITestCase


class LoginViewTest(NamRentAPITestCase):

    def setUp(self):
        self.user = self.make_user(role=UserRole.NAMRENT_OPS, password="correctpass")

    def test_login_valid_credentials_returns_tokens_and_user(self):
        res = self.client.post(reverse("auth-login"), {
            "email": self.user.email,
            "password": "correctpass",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["email"], self.user.email)

    def test_login_wrong_password_returns_401(self):
        res = self.client.post(reverse("auth-login"), {
            "email": self.user.email,
            "password": "wrongpass",
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_inactive_user_returns_401(self):
        self.user.is_active = False
        self.user.save()
        res = self.client.post(reverse("auth-login"), {
            "email": self.user.email,
            "password": "correctpass",
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class MeViewTest(NamRentAPITestCase):

    def setUp(self):
        self.user = self.make_user(role=UserRole.NAMRENT_OPS)
        self.auth(self.user)

    def test_get_me_returns_user_data(self):
        res = self.client.get(reverse("auth-me"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], self.user.email)
        self.assertIn("role", res.data)

    def test_patch_me_updates_name(self):
        res = self.client.patch(reverse("auth-me"), {"first_name": "Updated"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")

    def test_patch_me_updates_dark_mode(self):
        res = self.client.patch(reverse("auth-me"), {"dark_mode": True})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.dark_mode)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(reverse("auth-me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordViewTest(NamRentAPITestCase):

    def setUp(self):
        self.user = self.make_user(password="oldpass123")
        self.auth(self.user)

    def test_change_password_success(self):
        res = self.client.post(reverse("auth-change-password"), {
            "current_password": "oldpass123",
            "new_password": "newpass456!",
            "confirm_password": "newpass456!",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass456!"))

    def test_wrong_current_password_returns_400(self):
        res = self.client.post(reverse("auth-change-password"), {
            "current_password": "wrongcurrent",
            "new_password": "newpass456!",
            "confirm_password": "newpass456!",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mismatched_new_passwords_returns_400(self):
        res = self.client.post(reverse("auth-change-password"), {
            "current_password": "oldpass123",
            "new_password": "newpass456!",
            "confirm_password": "different456!",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class ForgotPasswordViewTest(NamRentAPITestCase):

    def setUp(self):
        self.user = self.make_user(email="reset@test.com")

    def test_known_email_sends_email(self):
        self.client.post(reverse("auth-forgot-password"), {"email": "reset@test.com"})
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("reset@test.com", mail.outbox[0].to)

    def test_known_email_creates_reset_token(self):
        self.client.post(reverse("auth-forgot-password"), {"email": "reset@test.com"})
        self.assertTrue(PasswordResetToken.objects.filter(user=self.user).exists())

    def test_unknown_email_returns_200_without_sending(self):
        res = self.client.post(reverse("auth-forgot-password"), {"email": "nobody@test.com"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)


class ResetPasswordViewTest(NamRentAPITestCase):

    def setUp(self):
        self.user = self.make_user(email="reset2@test.com", password="oldpass")
        self.token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(hours=2),
        )

    def test_reset_password_success(self):
        res = self.client.post(reverse("auth-reset-password"), {
            "token": str(self.token.token),
            "new_password": "brandnewpass1",
            "confirm_password": "brandnewpass1",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("brandnewpass1"))

    def test_reset_marks_token_as_used(self):
        self.client.post(reverse("auth-reset-password"), {
            "token": str(self.token.token),
            "new_password": "brandnewpass1",
            "confirm_password": "brandnewpass1",
        })
        self.token.refresh_from_db()
        self.assertTrue(self.token.is_used)

    def test_expired_token_returns_400(self):
        self.token.expires_at = timezone.now() - timedelta(hours=1)
        self.token.save()
        res = self.client.post(reverse("auth-reset-password"), {
            "token": str(self.token.token),
            "new_password": "brandnewpass1",
            "confirm_password": "brandnewpass1",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_used_token_returns_400(self):
        self.token.is_used = True
        self.token.save()
        res = self.client.post(reverse("auth-reset-password"), {
            "token": str(self.token.token),
            "new_password": "brandnewpass1",
            "confirm_password": "brandnewpass1",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class InvitationViewTest(NamRentAPITestCase):

    def setUp(self):
        self.admin = self.make_user(role=UserRole.NAMRENT_ADMIN, email="admin@test.com")
        self.ops = self.make_user(role=UserRole.NAMRENT_OPS, email="ops@test.com")

    def test_admin_can_send_invitation(self):
        self.auth(self.admin)
        res = self.client.post(reverse("auth-invitations"), {
            "email": "invitee@test.com",
            "role": UserRole.CLIENT_USER,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Invitation.objects.filter(email="invitee@test.com").exists())

    def test_sending_invitation_dispatches_email(self):
        self.auth(self.admin)
        self.client.post(reverse("auth-invitations"), {
            "email": "invitee2@test.com",
            "role": UserRole.CLIENT_USER,
        })
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("invitee2@test.com", mail.outbox[0].to)

    def test_ops_cannot_send_invitation(self):
        self.auth(self.ops)
        res = self.client.post(reverse("auth-invitations"), {
            "email": "invitee3@test.com",
            "role": UserRole.CLIENT_USER,
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_pending_invitation_rejected(self):
        self.auth(self.admin)
        self.client.post(reverse("auth-invitations"), {
            "email": "dup@test.com",
            "role": UserRole.CLIENT_USER,
        })
        res = self.client.post(reverse("auth-invitations"), {
            "email": "dup@test.com",
            "role": UserRole.CLIENT_USER,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_existing_user_email_rejected(self):
        self.auth(self.admin)
        res = self.client.post(reverse("auth-invitations"), {
            "email": self.ops.email,
            "role": UserRole.CLIENT_USER,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class AcceptInvitationViewTest(NamRentAPITestCase):

    def setUp(self):
        self.inviter = self.make_user(role=UserRole.NAMRENT_ADMIN, email="inviter@test.com")
        self.invitation = Invitation.objects.create(
            email="new@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.inviter,
            expires_at=timezone.now() + timedelta(hours=72),
        )

    def _accept_url(self):
        return reverse("auth-accept-invitation", kwargs={"token": self.invitation.token})

    def test_accept_creates_user_and_returns_tokens(self):
        res = self.client.post(self._accept_url(), {
            "first_name": "John",
            "last_name": "Doe",
            "password": "securepass123",
            "confirm_password": "securepass123",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertTrue(User.objects.filter(email="new@test.com").exists())

    def test_accept_marks_invitation_accepted(self):
        self.client.post(self._accept_url(), {
            "first_name": "John",
            "last_name": "Doe",
            "password": "securepass123",
            "confirm_password": "securepass123",
        })
        self.invitation.refresh_from_db()
        self.assertEqual(self.invitation.status, InvitationStatus.ACCEPTED)

    def test_accept_assigns_correct_role(self):
        self.client.post(self._accept_url(), {
            "first_name": "John",
            "last_name": "Doe",
            "password": "securepass123",
            "confirm_password": "securepass123",
        })
        user = User.objects.get(email="new@test.com")
        self.assertEqual(user.role, UserRole.CLIENT_USER)

    def test_accept_expired_invitation_returns_400(self):
        self.invitation.expires_at = timezone.now() - timedelta(hours=1)
        self.invitation.save()
        res = self.client.post(self._accept_url(), {
            "first_name": "John",
            "last_name": "Doe",
            "password": "securepass123",
            "confirm_password": "securepass123",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_with_client_id_creates_client_user_link(self):
        client_entity = self.make_client_entity("Linked Corp")
        self.invitation.client_id = client_entity.id
        self.invitation.role = UserRole.CLIENT_USER
        self.invitation.save()
        self.client.post(self._accept_url(), {
            "first_name": "Jane",
            "last_name": "Smith",
            "password": "securepass123",
            "confirm_password": "securepass123",
        })
        from apps.clients.models import ClientUser
        user = User.objects.get(email="new@test.com")
        self.assertTrue(ClientUser.objects.filter(user=user, client=client_entity).exists())
