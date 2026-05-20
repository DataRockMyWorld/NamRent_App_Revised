from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("django-admin/", admin.site.urls),

    # API v1
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/clients/", include("apps.clients.urls")),
    path("api/dealers/", include("apps.dealers.urls")),
    path("api/vehicles/", include("apps.vehicles.urls")),
    path("api/service-requests/", include("apps.service_requests.urls")),
    path("api/procurement/", include("apps.procurement.urls")),
    path("api/tradeins/", include("apps.tradeins.urls")),
    path("api/maintenance/", include("apps.maintenance.urls")),
    path("api/contracts/", include("apps.contracts.urls")),
    path("api/invoices/", include("apps.invoices.urls")),
    path("api/documents/", include("apps.documents.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/activity/", include("apps.activity.urls")),
    path("api/reports/", include("apps.reports.urls")),

    # API schema & Swagger UI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
