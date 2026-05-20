from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from apps.accounts.models import UserRole
from apps.vehicles.models import VehicleStatus
from common.test_helpers import NamRentAPITestCase


class VehicleListPermissionsTest(NamRentAPITestCase):

    def setUp(self):
        self.ops = self.make_user(role=UserRole.NAMRENT_OPS, email="ops@test.com")
        self.admin = self.make_user(role=UserRole.NAMRENT_ADMIN, email="admin@test.com")
        self.client_entity = self.make_client_entity()
        self.client_user = self.make_client_user(self.client_entity)
        self.make_vehicle()

    def test_ops_can_list_vehicles(self):
        self.auth(self.ops)
        res = self.client.get(reverse("vehicle-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_admin_can_list_vehicles(self):
        self.auth(self.admin)
        res = self.client.get(reverse("vehicle-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_client_user_cannot_list_vehicles(self):
        self.auth(self.client_user)
        res = self.client.get(reverse("vehicle-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_list_vehicles(self):
        res = self.client.get(reverse("vehicle-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class VehicleCreatePermissionsTest(NamRentAPITestCase):

    def setUp(self):
        self.admin = self.make_user(role=UserRole.NAMRENT_ADMIN, email="admin@test.com")
        self.ops = self.make_user(role=UserRole.NAMRENT_OPS, email="ops@test.com")

    def _payload(self):
        return {
            "registration_number": "N-NEW-001",
            "make": "Ford",
            "model": "Ranger",
            "year": 2023,
            "vehicle_type": "PICKUP",
            "fuel_type": "DIESEL",
            "transmission": "MANUAL",
            "ownership_type": "NAMRENT_OWNED",
        }

    def test_admin_can_create_vehicle(self):
        self.auth(self.admin)
        res = self.client.post(reverse("vehicle-list"), self._payload())
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_ops_cannot_create_vehicle(self):
        self.auth(self.ops)
        res = self.client.post(reverse("vehicle-list"), self._payload())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class VehicleAssignActionTest(NamRentAPITestCase):

    def setUp(self):
        self.admin = self.make_user(role=UserRole.NAMRENT_ADMIN, email="admin@test.com")
        self.auth(self.admin)
        self.client_entity = self.make_client_entity()
        self.vehicle = self.make_vehicle()

    def test_assign_vehicle_creates_assignment(self):
        from apps.vehicles.models import VehicleAssignment
        url = reverse("vehicle-assign-vehicle", kwargs={"pk": self.vehicle.pk})
        res = self.client.post(url, {
            "client": str(self.client_entity.id),
            "start_date": str(timezone.now().date()),
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(VehicleAssignment.objects.filter(vehicle=self.vehicle).exists())

    def test_assign_vehicle_updates_vehicle_client(self):
        url = reverse("vehicle-assign-vehicle", kwargs={"pk": self.vehicle.pk})
        self.client.post(url, {
            "client": str(self.client_entity.id),
            "start_date": str(timezone.now().date()),
        })
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.assigned_client, self.client_entity)

    def test_new_assignment_closes_previous(self):
        from apps.vehicles.models import VehicleAssignment
        client2 = self.make_client_entity("Second Corp")
        today = timezone.now().date()

        url = reverse("vehicle-assign-vehicle", kwargs={"pk": self.vehicle.pk})
        self.client.post(url, {"client": str(self.client_entity.id), "start_date": str(today)})

        import datetime
        next_month = today + datetime.timedelta(days=30)
        self.client.post(url, {"client": str(client2.id), "start_date": str(next_month)})

        old_assignment = VehicleAssignment.objects.filter(
            vehicle=self.vehicle, client=self.client_entity
        ).first()
        self.assertIsNotNone(old_assignment.end_date)
