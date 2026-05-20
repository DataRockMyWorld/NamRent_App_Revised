from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.contracts.models import Contract, ContractStatus, PathwayType, RenewalStatus
from apps.contracts.tasks import send_contract_expiry_reminders
from apps.notifications.models import Notification


def _make_staff(email="staff@test.com"):
    return User.objects.create_user(
        email=email, password="pass",
        first_name="Staff", last_name="User",
        role=UserRole.NAMRENT_OPS,
    )


def _make_client():
    from apps.clients.models import Client, ClientType
    return Client.objects.create(
        company_name="Contract Corp",
        contact_person_name="Contact",
        email="contractcorp@test.com",
        phone="081000000",
        client_type=ClientType.CORPORATE,
    )


def _make_contract(client, end_date, status=ContractStatus.ACTIVE, number=None):
    Contract._counter = getattr(Contract, "_counter", 0) + 1
    return Contract.objects.create(
        contract_number=number or f"CNT-TASK-{Contract._counter:04d}",
        client=client,
        pathway_type=PathwayType.EXISTING_FLEET,
        start_date=timezone.now().date(),
        end_date=end_date,
        duration_months=36,
        monthly_fee="5000.00",
        status=status,
    )


class SendContractExpiryRemindersTest(TestCase):

    def setUp(self):
        self.staff = _make_staff()
        self.client_entity = _make_client()
        self.today = timezone.now().date()

    def test_contract_expiring_in_30_days_triggers_reminder(self):
        _make_contract(self.client_entity, self.today + timedelta(days=30))
        result = send_contract_expiry_reminders()
        self.assertIn("1", result)
        self.assertTrue(Notification.objects.filter(recipient=self.staff).exists())

    def test_contract_expiring_in_60_days_triggers_reminder(self):
        _make_contract(self.client_entity, self.today + timedelta(days=60), number="CNT-60")
        result = send_contract_expiry_reminders()
        self.assertIn("1", result)

    def test_contract_not_near_expiry_no_reminder(self):
        _make_contract(self.client_entity, self.today + timedelta(days=90))
        result = send_contract_expiry_reminders()
        self.assertIn("0", result)
        self.assertFalse(Notification.objects.filter(recipient=self.staff).exists())

    def test_expired_contract_not_reminded(self):
        _make_contract(self.client_entity, self.today + timedelta(days=30), status=ContractStatus.EXPIRED)
        result = send_contract_expiry_reminders()
        self.assertIn("0", result)

    def test_renewal_status_updated_to_pending_on_first_reminder(self):
        contract = _make_contract(self.client_entity, self.today + timedelta(days=30))
        self.assertEqual(contract.renewal_status, RenewalStatus.NOT_DUE)
        send_contract_expiry_reminders()
        contract.refresh_from_db()
        self.assertEqual(contract.renewal_status, RenewalStatus.PENDING)

    def test_already_pending_renewal_status_unchanged(self):
        contract = _make_contract(self.client_entity, self.today + timedelta(days=30))
        contract.renewal_status = RenewalStatus.RENEWED
        contract.save()
        send_contract_expiry_reminders()
        contract.refresh_from_db()
        self.assertEqual(contract.renewal_status, RenewalStatus.RENEWED)
