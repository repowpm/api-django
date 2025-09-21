from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ProductoViewSet
from .auth_views import (
    CustomTokenObtainPairView,
    register_user,
    refresh_token,
    logout_user,
    user_profile
)

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)

urlpatterns = [
    # Rutas de productos
    path('', include(router.urls)),
    
    # Rutas de autenticación
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/register/', register_user, name='register'),
    path('auth/refresh/', refresh_token, name='token_refresh'),
    path('auth/logout/', logout_user, name='logout'),
    path('auth/profile/', user_profile, name='user_profile'),
]