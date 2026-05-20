from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import Document


class DocumentSerializer(BaseModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.get_full_name", read_only=True, default=None
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id", "name", "file", "file_url", "file_type", "file_size",
            "document_category", "content_type", "object_id",
            "uploaded_by_name", "expiry_date", "status", "notes", "created_at",
        ]
        read_only_fields = ["id", "file_url", "created_at", "updated_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentUploadSerializer(BaseModelSerializer):
    class Meta:
        model = Document
        fields = [
            "name", "file", "file_type", "file_size",
            "document_category", "content_type", "object_id",
            "expiry_date", "notes",
        ]
