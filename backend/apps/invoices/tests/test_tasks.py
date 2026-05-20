from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.invoices.models import Invoice, InvoiceStatus
from apps.invoices.tasks import mark_overdue_invoices
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
        company_name="Invoice Corp",
        contact_person_name="Contact",
        email="invoicecorp@test.com",
        phone="081000000",
        client_type=ClientType.CORPORATE,
    )


class MarkOverdueInvoicesTest(TestCase):

    def setUp(self):
        self.staff = _make_staff()
        self.client_entity = _make_client()
        self.yesterday = timezone.now().date() - timedelta(days=1)
        self.tomorrow = timezone.now().date() + timedelta(days=1)

    def _make_invoice(self, due_date, status=InvoiceStatus.SENT, number=None):
        from common.test_helpers import NamRentAPITestCase
        NamRentAPITestCase._invoice_counter += 1
        n = number or NamRentAPITestCase._invoice_counter
        return Invoice.objects.create(
            invoice_number=f"INV-TASK-{n:04d}",
            client=self.client_entity,
            issue_date=timezone.now().date() - timedelta(days=30),
            due_date=due_date,
            subtotal="1000.00",
            vat_amount="150.00",
            total_amount="1150.00",
            status=status,
        )

    def test_sent_past_due_marked_overdue(self):
        inv = self._make_invoice(self.yesterday, InvoiceStatus.SENT)
        mark_overdue_invoices()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvoiceStatus.OVERDUE)

    def test_viewed_past_due_marked_overdue(self):
        inv = self._make_invoice(self.yesterday, InvoiceStatus.VIEWED)
        mark_overdue_invoices()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvoiceStatus.OVERDUE)

    def test_partially_paid_past_due_marked_overdue(self):
        inv = self._make_invoice(self.yesterday, InvoiceStatus.PARTIALLY_PAID)
        mark_overdue_invoices()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvoiceStatus.OVERDUE)

    def test_future_due_date_not_affected(self):
        inv = self._make_invoice(self.tomorrow, InvoiceStatus.SENT)
        mark_overdue_invoices()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvoiceStatus.SENT)

    def test_paid_invoice_not_affected(self):
        inv = self._make_invoice(self.yesterday, InvoiceStatus.PAID)
        mark_overdue_invoices()
        inv.refresh_from_db()
        self.assertEqual(inv.status, InvoiceStatus.PAID)

    def test_creates_notifications_for_staff(self):
        self._make_invoice(self.yesterday, InvoiceStatus.SENT)
        mark_overdue_invoices()
        self.assertTrue(
            Notification.objects.filter(recipient=self.staff).exists()
        )

    def test_no_invoices_returns_early(self):
        result = mark_overdue_invoices()
        self.assertIn("No invoices", result)
