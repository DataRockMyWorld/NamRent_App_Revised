from django.contrib import admin
from .models import Vehicle, VehicleAssignment


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = [
        "registration_number", "make", "model", "year",
        "current_status", "ownership_type", "assigned_client",
        "insurance_expiry", "license_expiry",
    ]
    list_filter = ["current_status", "vehicle_type", "ownership_type", "fuel_type"]
    search_fields = ["registration_number", "vin", "make", "model"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["assigned_client", "assigned_driver", "dealer_source"]


@admin.register(VehicleAssignment)
class VehicleAssignmentAdmin(admin.ModelAdmin):
    list_display = ["vehicle", "client", "driver", "start_date", "end_date"]
    readonly_fields = ["id", "created_at"]
