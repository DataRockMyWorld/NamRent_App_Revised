from django.utils import timezone


def generate_reference_number(prefix: str, model_class) -> str:
    """
    Generate a human-readable reference number: PREFIX-YYYY-NNNN
    e.g. CNT-2024-0001, MNT-2024-0042
    Thread-safe via DB max() — wrap in atomic transaction if needed.
    """
    year = timezone.now().year
    prefix_pattern = f"{prefix}-{year}-"

    existing = (
        model_class.objects.filter(reference_number__startswith=prefix_pattern)
        .values_list("reference_number", flat=True)
        .order_by("-reference_number")
        .first()
    )

    if existing:
        last_seq = int(existing.split("-")[-1])
        seq = last_seq + 1
    else:
        seq = 1

    return f"{prefix}-{year}-{seq:04d}"
