from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db.models import Q
from django.utils import timezone


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_invitation_email(self, invitation_id):
    from .models import Invitation

    try:
        invitation = Invitation.objects.get(id=invitation_id)
    except Invitation.DoesNotExist:
        return

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    accept_url = f"{frontend_url}/accept-invitation/{invitation.token}"
    role_display = dict(invitation.role_choices()).get(invitation.role, invitation.role) if hasattr(invitation, "role_choices") else invitation.role

    subject = "You've been invited to NamRent"
    text_body = (
        f"Hello,\n\n"
        f"You have been invited to join the NamRent platform as {invitation.role}.\n\n"
        f"Click the link below to set up your account. This link expires in 72 hours:\n"
        f"{accept_url}\n\n"
        f"If you did not expect this invitation, you can safely ignore this email.\n\n"
        f"— The NamRent Team"
    )
    html_body = f"""
<p>Hello,</p>
<p>You have been invited to join the <strong>NamRent</strong> platform as <strong>{invitation.role}</strong>.</p>
<p>
  <a href="{accept_url}"
     style="display:inline-block;padding:10px 20px;background:#1D4ED8;color:#fff;text-decoration:none;border-radius:4px;">
    Accept Invitation
  </a>
</p>
<p>This link expires in 72 hours.</p>
<p>If you did not expect this invitation, you can safely ignore this email.</p>
<p>— The NamRent Team</p>
"""

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[invitation.email],
    )
    msg.attach_alternative(html_body, "text/html")

    try:
        msg.send()
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, user_id, token_str):
    from .models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_url = f"{frontend_url}/reset-password/{token_str}"

    subject = "Reset your NamRent password"
    text_body = (
        f"Hi {user.first_name},\n\n"
        f"We received a request to reset your NamRent password.\n\n"
        f"Click the link below to choose a new password. This link expires in 2 hours:\n"
        f"{reset_url}\n\n"
        f"If you didn't request a password reset, you can safely ignore this email — your password won't change.\n\n"
        f"— The NamRent Team"
    )
    html_body = f"""
<p>Hi {user.first_name},</p>
<p>We received a request to reset your <strong>NamRent</strong> password.</p>
<p>
  <a href="{reset_url}"
     style="display:inline-block;padding:10px 20px;background:#1D4ED8;color:#fff;text-decoration:none;border-radius:4px;">
    Reset Password
  </a>
</p>
<p>This link expires in 2 hours.</p>
<p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
<p>— The NamRent Team</p>
"""

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_body, "text/html")

    try:
        msg.send()
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def expire_stale_invitations():
    from .models import Invitation, InvitationStatus

    updated = Invitation.objects.filter(
        status=InvitationStatus.PENDING,
        expires_at__lt=timezone.now(),
    ).update(status=InvitationStatus.EXPIRED)

    return f"Expired {updated} stale invitation(s)"


@shared_task
def cleanup_expired_reset_tokens():
    from .models import PasswordResetToken

    cutoff = timezone.now() - timedelta(hours=24)
    deleted, _ = PasswordResetToken.objects.filter(
        Q(is_used=True) | Q(expires_at__lt=cutoff)
    ).delete()

    return f"Deleted {deleted} expired/used password reset token(s)"
