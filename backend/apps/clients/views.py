from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff
from .models import Client, ClientUser
from .serializers import (
    ClientCreateUpdateSerializer,
    ClientDetailSerializer,
    ClientListSerializer,
    ClientUserSerializer,
)
from .filters import ClientFilter


class ClientViewSet(ModelViewSet):
    queryset = Client.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ClientFilter
    search_fields = ["company_name", "contact_person_name", "email"]
    ordering_fields = ["company_name", "created_at", "kyc_status", "account_status"]
    ordering = ["company_name"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "clients_users"):
            return [IsNamRentStaff()]
        return [IsNamRentAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return ClientListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ClientCreateUpdateSerializer
        return ClientDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            qs = qs.annotate(vehicle_count=Count("vehicles"))
        return qs

    @action(detail=True, methods=["get"], url_path="users")
    def client_users(self, request, pk=None):
        client = self.get_object()
        users = ClientUser.objects.filter(client=client).select_related("user")
        serializer = ClientUserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="vehicles")
    def client_vehicles(self, request, pk=None):
        from apps.vehicles.serializers import VehicleListSerializer
        client = self.get_object()
        vehicles = client.vehicles.all()
        serializer = VehicleListSerializer(vehicles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="contracts")
    def client_contracts(self, request, pk=None):
        from apps.contracts.serializers import ContractListSerializer
        client = self.get_object()
        contracts = client.contracts.all()
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="invoices")
    def client_invoices(self, request, pk=None):
        from apps.invoices.serializers import InvoiceListSerializer
        client = self.get_object()
        invoices = client.invoices.all()
        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)
