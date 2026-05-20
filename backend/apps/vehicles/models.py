from django.db import models
from common.models import BaseModel


class VehicleType(models.TextChoices):
    SEDAN = "SEDAN", "Sedan"
    SUV = "SUV", "SUV"
    PICKUP = "PICKUP", "Pickup"
    VAN = "VAN", "Van"
    BUS = "BUS", "Bus"
    TRUCK = "TRUCK", "Truck"
    OTHER = "OTHER", "Other"


class FuelType(models.TextChoices):
    PETROL = "PETROL", "Petrol"
    DIESEL = "DIESEL", "Diesel"
    ELECTRIC = "ELECTRIC", "Electric"
    HYBRID = "HYBRID", "Hybrid"


class Transmission(models.TextChoices):
    MANUAL = "MANUAL", "Manual"
    AUTOMATIC = "AUTOMATIC", "Automatic"


class OwnershipType(models.TextChoices):
    CLIENT_OWNED = "CLIENT_OWNED", "Client-Owned"
    NAMRENT_OWNED = "NAMRENT_OWNED", "NamRent-Owned"
    DEALER_SUPPLIED = "DEALER_SUPPLIED", "Dealer-Supplied"
    LEASE = "LEASE", "Lease Vehicle"
    TRADE_IN = "TRADE_IN", "Trade-In Vehicle"


class VehicleStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    PENDING_ONBOARDING = "PENDING_ONBOARDING", "Pending Onboarding"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE", "Under Maintenance"
    OUT_OF_SERVICE = "OUT_OF_SERVICE", "Out of Service"
    PENDING_TRADE_IN = "PENDING_TRADE_IN", "Pending Trade-In"
    RETURNED = "RETURNED", "Returned"
    ARCHIVED = "ARCHIVED", "Archived"


class TrackingStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    NOT_INSTALLED = "NOT_INSTALLED", "Not Installed"


class Vehicle(BaseModel):
    registration_number = models.CharField(max_length=50, unique=True, db_index=True)
    vin = models.CharField(max_length=50, unique=True, null=True, blank=True, db_index=True)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField()
    colour = models.CharField(max_length=50, blank=True)
    vehicle_type = models.CharField(max_length=10, choices=VehicleType.choices)
    fuel_type = models.CharField(max_length=10, choices=FuelType.choices)
    transmission = models.CharField(max_length=10, choices=Transmission.choices)
    mileage = models.PositiveIntegerField(default=0, help_text="Kilometres")
    mileage_last_updated = models.DateField(null=True, blank=True)
    ownership_type = models.CharField(max_length=20, choices=OwnershipType.choices)
    current_status = models.CharField(
        max_length=25, choices=VehicleStatus.choices, default=VehicleStatus.PENDING_ONBOARDING, db_index=True
    )

    # Relationships
    assigned_client = models.ForeignKey(
        "clients.Client",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="vehicles",
    )
    assigned_driver = models.ForeignKey(
        "accounts.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_vehicles",
        limit_choices_to={"role": "CLIENT_USER"},
    )
    dealer_source = models.ForeignKey(
        "dealers.Dealer",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="supplied_vehicles",
    )

    # Insurance
    insurance_provider = models.CharField(max_length=200, blank=True)
    insurance_policy_number = models.CharField(max_length=100, blank=True)
    insurance_start = models.DateField(null=True, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True, db_index=True)

    # Licensing
    license_number = models.CharField(max_length=100, blank=True)
    license_expiry = models.DateField(null=True, blank=True, db_index=True)

    # Tracking (stored for future integration)
    tracking_provider = models.CharField(max_length=200, blank=True)
    tracking_device_id = models.CharField(max_length=100, blank=True)
    tracking_status = models.CharField(
        max_length=15, choices=TrackingStatus.choices, default=TrackingStatus.NOT_INSTALLED
    )
    tracking_renewal_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        db_table = "vehicles"
        ordering = ["make", "model"]
        indexes = [
            models.Index(fields=["insurance_expiry"]),
            models.Index(fields=["license_expiry"]),
            models.Index(fields=["current_status"]),
        ]

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.registration_number})"


class VehicleAssignment(BaseModel):
    """Audit trail for vehicle-to-client-to-driver assignments."""

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="assignments")
    client = models.ForeignKey("clients.Client", on_delete=models.CASCADE, related_name="vehicle_assignments")
    driver = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="vehicle_assignments"
    )
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(null=True, blank=True)
    assigned_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_assignments"
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "vehicle_assignments"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.vehicle} → {self.client} from {self.start_date}"
