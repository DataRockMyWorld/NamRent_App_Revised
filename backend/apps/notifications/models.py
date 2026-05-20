from django.db import models
import uuid


class NotificationType(models.TextChoices):
    REQUEST_SUBMITTED = "REQUEST_SUBMITTED", "Request Submitted"
    REQUEST_APPROVED = "REQUEST_APPROVED", "Request Approved"
    REQUEST_REJECTED = "REQUEST_REJECTED", "Request Rejected"
    DEALER_ASSIGNED = "DEALER_ASSIGNED", "Dealer Assigned"
    OFFER_SUBMITTED = "OFFER_SUBMITTED", "Offer Submitted"
    INVOICE_SENT = "INVOICE_SENT", "Invoice Sent"
    INVOICE_OVERDUE = "INVOICE_OVERDUE", "Invoice Overdue"
    MAINTENANCE_UPDATE = "MAINTENANCE_UPDATE", "Maintenance Update"
    INSURANCE_EXPIRY = "INSURANCE_EXPIRY", "Insurance Expiry Reminder"
    LICENSE_EXPIRY = "LICENSE_EXPIRY", "License Expiry Reminder"
    CONTRACT_EXPIRY = "CONTRACT_EXPIRY", "Contract Expiry Reminder"
    TRACKING_RENEWAL = "TRACKING_RENEWAL", "Tracking Renewal Reminder"
    GENERAL = "GENERAL", "General"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(
        max_length=30, choices=NotificationType.choices, default=NotificationType.GENERAL
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    # Optional link to related entity
    entity_type = models.CharField(max_length=100, blank=True)
    entity_id = models.UUIDField(null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient.email}"


def notify(recipient, notification_type, title, body, entity_type="", entity_id=None):
    """Convenience function to create a notification."""
    Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        body=body,
        entity_type=entity_type,
        entity_id=entity_id,
    )
