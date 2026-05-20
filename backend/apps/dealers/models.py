from django.db import models
from common.models import BaseModel


class DealerStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"


class Dealer(BaseModel):
    dealer_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=30)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="Namibia")
    dealer_status = models.CharField(max_length=10, choices=DealerStatus.choices, default=DealerStatus.ACTIVE)
    brands_supplied = models.JSONField(default=list, blank=True, help_text="List of vehicle brands, e.g. ['Toyota', 'Ford']")
    vat_number = models.CharField(max_length=50, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "dealers"
        ordering = ["dealer_name"]

    def __str__(self):
        return self.dealer_name


class DealerUser(BaseModel):
    """Links a User account to a Dealer."""

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="dealer_profile",
    )
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="users")
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = "dealer_users"

    def __str__(self):
        return f"{self.user.get_full_name()} @ {self.dealer.dealer_name}"
