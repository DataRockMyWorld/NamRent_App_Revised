from rest_framework import serializers


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Adds read-only created_at / updated_at to every serializer that inherits it.
    """

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
