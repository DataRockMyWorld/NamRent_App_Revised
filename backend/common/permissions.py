from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "SUPER_ADMIN")


class IsNamRentAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "NAMRENT_ADMIN")
        )


class IsNamRentStaff(BasePermission):
    """NamRent Admin or Operations."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS")
        )


class IsClientAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("CLIENT_ADMIN",)
        )


class IsClientUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("CLIENT_ADMIN", "CLIENT_USER")
        )


class IsDealerAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "DEALER_ADMIN"
        )


class IsNamRentStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user and request.user.is_authenticated
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS")
        )
