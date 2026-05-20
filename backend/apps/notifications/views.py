from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == "true")
        return qs


class MarkAllReadView(APIView):
    def post(self, request):
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"marked_read": updated})


class MarkReadView(APIView):
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])
            return Response(NotificationSerializer(notification).data)
        except Notification.DoesNotExist:
            return Response(status=404)
