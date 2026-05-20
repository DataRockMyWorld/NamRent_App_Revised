from django.db import models
from common.models import BaseModel


class InvoiceStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SENT = "SENT", "Sent"
    VIEWED = "VIEWED", "Viewed"
    PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"
    PAID = "PAID", "Paid"
    OVERDUE = "OVERDUE", "Overdue"
    CANCELLED = "CANCELLED", "Cancelled"


class InvoiceItemType(models.TextChoices):
    LEASE_FEE = "LEASE_FEE", "Lease Fee"
    MAINTENANCE = "MAINTENANCE", "Maintenance"
    INSURANCE = "INSURANCE", "Insurance"
    LICENSING = "LICENSING", "Licensing"
    TRACKING = "TRACKING", "Tracking"
    TRADE_IN_CHARGE = "TRADE_IN_CHARGE", "Trade-In Charge"
    PROCUREMENT_FEE = "PROCUREMENT_FEE", "Procurement Support Fee"
    OTHER = "OTHER", "Other"


class PaymentMethod(models.TextChoices):
    EFT = "EFT", "EFT / Bank Transfer"
    CASH = "CASH", "Cash"
    OTHER = "OTHER", "Other"


class Invoice(BaseModel):
    invoice_number = models.CharField(max_length=20, unique=True, db_index=True)
    client = models.ForeignKey("clients.Client", on_delete=models.CASCADE, related_name="invoices")
    contract = models.ForeignKey(
        "contracts.Contract", null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices"
    )
    issue_date = models.DateField()
    due_date = models.DateField(db_index=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    vat_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(
        max_length=15, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT, db_index=True
    )
    payment_method = models.CharField(
        max_length=10, choices=PaymentMethod.choices, null=True, blank=True
    )
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_invoices"
    )

    class Meta:
        db_table = "invoices"
        ordering = ["-issue_date"]

    def __str__(self):
        return f"{self.invoice_number} — {self.client.company_name} (NAD {self.total_amount})"


class InvoiceItem(models.Model):
    id = models.AutoField(primary_key=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    item_type = models.CharField(max_length=20, choices=InvoiceItemType.choices)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        db_table = "invoice_items"

    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class PaymentRecord(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payment_records")
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices)
    reference_number = models.CharField(max_length=100, blank=True)
    recorded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "payment_records"
        ordering = ["-payment_date"]
