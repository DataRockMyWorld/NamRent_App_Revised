from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AcceptInvitationView,
    ChangePasswordView,
    ForgotPasswordView,
    InvitationView,
    LoginView,
    LogoutView,
    MeView,
    ResetPasswordView,
    UserListView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
    path("invitations/", InvitationView.as_view(), name="auth-invitations"),
    path("invitations/<uuid:token>/accept/", AcceptInvitationView.as_view(), name="auth-accept-invitation"),
    path("users/", UserListView.as_view(), name="auth-users"),
]
