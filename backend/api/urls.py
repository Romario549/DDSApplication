from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('statuses', views.StatusViewSet)
router.register('types', views.TypeViewSet)
router.register('categories', views.CategoryViewSet)
router.register('subcategories', views.SubcategoryViewSet)
router.register('notes', views.NoteViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]