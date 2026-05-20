from django.contrib import admin
from .models import Client, ClientUser


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["company_name", "client_type", "email", "phone", "kyc_status", "account_status", "created_at"]
    list_filter = ["client_type", "kyc_status", "account_status"]
    search_fields = ["company_name", "email", "contact_person_name"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(ClientUser)
class ClientUserAdmin(admin.ModelAdmin):
    list_display = ["user", "client", "is_admin", "job_title"]
    list_filter = ["is_admin"]
    search_fields = ["user__email", "client__company_name"]
