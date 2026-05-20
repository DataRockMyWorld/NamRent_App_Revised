from datetime import timedelta

from django.core import mail
from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import (
    Invitation,
    InvitationStatus,
    PasswordResetToken,
    User,
    UserRole,
)
from apps.accounts.tasks import (
    cleanup_expired_reset_tokens,
    expire_stale_invitations,
    send_invitation_email,
    send_password_reset_email,
)


def _make_user(email="user@test.com", role=UserRole.NAMRENT_OPS):
    return User.objects.create_user(
        email=email, password="pass", first_name="T", last_name="U", role=role
    )


class ExpireStaleInvitationsTest(TestCase):

    def setUp(self):
        self.admin = _make_user("admin@test.com", UserRole.NAMRENT_ADMIN)

    def test_past_pending_invitations_are_expired(self):
        inv = Invitation.objects.create(
            email="old@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.admin,
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        result = expire_stale_invitations()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvitationStatus.EXPIRED)
        self.assertIn("1", result)

    def test_future_invitations_are_untouched(self):
        inv = Invitation.objects.create(
            email="valid@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.admin,
            expires_at=timezone.now() + timedelta(hours=72),
        )
        expire_stale_invitations()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvitationStatus.PENDING)

    def test_already_accepted_are_untouched(self):
        inv = Invitation.objects.create(
            email="accepted@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.admin,
            expires_at=timezone.now() - timedelta(hours=1),
            status=InvitationStatus.ACCEPTED,
        )
        expire_stale_invitations()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvitationStatus.ACCEPTED)


class CleanupExpiredResetTokensTest(TestCase):

    def setUp(self):
        self.user = _make_user()

    def test_used_tokens_deleted(self):
        PasswordResetToken.objects.create(
            user=self.user,
            is_used=True,
            expires_at=timezone.now() + timedelta(hours=1),
        )
        cleanup_expired_reset_tokens()
        self.assertEqual(PasswordResetToken.objects.count(), 0)

    def test_old_expired_tokens_deleted(self):
        PasswordResetToken.objects.create(
            user=self.user,
            is_used=False,
            expires_at=timezone.now() - timedelta(hours=25),
        )
        cleanup_expired_reset_tokens()
        self.assertEqual(PasswordResetToken.objects.count(), 0)

    def test_active_unused_tokens_kept(self):
        PasswordResetToken.objects.create(
            user=self.user,
            is_used=False,
            expires_at=timezone.now() + timedelta(hours=2),
        )
        cleanup_expired_reset_tokens()
        self.assertEqual(PasswordResetToken.objects.count(), 1)


class SendInvitationEmailTest(TestCase):

    def setUp(self):
        self.admin = _make_user("admin@test.com", UserRole.NAMRENT_ADMIN)
        self.invitation = Invitation.objects.create(
            email="invitee@test.com",
            role=UserRole.CLIENT_USER,
            invited_by=self.admin,
            expires_at=timezone.now() + timedelta(hours=72),
        )

    def test_email_sent_to_invitee(self):
        send_invitation_email(str(self.invitation.id))
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("invitee@test.com", mail.outbox[0].to)

    def test_email_contains_token_link(self):
        send_invitation_email(str(self.invitation.id))
        body = mail.outbox[0].body
        self.assertIn(str(self.invitation.token), body)

    def test_nonexistent_invitation_does_not_error(self):
        import uuid
        send_invitation_email(str(uuid.uuid4()))
        self.assertEqual(len(mail.outbox), 0)


class SendPasswordResetEmailTest(TestCase):

    def setUp(self):
        self.user = _make_user("reset@test.com")
        self.token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(hours=2),
        )

    def test_email_sent_to_user(self):
        send_password_reset_email(str(self.user.id), str(self.token.token))
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("reset@test.com", mail.outbox[0].to)

    def test_email_contains_token(self):
        send_password_reset_email(str(self.user.id), str(self.token.token))
        self.assertIn(str(self.token.token), mail.outbox[0].body)

    def test_nonexistent_user_does_not_error(self):
        import uuid
        send_password_reset_email(str(uuid.uuid4()), "sometoken")
        self.assertEqual(len(mail.outbox), 0)
