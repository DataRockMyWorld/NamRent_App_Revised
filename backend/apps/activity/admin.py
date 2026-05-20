from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ["actor", "action_type", "entity_display", "ip_address", "created_at"]
    list_filter = ["action_type"]
    search_fields = ["actor__email", "entity_display", "note"]
    readonly_fields = [
        "id", "actor", "action_type", "content_type", "object_id",
        "entity_display", "diff", "note", "ip_address", "created_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
