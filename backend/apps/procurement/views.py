from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff, IsDealerAdmin
from .filters import DealerOfferFilter, ProcurementRequestFilter
from .models import DealerOffer, ProcurementRequest
from .serializers import (
    DealerOfferCreateSerializer,
    DealerOfferSerializer,
    ProcurementRequestCreateSerializer,
    ProcurementRequestDetailSerializer,
    ProcurementRequestListSerializer,
    ProcurementRequestUpdateSerializer,
)


class ProcurementRequestViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProcurementRequestFilter
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
        qs = ProcurementRequest.objects.select_related("client", "reviewed_by", "selected_offer")
        if user.is_client:
            qs = qs.filter(client__users__user=user)
        elif user.is_dealer:
            qs = qs.filter(assigned_dealers__users__user=user)
        if self.action == "list":
            qs = qs.annotate(offer_count=Count("offers"))
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ProcurementRequestListSerializer
        if self.action == "create":
            return ProcurementRequestCreateSerializer
        if self.action in ("update", "partial_update"):
            return ProcurementRequestUpdateSerializer
        return ProcurementRequestDetailSerializer


class DealerOfferViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = DealerOfferFilter
    ordering_fields = ["created_at", "offered_price", "status"]
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
        qs = DealerOffer.objects.select_related("dealer", "procurement_request")
        if user.is_dealer:
            qs = qs.filter(dealer__users__user=user)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return DealerOfferCreateSerializer
        return DealerOfferSerializer

    def perform_create(self, serializer):
        dealer = self.request.user.dealer_profile.dealer
        serializer.save(dealer=dealer)
