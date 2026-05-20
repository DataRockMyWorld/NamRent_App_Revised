from rest_framework.routers import DefaultRouter
from .views import DealerOfferViewSet, ProcurementRequestViewSet

router = DefaultRouter()
router.register(r"", ProcurementRequestViewSet, basename="procurement-request")
router.register(r"offers", DealerOfferViewSet, basename="dealer-offer")

urlpatterns = router.urls
