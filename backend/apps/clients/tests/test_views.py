from django.urls import reverse
from rest_framework import status

from apps.accounts.models import UserRole
from common.test_helpers import NamRentAPITestCase


class ClientListPermissionsTest(NamRentAPITestCase):

    def setUp(self):
        self.admin = self.make_user(role=UserRole.NAMRENT_ADMIN, email="admin@test.com")
        self.ops = self.make_user(role=UserRole.NAMRENT_OPS, email="ops@test.com")
        self.client_entity = self.make_client_entity("Perm Corp")
        self.client_user = self.make_client_user(self.client_entity)
        self.make_client_entity("Another Corp")

    def test_admin_can_list_clients(self):
        self.auth(self.admin)
        res = self.client.get(reverse("client-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_ops_can_list_clients(self):
        self.auth(self.ops)
        res = self.client.get(reverse("client-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_client_user_cannot_list_clients(self):
        self.auth(self.client_user)
        res = self.client.get(reverse("client-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class ClientCRUDTest(NamRentAPITestCase):

    def setUp(self):
        self.admin = self.make_user(role=UserRole.NAMRENT_ADMIN, email="admin@test.com")
        self.ops = self.make_user(role=UserRole.NAMRENT_OPS, email="ops@test.com")
        self.existing = self.make_client_entity("Existing Corp")

    def _payload(self, name="New Corp"):
        return {
            "company_name": name,
            "contact_person_name": "Jane Doe",
            "email": f"{name.lower().replace(' ', '')}@test.com",
            "phone": "0811234567",
            "client_type": "CORPORATE",
        }

    def test_admin_can_create_client(self):
        self.auth(self.admin)
        res = self.client.post(reverse("client-list"), self._payload())
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_ops_cannot_create_client(self):
        self.auth(self.ops)
        res = self.client.post(reverse("client-list"), self._payload("OpsAttempt"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_client(self):
        self.auth(self.admin)
        url = reverse("client-detail", kwargs={"pk": self.existing.pk})
        res = self.client.patch(url, {"notes": "Updated notes"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_admin_can_delete_client(self):
        self.auth(self.admin)
        url = reverse("client-detail", kwargs={"pk": self.existing.pk})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_ops_cannot_delete_client(self):
        self.auth(self.ops)
        url = reverse("client-detail", kwargs={"pk": self.existing.pk})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_includes_vehicle_count(self):
        self.auth(self.admin)
        self.make_vehicle(client=self.existing)
        res = self.client.get(reverse("client-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        client_data = next(c for c in res.data["results"] if c["id"] == str(self.existing.id))
        self.assertEqual(client_data["vehicle_count"], 1)
