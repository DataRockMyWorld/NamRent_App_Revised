from datetime import timedelta

from celery import shared_task
from django.utils import timezone

# Notify at these intervals (days before contract end date)
EXPIRY_WINDOWS = [30, 60]


@shared_task
def send_contract_expiry_reminders():
    from apps.notifications.models import NotificationType, notify
    from apps.accounts.models import User, UserRole
    from .models import Contract, ContractStatus, RenewalStatus

    today = timezone.now().date()
    staff = list(
        User.objects.filter(
            role__in=[UserRole.NAMRENT_ADMIN, UserRole.NAMRENT_OPS],
            is_active=True,
        )
    )
    count = 0

    for days in EXPIRY_WINDOWS:
        target = today + timedelta(days=days)

        for contract in Contract.objects.filter(
            status=ContractStatus.ACTIVE,
            end_date=target,
        ).select_related("client"):
            # Transition renewal status to PENDING on first reminder
            if contract.renewal_status == RenewalStatus.NOT_DUE:
                contract.renewal_status = RenewalStatus.PENDING
                contract.renewal_reminder_sent_at = timezone.now()
                contract.save(update_fields=["renewal_status", "renewal_reminder_sent_at"])

            for user in staff:
                notify(
                    recipient=user,
                    notification_type=NotificationType.CONTRACT_EXPIRY,
                    title=f"Contract expiring in {days} day(s) — {contract.contract_number}",
                    body=(
                        f"Contract {contract.contract_number} for {contract.client.company_name} "
                        f"expires on {contract.end_date}. Renewal status: {contract.renewal_status}."
                    ),
                    entity_type="Contract",
                    entity_id=contract.id,
                )
            count += 1

    return f"Sent {count} contract expiry reminder(s)"
