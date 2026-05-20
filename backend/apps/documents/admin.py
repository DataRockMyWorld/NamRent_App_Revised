from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "name", "document_category", "status",
        "uploaded_by", "expiry_date", "created_at",
    ]
    list_filter = ["document_category", "status"]
    search_fields = ["name", "notes"]
    readonly_fields = ["id", "file_type", "file_size", "created_at", "updated_at"]
    raw_id_fields = ["uploaded_by", "content_type"]
