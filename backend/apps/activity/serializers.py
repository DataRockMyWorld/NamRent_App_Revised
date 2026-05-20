from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True, default="System")
    actor_role = serializers.CharField(source="actor.role", read_only=True, default=None)

    class Meta:
        model = ActivityLog
        fields = [
            "id", "actor_name", "actor_role", "action_type",
            "entity_display", "diff", "note", "created_at",
        ]
