from django.db import models
from common.models import BaseModel


class ClientType(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", "Individual"
    CORPORATE = "CORPORATE", "Corporate"


class KYCStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class AccountStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    INACTIVE = "INACTIVE", "Inactive"


class Client(BaseModel):
    client_type = models.CharField(max_length=20, choices=ClientType.choices, default=ClientType.CORPORATE)
    company_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, blank=True)
    contact_person_name = models.CharField(max_length=255)
    contact_person_title = models.CharField(max_length=100, blank=True)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=30)
    alt_phone = models.CharField(max_length=30, blank=True)
    address_line_1 = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default="Namibia")
    kyc_status = models.CharField(max_length=10, choices=KYCStatus.choices, default=KYCStatus.PENDING)
    account_status = models.CharField(max_length=10, choices=AccountStatus.choices, default=AccountStatus.ACTIVE)
    assigned_account_manager = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_clients",
        limit_choices_to={"role__in": ["NAMRENT_ADMIN", "NAMRENT_OPS"]},
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "clients"
        ordering = ["company_name"]

    def __str__(self):
        return self.company_name


class ClientUser(BaseModel):
    """Links a User account to a Client. One user → one client."""

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="client_profile",
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="users")
    is_admin = models.BooleanField(default=False, help_text="True = CLIENT_ADMIN, False = CLIENT_USER")
    department = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "client_users"

    def __str__(self):
        return f"{self.user.get_full_name()} @ {self.client.company_name}"
