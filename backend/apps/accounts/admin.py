from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User, Invitation, PasswordResetToken


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ["email", "first_name", "last_name", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["email"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone", "avatar")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Preferences", {"fields": ("dark_mode",)}),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    readonly_fields = ["created_at", "updated_at"]
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ["email", "role", "status", "invited_by", "expires_at", "created_at"]
    list_filter = ["status", "role"]
    search_fields = ["email"]
    readonly_fields = ["token", "created_at"]


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "is_used", "expires_at", "created_at"]
    readonly_fields = ["token", "created_at"]
