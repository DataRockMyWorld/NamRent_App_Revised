from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from common.models import BaseModel


class DocumentCategory(models.TextChoices):
    CLIENT = "CLIENT", "Client Document"
    VEHICLE = "VEHICLE", "Vehicle Document"
    DEALER = "DEALER", "Dealer Document"
    INSURANCE = "INSURANCE", "Insurance Document"
    LICENSING = "LICENSING", "Licensing Document"
    CONTRACT = "CONTRACT", "Contract"
    INVOICE = "INVOICE", "Invoice"
    SERVICE_REPORT = "SERVICE_REPORT", "Service Report"
    TRADE_IN = "TRADE_IN", "Trade-In Document"
    OTHER = "OTHER", "Other"


class DocumentStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    EXPIRED = "EXPIRED", "Expired"
    SUPERSEDED = "SUPERSEDED", "Superseded"


def document_upload_path(instance, filename):
    return f"documents/{instance.document_category}/{filename}"


class Document(BaseModel):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=document_upload_path)
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="Size in bytes")
    document_category = models.CharField(
        max_length=20, choices=DocumentCategory.choices, db_index=True
    )
    # Generic FK — links to any entity (Client, Vehicle, Dealer, Contract, etc.)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.UUIDField(null=True, blank=True, db_index=True)
    related_entity = GenericForeignKey("content_type", "object_id")

    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="uploaded_documents"
    )
    expiry_date = models.DateField(null=True, blank=True, db_index=True)
    status = models.CharField(
        max_length=12, choices=DocumentStatus.choices, default=DocumentStatus.ACTIVE
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "documents"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
