from django.db import models
from common.models import BaseModel


class ArrangementType(models.TextChoices):
    LEASE = "LEASE", "Lease"
    PURCHASE = "PURCHASE", "Purchase"


class ProcurementStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    DEALERS_ASSIGNED = "DEALERS_ASSIGNED", "Dealers Assigned"
    OFFERS_RECEIVED = "OFFERS_RECEIVED", "Offers Received"
    OFFER_SELECTED = "OFFER_SELECTED", "Offer Selected"
    APPROVED = "APPROVED", "Approved"
    CONTRACTED = "CONTRACTED", "Contracted"
    ACTIVE = "ACTIVE", "Active"


class OfferStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    ACCEPTED = "ACCEPTED", "Accepted"
    REJECTED = "REJECTED", "Rejected"


class ProcurementRequest(BaseModel):
    reference_number = models.CharField(max_length=20, unique=True, db_index=True)
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="procurement_requests"
    )
    vehicle_type = models.CharField(max_length=10)
    vehicle_category = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveSmallIntegerField(default=1)
    preferred_make = models.CharField(max_length=100, blank=True)
    preferred_model = models.CharField(max_length=100, blank=True)
    preferred_year_min = models.PositiveSmallIntegerField(null=True, blank=True)
    preferred_year_max = models.PositiveSmallIntegerField(null=True, blank=True)
    budget_min = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    arrangement_type = models.CharField(max_length=10, choices=ArrangementType.choices)
    selected_services = models.JSONField(default=list)
    duration_years = models.PositiveSmallIntegerField(null=True, blank=True)
    requirements_notes = models.TextField(blank=True)
    assigned_dealers = models.ManyToManyField("dealers.Dealer", related_name="procurement_requests", blank=True)
    selected_offer = models.ForeignKey(
        "DealerOffer", null=True, blank=True, on_delete=models.SET_NULL, related_name="selected_for"
    )
    status = models.CharField(
        max_length=20, choices=ProcurementStatus.choices, default=ProcurementStatus.DRAFT, db_index=True
    )
    reviewed_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_procurement"
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "procurement_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference_number} — {self.client.company_name}"


class DealerOffer(BaseModel):
    """An offer submitted by a dealer in response to a ProcurementRequest."""

    procurement_request = models.ForeignKey(
        ProcurementRequest, null=True, blank=True, on_delete=models.CASCADE, related_name="offers"
    )
    # Also used for trade-in replacement offers
    trade_in_request = models.ForeignKey(
        "tradeins.TradeInRequest", null=True, blank=True, on_delete=models.CASCADE, related_name="offers"
    )
    dealer = models.ForeignKey("dealers.Dealer", on_delete=models.CASCADE, related_name="offers")
    vehicle_make = models.CharField(max_length=100)
    vehicle_model = models.CharField(max_length=100)
    vehicle_year = models.PositiveSmallIntegerField()
    vehicle_colour = models.CharField(max_length=50, blank=True)
    vehicle_type = models.CharField(max_length=10, blank=True)
    vin = models.CharField(max_length=50, blank=True)
    offered_price = models.DecimalField(max_digits=14, decimal_places=2)
    availability_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=OfferStatus.choices, default=OfferStatus.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dealer_offers"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Offer by {self.dealer.dealer_name} — {self.vehicle_year} {self.vehicle_make} {self.vehicle_model}"
