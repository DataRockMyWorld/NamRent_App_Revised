from rest_framework.routers import DefaultRouter
from .views import DealerViewSet

router = DefaultRouter()
router.register(r"", DealerViewSet, basename="dealer")

urlpatterns = router.urls
