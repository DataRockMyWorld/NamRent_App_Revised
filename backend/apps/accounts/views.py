from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from common.permissions import IsNamRentAdmin
from .models import Invitation, PasswordResetToken, User
from .serializers import (
    AcceptInvitationSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    InvitationCreateSerializer,
    ResetPasswordSerializer,
    UserListSerializer,
    UserMeSerializer,
    UserUpdateSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": {"message": "refresh token is required"}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserMeSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserMeSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"message": "Password changed successfully."})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Always return 200 to avoid email enumeration
        try:
            user = User.objects.get(email=email, is_active=True)
            reset_token = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=2),
            )
            from .tasks import send_password_reset_email
            send_password_reset_email.delay(str(user.id), str(reset_token.token))
        except User.DoesNotExist:
            pass

        return Response({"message": "If an account exists for this email, a reset link has been sent."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_token = serializer.validated_data["reset_token_obj"]
        reset_token.user.set_password(serializer.validated_data["new_password"])
        reset_token.user.save(update_fields=["password"])
        reset_token.is_used = True
        reset_token.save(update_fields=["is_used"])
        return Response({"message": "Password reset successfully."})


class InvitationView(APIView):
    permission_classes = [IsNamRentAdmin]

    def post(self, request):
        serializer = InvitationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = serializer.save(
            invited_by=request.user,
            expires_at=timezone.now() + timedelta(hours=72),
        )
        from .tasks import send_invitation_email
        send_invitation_email.delay(str(invitation.id))
        return Response(
            {"id": str(invitation.id), "message": "Invitation sent."},
            status=status.HTTP_201_CREATED,
        )


class AcceptInvitationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        serializer = AcceptInvitationSerializer(data={**request.data, "token": token})
        serializer.is_valid(raise_exception=True)

        invitation = serializer.validated_data["invitation"]
        user = User.objects.create_user(
            email=invitation.email,
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            phone=serializer.validated_data.get("phone", ""),
            role=invitation.role,
        )

        # Link to client or dealer if specified
        if invitation.client_id and invitation.role in ("CLIENT_ADMIN", "CLIENT_USER"):
            from apps.clients.models import ClientUser
            ClientUser.objects.create(
                user=user,
                client_id=invitation.client_id,
                is_admin=(invitation.role == "CLIENT_ADMIN"),
            )
        elif invitation.dealer_id and invitation.role == "DEALER_ADMIN":
            from apps.dealers.models import DealerUser
            DealerUser.objects.create(
                user=user,
                dealer_id=invitation.dealer_id,
            )

        invitation.status = "ACCEPTED"
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["status", "accepted_at"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserMeSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class UserListView(APIView):
    permission_classes = [IsNamRentAdmin]

    def get(self, request):
        users = User.objects.all().order_by("first_name")
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)
