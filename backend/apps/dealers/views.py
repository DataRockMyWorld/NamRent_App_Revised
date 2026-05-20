from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff
from .models import Dealer, DealerUser
from .serializers import (
    DealerCreateUpdateSerializer,
    DealerDetailSerializer,
    DealerListSerializer,
    DealerUserSerializer,
)
from .filters import DealerFilter


class DealerViewSet(ModelViewSet):
    queryset = Dealer.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DealerFilter
    search_fields = ["dealer_name", "contact_person", "email"]
    ordering_fields = ["dealer_name", "created_at"]
    ordering = ["dealer_name"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsNamRentStaff()]
        return [IsNamRentAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return DealerListSerializer
        if self.action in ("create", "update", "partial_update"):
            return DealerCreateUpdateSerializer
        return DealerDetailSerializer

    @action(detail=True, methods=["get"], url_path="users")
    def dealer_users(self, request, pk=None):
        dealer = self.get_object()
        users = DealerUser.objects.filter(dealer=dealer).select_related("user")
        serializer = DealerUserSerializer(users, many=True)
        return Response(serializer.data)
