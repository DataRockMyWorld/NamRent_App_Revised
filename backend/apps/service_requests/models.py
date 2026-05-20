from django.db import models
from common.models import BaseModel


class ServiceRequestStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    APPROVED = "APPROVED", "Approved"
    CONTRACTED = "CONTRACTED", "Contracted"
    ACTIVE = "ACTIVE", "Active"
    REJECTED = "REJECTED", "Rejected"


class ServiceType(models.TextChoices):
    MAINTENANCE = "MAINTENANCE", "Basic Maintenance"
    INSURANCE = "INSURANCE", "Insurance Support"
    TRACKING = "TRACKING", "Tracking Support"
    LICENSING = "LICENSING", "Licensing Support"
    FULL_FLEET = "FULL_FLEET", "Full Fleet Management"


class ServiceRequest(BaseModel):
    """Pathway 1: Existing Vehicle Fleet Management request."""

    reference_number = models.CharField(max_length=20, unique=True, db_index=True)
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="service_requests"
    )
    vehicles = models.ManyToManyField("vehicles.Vehicle", related_name="service_requests", blank=True)
    selected_services = models.JSONField(default=list)
    duration_years = models.PositiveSmallIntegerField(choices=[(3, "3 Years"), (5, "5 Years")])
    status = models.CharField(
        max_length=15, choices=ServiceRequestStatus.choices, default=ServiceRequestStatus.DRAFT, db_index=True
    )
    reviewed_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_service_requests"
    )
    review_notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "service_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference_number} — {self.client.company_name}"
