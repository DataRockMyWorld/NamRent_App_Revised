from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff, IsDealerAdmin
from .filters import TradeInRequestFilter
from .models import TradeInRequest, TradeInValuation
from .serializers import (
    TradeInRequestCreateSerializer,
    TradeInRequestDetailSerializer,
    TradeInRequestListSerializer,
    TradeInRequestUpdateSerializer,
    TradeInValuationCreateSerializer,
    TradeInValuationSerializer,
)


class TradeInRequestViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TradeInRequestFilter
    search_fields = ["reference_number", "client__company_name"]
    ordering_fields = ["created_at", "status", "submitted_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsNamRentAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsNamRentStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = TradeInRequest.objects.select_related(
            "client", "trade_in_vehicle", "reviewed_by", "assigned_valuation_dealer"
        )
        if user.is_client:
            qs = qs.filter(client__users__user=user)
        elif user.is_dealer:
            qs = qs.filter(assigned_valuation_dealer__users__user=user)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return TradeInRequestListSerializer
        if self.action == "create":
            return TradeInRequestCreateSerializer
        if self.action in ("update", "partial_update"):
            return TradeInRequestUpdateSerializer
        return TradeInRequestDetailSerializer


class TradeInValuationViewSet(ModelViewSet):
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "create":
            return [IsDealerAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsDealerAdmin()]
        if self.action == "destroy":
            return [IsNamRentAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = TradeInValuation.objects.select_related("dealer", "trade_in_request")
        if user.is_dealer:
            qs = qs.filter(dealer__users__user=user)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return TradeInValuationCreateSerializer
        return TradeInValuationSerializer

    def perform_create(self, serializer):
        dealer = self.request.user.dealer_profile.dealer
        serializer.save(dealer=dealer, submitted_by=self.request.user)
