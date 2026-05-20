from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin
from .filters import DocumentFilter
from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer


class DocumentViewSet(ModelViewSet):
    queryset = Document.objects.select_related("uploaded_by")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DocumentFilter
    search_fields = ["name", "notes"]
    ordering_fields = ["name", "created_at", "expiry_date"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsNamRentAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return DocumentUploadSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
