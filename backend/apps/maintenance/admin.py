from django.contrib import admin
from .models import MaintenanceRequest


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = [
        "reference_number", "vehicle", "client",
        "request_type", "priority", "status",
        "assigned_officer", "scheduled_date", "created_at",
    ]
    list_filter = ["status", "priority", "request_type"]
    search_fields = ["reference_number", "vehicle__registration_number", "client__company_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["vehicle", "client", "reported_by", "assigned_officer"]
