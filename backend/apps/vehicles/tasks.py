from datetime import timedelta

from celery import shared_task
from django.utils import timezone

# Notify at these intervals (days before expiry)
EXPIRY_WINDOWS = [7, 30]


@shared_task
def send_vehicle_expiry_reminders():
    from apps.notifications.models import NotificationType, notify
    from apps.accounts.models import User, UserRole
    from .models import Vehicle, TrackingStatus

    today = timezone.now().date()
    staff = list(
        User.objects.filter(
            role__in=[UserRole.NAMRENT_ADMIN, UserRole.NAMRENT_OPS],
            is_active=True,
        )
    )
    count = 0

    for days in EXPIRY_WINDOWS:
        target = today + timedelta(days=days)

        # Insurance expiry
        for vehicle in Vehicle.objects.filter(insurance_expiry=target):
            for user in staff:
                notify(
                    recipient=user,
                    notification_type=NotificationType.INSURANCE_EXPIRY,
                    title=f"Insurance expiring in {days} day(s) — {vehicle.registration_number}",
                    body=(
                        f"Vehicle {vehicle.registration_number} ({vehicle.year} {vehicle.make} {vehicle.model}) "
                        f"insurance expires on {vehicle.insurance_expiry}."
                    ),
                    entity_type="Vehicle",
                    entity_id=vehicle.id,
                )
            count += 1

        # License expiry
        for vehicle in Vehicle.objects.filter(license_expiry=target):
            for user in staff:
                notify(
                    recipient=user,
                    notification_type=NotificationType.LICENSE_EXPIRY,
                    title=f"License expiring in {days} day(s) — {vehicle.registration_number}",
                    body=(
                        f"Vehicle {vehicle.registration_number} ({vehicle.year} {vehicle.make} {vehicle.model}) "
                        f"license expires on {vehicle.license_expiry}."
                    ),
                    entity_type="Vehicle",
                    entity_id=vehicle.id,
                )
            count += 1

        # Tracking renewal
        for vehicle in Vehicle.objects.filter(
            tracking_renewal_date=target,
            tracking_status=TrackingStatus.ACTIVE,
        ):
            for user in staff:
                notify(
                    recipient=user,
                    notification_type=NotificationType.TRACKING_RENEWAL,
                    title=f"Tracking renewal in {days} day(s) — {vehicle.registration_number}",
                    body=(
                        f"Vehicle {vehicle.registration_number} ({vehicle.year} {vehicle.make} {vehicle.model}) "
                        f"tracking renewal is due on {vehicle.tracking_renewal_date}."
                    ),
                    entity_type="Vehicle",
                    entity_id=vehicle.id,
                )
            count += 1

    return f"Sent {count} vehicle expiry reminder(s)"
