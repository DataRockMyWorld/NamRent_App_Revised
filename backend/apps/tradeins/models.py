from django.db import models
from common.models import BaseModel


class VehicleCondition(models.TextChoices):
    EXCELLENT = "EXCELLENT", "Excellent"
    GOOD = "GOOD", "Good"
    FAIR = "FAIR", "Fair"
    POOR = "POOR", "Poor"


class TradeInStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    VALUATION_REQUESTED = "VALUATION_REQUESTED", "Valuation Requested"
    VALUATION_SUBMITTED = "VALUATION_SUBMITTED", "Valuation Submitted"
    VALUATION_ACCEPTED = "VALUATION_ACCEPTED", "Valuation Accepted"
    REPLACEMENT_REQUESTED = "REPLACEMENT_REQUESTED", "Replacement Requested"
    OFFER_RECEIVED = "OFFER_RECEIVED", "Offer Received"
    APPROVED = "APPROVED", "Approved"
    CONTRACTED = "CONTRACTED", "Contracted"
    ACTIVE = "ACTIVE", "Active"


class TradeInRequest(BaseModel):
    reference_number = models.CharField(max_length=20, unique=True, db_index=True)
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="trade_in_requests"
    )
    trade_in_vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="trade_in_requests"
    )
    trade_in_mileage = models.PositiveIntegerField(help_text="Mileage at time of trade-in request")
    trade_in_condition = models.CharField(max_length=10, choices=VehicleCondition.choices)
    trade_in_notes = models.TextField(blank=True)
    replacement_vehicle_type = models.CharField(max_length=10, blank=True)
    replacement_requirements = models.TextField(blank=True)
    selected_services = models.JSONField(default=list)
    duration_years = models.PositiveSmallIntegerField(null=True, blank=True)
    assigned_valuation_dealer = models.ForeignKey(
        "dealers.Dealer",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="valuation_requests",
    )
    accepted_valuation = models.ForeignKey(
        "TradeInValuation",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="accepted_for",
    )
    status = models.CharField(
        max_length=25, choices=TradeInStatus.choices, default=TradeInStatus.DRAFT, db_index=True
    )
    reviewed_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_tradeins"
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "trade_in_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference_number} — {self.client.company_name}"


class TradeInValuation(BaseModel):
    trade_in_request = models.ForeignKey(
        TradeInRequest, on_delete=models.CASCADE, related_name="valuations"
    )
    dealer = models.ForeignKey("dealers.Dealer", on_delete=models.CASCADE, related_name="valuations")
    estimated_value = models.DecimalField(max_digits=14, decimal_places=2)
    condition_notes = models.TextField(blank=True)
    is_accepted = models.BooleanField(default=False)
    valuation_date = models.DateField()
    submitted_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="submitted_valuations"
    )

    class Meta:
        db_table = "trade_in_valuations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Valuation by {self.dealer.dealer_name}: NAD {self.estimated_value}"
