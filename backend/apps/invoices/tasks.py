from celery import shared_task
from django.utils import timezone


@shared_task
def mark_overdue_invoices():
    from apps.notifications.models import NotificationType, notify
    from apps.accounts.models import User, UserRole
    from .models import Invoice, InvoiceStatus

    today = timezone.now().date()

    # Only process invoices that are transitioning to OVERDUE now
    invoices = list(
        Invoice.objects.filter(
            status__in=[
                InvoiceStatus.SENT,
                InvoiceStatus.VIEWED,
                InvoiceStatus.PARTIALLY_PAID,
            ],
            due_date__lt=today,
        ).select_related("client")
    )

    if not invoices:
        return "No invoices to mark as overdue"

    staff = list(
        User.objects.filter(
            role__in=[UserRole.NAMRENT_ADMIN, UserRole.NAMRENT_OPS],
            is_active=True,
        )
    )

    for invoice in invoices:
        invoice.status = InvoiceStatus.OVERDUE
        invoice.save(update_fields=["status", "updated_at"])

        for user in staff:
            notify(
                recipient=user,
                notification_type=NotificationType.INVOICE_OVERDUE,
                title=f"Invoice overdue — {invoice.invoice_number}",
                body=(
                    f"Invoice {invoice.invoice_number} for {invoice.client.company_name} "
                    f"(NAD {invoice.total_amount}) was due on {invoice.due_date}."
                ),
                entity_type="Invoice",
                entity_id=invoice.id,
            )

    return f"Marked {len(invoices)} invoice(s) as overdue"
