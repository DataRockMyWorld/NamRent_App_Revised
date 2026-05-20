from django.urls import reverse
from rest_framework import status

from apps.accounts.models import UserRole
from apps.maintenance.models import MaintenanceStatus
from common.test_helpers import NamRentAPITestCase


class MaintenanceRequestPermissionsTest(NamRentAPITestCase):

    def setUp(self):
        self.admin = self.make_user(role=UserRole.NAMRENT_ADMIN, email="admin@test.com")
        self.ops = self.make_user(role=UserRole.NAMRENT_OPS, email="ops@test.com")

        self.client_a = self.make_client_entity("Client A")
        self.client_b = self.make_client_entity("Client B")
        self.client_user_a = self.make_client_user(self.client_a, email="usera@test.com")
        self.client_user_b = self.make_client_user(self.client_b, email="userb@test.com")

        self.vehicle_a = self.make_vehicle(client=self.client_a)

    def _create_payload(self):
        return {
            "reference_number": "MNT-0001",
            "vehicle": str(self.vehicle_a.id),
            "client": str(self.client_a.id),
            "request_type": "ROUTINE",
            "priority": "MEDIUM",
            "description": "Routine oil change",
        }

    def test_client_user_can_create_maintenance_request(self):
        self.auth(self.client_user_a)
        res = self.client.post(reverse("maintenance-request-list"), self._create_payload())
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_sets_reported_by_to_requesting_user(self):
        self.auth(self.client_user_a)
        res = self.client.post(reverse("maintenance-request-list"), self._create_payload())
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        from apps.maintenance.models import MaintenanceRequest
        req = MaintenanceRequest.objects.get(id=res.data["id"])
        self.assertEqual(req.reported_by, self.client_user_a)

    def test_namrent_ops_can_list_all_requests(self):
        self.auth(self.client_user_a)
        self.client.post(reverse("maintenance-request-list"), self._create_payload())

        self.auth(self.ops)
        res = self.client.get(reverse("maintenance-request-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)

    def test_client_user_sees_only_own_requests(self):
        # Client A creates a request
        self.auth(self.client_user_a)
        self.client.post(reverse("maintenance-request-list"), self._create_payload())

        # Client B should see 0 requests
        self.auth(self.client_user_b)
        res = self.client.get(reverse("maintenance-request-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 0)

    def test_namrent_ops_can_update_status(self):
        self.auth(self.client_user_a)
        create_res = self.client.post(reverse("maintenance-request-list"), self._create_payload())
        req_id = create_res.data["id"]

        self.auth(self.ops)
        url = reverse("maintenance-request-detail", kwargs={"pk": req_id})
        res = self.client.patch(url, {"status": MaintenanceStatus.APPROVED})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_client_user_cannot_update_status(self):
        self.auth(self.client_user_a)
        create_res = self.client.post(reverse("maintenance-request-list"), self._create_payload())
        req_id = create_res.data["id"]

        url = reverse("maintenance-request-detail", kwargs={"pk": req_id})
        res = self.client.patch(url, {"status": MaintenanceStatus.APPROVED})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_only_admin_can_delete(self):
        self.auth(self.client_user_a)
        create_res = self.client.post(reverse("maintenance-request-list"), self._create_payload())
        req_id = create_res.data["id"]

        # Ops cannot delete
        self.auth(self.ops)
        url = reverse("maintenance-request-detail", kwargs={"pk": req_id})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can delete
        self.auth(self.admin)
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
