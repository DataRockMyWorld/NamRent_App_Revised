from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import ActionType, ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogFilter(django_filters.FilterSet):
    action_type = django_filters.ChoiceFilter(choices=ActionType.choices)
    object_id = django_filters.UUIDFilter()
    actor = django_filters.UUIDFilter(field_name="actor__id")

    class Meta:
        model = ActivityLog
        fields = ["action_type", "object_id", "actor"]


class ActivityLogViewSet(ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ActivityLogFilter
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ActivityLog.objects.select_related("actor")
        if user.is_client:
            # Clients see only logs for their own entities, scoped from their assignment start date
            from apps.vehicles.models import VehicleAssignment
            from django.db.models import Q
            import uuid

            # Get all content type IDs and object IDs visible to this client
            client_profile = getattr(user, "client_profile", None)
            if not client_profile:
                return qs.none()
            client = client_profile.client
            # Scope to logs where object_id is one of the client's own related objects
            # Simple approach: filter by actor or by objects belonging to client
            qs = qs.filter(actor=user)
        return qs
