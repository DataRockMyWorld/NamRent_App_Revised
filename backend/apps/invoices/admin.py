from django.contrib import admin
from .models import Invoice, InvoiceItem, PaymentRecord


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    fields = ["item_type", "description", "quantity", "unit_price", "line_total"]
    readonly_fields = ["line_total"]


class PaymentRecordInline(admin.TabularInline):
    model = PaymentRecord
    extra = 0
    fields = ["amount_paid", "payment_date", "payment_method", "reference_number", "recorded_by"]
    readonly_fields = ["id", "created_at"]
    raw_id_fields = ["recorded_by"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number", "client", "issue_date", "due_date",
        "total_amount", "status", "payment_date",
    ]
    list_filter = ["status", "payment_method"]
    search_fields = ["invoice_number", "client__company_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["client", "contract", "created_by"]
    inlines = [InvoiceItemInline, PaymentRecordInline]


@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ["invoice", "amount_paid", "payment_date", "payment_method", "reference_number"]
    search_fields = ["invoice__invoice_number", "reference_number"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["invoice", "recorded_by"]
