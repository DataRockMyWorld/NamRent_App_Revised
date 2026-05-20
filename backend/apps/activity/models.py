from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
import uuid


class ActionType(models.TextChoices):
    CREATED = "CREATED", "Created"
    UPDATED = "UPDATED", "Updated"
    DELETED = "DELETED", "Deleted"
    STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED", "Document Uploaded"
    COMMENT_ADDED = "COMMENT_ADDED", "Comment Added"
    ASSIGNED = "ASSIGNED", "Assigned"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    SENT = "SENT", "Sent"
    PAYMENT_RECORDED = "PAYMENT_RECORDED", "Payment Recorded"
    OFFER_SUBMITTED = "OFFER_SUBMITTED", "Offer Submitted"
    VALUATION_SUBMITTED = "VALUATION_SUBMITTED", "Valuation Submitted"


class ActivityLog(models.Model):
    """
    Append-only audit log. No updates, no deletes.
    Every significant action on every domain object is recorded here.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        "accounts.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="activity_logs",
    )
    action_type = models.CharField(max_length=30, choices=ActionType.choices, db_index=True)

    # Generic FK to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.UUIDField(null=True, blank=True, db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")

    entity_display = models.CharField(max_length=255, blank=True, help_text="Human-readable entity label")
    diff = models.JSONField(null=True, blank=True, help_text="Dict of changed field: [old, new]")
    note = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor} {self.action_type} {self.entity_display}"


def log_activity(actor, action_type, obj, note="", diff=None, ip_address=None):
    """
    Convenience function to create an ActivityLog entry.
    Use this in signals and views.
    """
    ct = ContentType.objects.get_for_model(obj)
    ActivityLog.objects.create(
        actor=actor,
        action_type=action_type,
        content_type=ct,
        object_id=obj.pk,
        entity_display=str(obj),
        diff=diff or {},
        note=note,
        ip_address=ip_address,
    )
