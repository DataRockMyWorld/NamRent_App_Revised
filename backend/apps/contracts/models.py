from django.db import models
from common.models import BaseModel


class PathwayType(models.TextChoices):
    EXISTING_FLEET = "EXISTING_FLEET", "Existing Fleet Management"
    NEW_PROCUREMENT = "NEW_PROCUREMENT", "New Vehicle Procurement"
    TRADE_IN = "TRADE_IN", "Trade-In + Replacement"


class ContractStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    EXPIRED = "EXPIRED", "Expired"
    TERMINATED = "TERMINATED", "Terminated"
    RENEWED = "RENEWED", "Renewed"


class PaymentSchedule(models.TextChoices):
    MONTHLY = "MONTHLY", "Monthly"
    QUARTERLY = "QUARTERLY", "Quarterly"
    ANNUAL = "ANNUAL", "Annual"


class RenewalStatus(models.TextChoices):
    NOT_DUE = "NOT_DUE", "Not Due"
    PENDING = "PENDING", "Pending Renewal"
    RENEWED = "RENEWED", "Renewed"
    LAPSED = "LAPSED", "Lapsed"


class Contract(BaseModel):
    contract_number = models.CharField(max_length=20, unique=True, db_index=True)
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="contracts"
    )
    vehicles = models.ManyToManyField("vehicles.Vehicle", related_name="contracts", blank=True)
    pathway_type = models.CharField(max_length=20, choices=PathwayType.choices)
    start_date = models.DateField()
    end_date = models.DateField(db_index=True)
    duration_months = models.PositiveSmallIntegerField()
    monthly_fee = models.DecimalField(max_digits=12, decimal_places=2)
    services_included = models.JSONField(default=list)
    payment_schedule = models.CharField(
        max_length=10, choices=PaymentSchedule.choices, default=PaymentSchedule.MONTHLY
    )
    status = models.CharField(
        max_length=20, choices=ContractStatus.choices, default=ContractStatus.DRAFT, db_index=True
    )
    signed_document = models.ForeignKey(
        "documents.Document", null=True, blank=True, on_delete=models.SET_NULL, related_name="signed_contracts"
    )
    renewal_status = models.CharField(
        max_length=10, choices=RenewalStatus.choices, default=RenewalStatus.NOT_DUE
    )
    renewal_reminder_sent_at = models.DateTimeField(null=True, blank=True)
    renewed_by_contract = models.OneToOneField(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="renews_contract"
    )
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_contracts"
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "contracts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.contract_number} — {self.client.company_name}"
