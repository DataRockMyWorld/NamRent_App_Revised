import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    NAMRENT_ADMIN = "NAMRENT_ADMIN", "NamRent Admin"
    NAMRENT_OPS = "NAMRENT_OPS", "NamRent Operations"
    CLIENT_ADMIN = "CLIENT_ADMIN", "Client Admin"
    CLIENT_USER = "CLIENT_USER", "Client User"
    DEALER_ADMIN = "DEALER_ADMIN", "Dealer Admin"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.SUPER_ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CLIENT_USER)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    # Dark mode preference stored per user
    dark_mode = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        ordering = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_namrent_staff(self):
        return self.role in (UserRole.SUPER_ADMIN, UserRole.NAMRENT_ADMIN, UserRole.NAMRENT_OPS)

    @property
    def is_client(self):
        return self.role in (UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER)

    @property
    def is_dealer(self):
        return self.role == UserRole.DEALER_ADMIN


class InvitationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACCEPTED = "ACCEPTED", "Accepted"
    EXPIRED = "EXPIRED", "Expired"
    REVOKED = "REVOKED", "Revoked"


class Invitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(db_index=True)
    role = models.CharField(max_length=20, choices=UserRole.choices)
    # token sent in email link — one-time use, expires in 72h
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    status = models.CharField(max_length=10, choices=InvitationStatus.choices, default=InvitationStatus.PENDING)
    # Optional links to restrict which entity the new user belongs to
    client_id = models.UUIDField(null=True, blank=True)
    dealer_id = models.UUIDField(null=True, blank=True)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sent_invitations")
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invitations"

    def __str__(self):
        return f"Invitation for {self.email} ({self.status})"


class PasswordResetToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "password_reset_tokens"
