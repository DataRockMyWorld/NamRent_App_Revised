from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.clients.models import Client, ClientType
from apps.vehicles.models import (
    FuelType,
    OwnershipType,
    Transmission,
    Vehicle,
    VehicleAssignment,
    VehicleType,
)


def _make_vehicle(reg="N-0001", **kwargs):
    defaults = dict(
        registration_number=reg,
        make="Toyota",
        model="Hilux",
        year=2023,
        vehicle_type=VehicleType.PICKUP,
        fuel_type=FuelType.DIESEL,
        transmission=Transmission.MANUAL,
        ownership_type=OwnershipType.NAMRENT_OWNED,
    )
    defaults.update(kwargs)
    return Vehicle.objects.create(**defaults)


class VehicleModelTest(TestCase):

    def test_str(self):
        v = _make_vehicle()
        self.assertIn("Toyota", str(v))
        self.assertIn("Hilux", str(v))
        self.assertIn("N-0001", str(v))

    def test_default_status_is_pending_onboarding(self):
        from apps.vehicles.models import VehicleStatus
        v = _make_vehicle(reg="N-0002")
        self.assertEqual(v.current_status, VehicleStatus.PENDING_ONBOARDING)


class VehicleAssignmentModelTest(TestCase):

    def setUp(self):
        self.vehicle = _make_vehicle(reg="N-0003")
        self.client_entity = Client.objects.create(
            company_name="Test Corp",
            contact_person_name="Contact",
            email="corp@test.com",
            phone="081111",
            client_type=ClientType.CORPORATE,
        )

    def test_str(self):
        today = timezone.now().date()
        assignment = VehicleAssignment.objects.create(
            vehicle=self.vehicle,
            client=self.client_entity,
            start_date=today,
        )
        self.assertIn("Test Corp", str(assignment))
        self.assertIn(str(today), str(assignment))
