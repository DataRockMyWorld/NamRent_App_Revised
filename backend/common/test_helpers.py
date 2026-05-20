"""
Shared base test case and factory helpers for the NamRent test suite.
Not auto-discovered by Django (no test_ prefix).
"""
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User, UserRole


class NamRentAPITestCase(APITestCase):

    # ---------------------------------------------------------------------------
    # User helpers
    # ---------------------------------------------------------------------------

    def make_user(self, role=UserRole.NAMRENT_OPS, email=None, password="testpass123", **kwargs):
        email = email or f"{role.lower()}_{id(self)}@test.com"
        return User.objects.create_user(
            email=email,
            password=password,
            first_name="Test",
            last_name="User",
            role=role,
            **kwargs,
        )

    def auth(self, user):
        """Authenticate the test client as the given user (bypasses JWT)."""
        self.client.force_authenticate(user=user)

    # ---------------------------------------------------------------------------
    # Client helpers
    # ---------------------------------------------------------------------------

    def make_client_entity(self, name="Test Corp", **kwargs):
        from apps.clients.models import Client, ClientType
        return Client.objects.create(
            company_name=name,
            contact_person_name="Contact Person",
            email=f"{name.lower().replace(' ', '_')}@test.com",
            phone="0811234567",
            client_type=ClientType.CORPORATE,
            **kwargs,
        )

    def make_client_user(self, client, role=UserRole.CLIENT_USER, email=None):
        from apps.clients.models import ClientUser
        user = self.make_user(role=role, email=email or f"clientuser_{client.id}@test.com")
        ClientUser.objects.create(
            user=user,
            client=client,
            is_admin=(role == UserRole.CLIENT_ADMIN),
        )
        return user

    # ---------------------------------------------------------------------------
    # Dealer helpers
    # ---------------------------------------------------------------------------

    def make_dealer(self, name="Test Dealer", **kwargs):
        from apps.dealers.models import Dealer
        return Dealer.objects.create(
            dealer_name=name,
            contact_person="Dealer Contact",
            email=f"{name.lower().replace(' ', '_')}@dealer.com",
            phone="0817654321",
            **kwargs,
        )

    def make_dealer_user(self, dealer, email=None):
        from apps.dealers.models import DealerUser
        user = self.make_user(role=UserRole.DEALER_ADMIN, email=email or f"dealer_{dealer.id}@test.com")
        DealerUser.objects.create(user=user, dealer=dealer, is_primary=True)
        return user

    # ---------------------------------------------------------------------------
    # Vehicle helpers
    # ---------------------------------------------------------------------------

    _vehicle_counter = 0

    def make_vehicle(self, client=None, reg=None, **kwargs):
        from apps.vehicles.models import Vehicle, VehicleType, FuelType, Transmission, OwnershipType
        NamRentAPITestCase._vehicle_counter += 1
        defaults = dict(
            registration_number=reg or f"N-TEST-{NamRentAPITestCase._vehicle_counter:04d}",
            make="Toyota",
            model="Hilux",
            year=2023,
            vehicle_type=VehicleType.PICKUP,
            fuel_type=FuelType.DIESEL,
            transmission=Transmission.MANUAL,
            ownership_type=OwnershipType.NAMRENT_OWNED,
        )
        defaults.update(kwargs)
        if client:
            defaults["assigned_client"] = client
        return Vehicle.objects.create(**defaults)

    # ---------------------------------------------------------------------------
    # Contract helpers
    # ---------------------------------------------------------------------------

    _contract_counter = 0

    def make_contract(self, client, **kwargs):
        from apps.contracts.models import Contract, PathwayType, ContractStatus
        NamRentAPITestCase._contract_counter += 1
        today = timezone.now().date()
        return Contract.objects.create(
            contract_number=f"CNT-{NamRentAPITestCase._contract_counter:04d}",
            client=client,
            pathway_type=PathwayType.EXISTING_FLEET,
            start_date=today,
            end_date=kwargs.pop("end_date", today.replace(year=today.year + 3)),
            duration_months=36,
            monthly_fee="5000.00",
            status=ContractStatus.ACTIVE,
            **kwargs,
        )

    # ---------------------------------------------------------------------------
    # Invoice helpers
    # ---------------------------------------------------------------------------

    _invoice_counter = 0

    def make_invoice(self, client, **kwargs):
        from apps.invoices.models import Invoice, InvoiceStatus
        NamRentAPITestCase._invoice_counter += 1
        today = timezone.now().date()
        return Invoice.objects.create(
            invoice_number=f"INV-{NamRentAPITestCase._invoice_counter:04d}",
            client=client,
            issue_date=today,
            due_date=kwargs.pop("due_date", today),
            subtotal="5000.00",
            vat_amount="750.00",
            total_amount="5750.00",
            status=kwargs.pop("status", InvoiceStatus.SENT),
            **kwargs,
        )
