from rest_framework.routers import DefaultRouter
from .views import TradeInRequestViewSet, TradeInValuationViewSet

router = DefaultRouter()
router.register(r"", TradeInRequestViewSet, basename="trade-in-request")
router.register(r"valuations", TradeInValuationViewSet, basename="trade-in-valuation")

urlpatterns = router.urls
