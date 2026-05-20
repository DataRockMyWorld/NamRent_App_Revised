from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Invitation, PasswordResetToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds user info to the token response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserMeSerializer(self.user).data
        return data


class UserMeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "phone", "role", "avatar", "dark_mode", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "created_at"]


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "avatar", "dark_mode"]


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        try:
            reset_token = PasswordResetToken.objects.get(
                token=attrs["token"], is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired token."})

        if reset_token.expires_at < timezone.now():
            raise serializers.ValidationError({"token": "Token has expired."})

        attrs["reset_token_obj"] = reset_token
        return attrs


class InvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["email", "role", "client_id", "dealer_id"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        if Invitation.objects.filter(email=value, status="PENDING").exists():
            raise serializers.ValidationError("A pending invitation for this email already exists.")
        return value


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        try:
            invitation = Invitation.objects.get(token=attrs["token"], status="PENDING")
        except Invitation.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or already used invitation."})

        if invitation.expires_at < timezone.now():
            invitation.status = "EXPIRED"
            invitation.save(update_fields=["status"])
            raise serializers.ValidationError({"token": "Invitation has expired."})

        attrs["invitation"] = invitation
        return attrs


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "is_active", "created_at"]
