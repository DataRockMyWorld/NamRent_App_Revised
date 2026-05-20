from django.db import models
from common.models import BaseModel


class RequestType(models.TextChoices):
    ROUTINE = "ROUTINE", "Routine Maintenance"
    BREAKDOWN = "BREAKDOWN", "Breakdown"
    REPAIR = "REPAIR", "Repair"
    INSPECTION = "INSPECTION", "Inspection"
    ACCIDENT = "ACCIDENT", "Accident / Damage"


class Priority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class MaintenanceStatus(models.TextChoices):
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    APPROVED = "APPROVED", "Approved"
    ASSIGNED = "ASSIGNED", "Assigned"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"
    REJECTED = "REJECTED", "Rejected"
    CANCELLED = "CANCELLED", "Cancelled"


class MaintenanceRequest(BaseModel):
    reference_number = models.CharField(max_length=20, unique=True, db_index=True)
    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="maintenance_requests"
    )
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="maintenance_requests"
    )
    reported_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="reported_maintenance"
    )
    request_type = models.CharField(max_length=12, choices=RequestType.choices)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    description = models.TextField()
    location_description = models.CharField(max_length=255, blank=True)
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    assigned_officer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_maintenance",
        limit_choices_to={"role__in": ["NAMRENT_ADMIN", "NAMRENT_OPS"]},
    )
    service_provider_name = models.CharField(max_length=200, blank=True)
    service_provider_contact = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=15, choices=MaintenanceStatus.choices, default=MaintenanceStatus.SUBMITTED, db_index=True
    )
    cost_estimate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    final_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    scheduled_date = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    completion_notes = models.TextField(blank=True)

    class Meta:
        db_table = "maintenance_requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["client", "status"]),
        ]

    def __str__(self):
        return f"{self.reference_number} — {self.vehicle} ({self.status})"
