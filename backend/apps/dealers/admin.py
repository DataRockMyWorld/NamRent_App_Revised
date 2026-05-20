from django.contrib import admin
from .models import Dealer, DealerUser


@admin.register(Dealer)
class DealerAdmin(admin.ModelAdmin):
    list_display = ["dealer_name", "contact_person", "email", "phone", "dealer_status", "created_at"]
    list_filter = ["dealer_status"]
    search_fields = ["dealer_name", "email", "contact_person"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(DealerUser)
class DealerUserAdmin(admin.ModelAdmin):
    list_display = ["user", "dealer", "is_primary"]
    search_fields = ["user__email", "dealer__dealer_name"]
