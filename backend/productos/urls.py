from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .views import ProductoViewSet
from .auth_views import (
    CustomTokenObtainPairView,
    register_user,
    refresh_token,
    logout_user,
    user_profile
)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Endpoint de prueba para verificar que la API funciona"""
    return Response({'status': 'OK', 'message': 'API funcionando correctamente'})

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)

urlpatterns = [
    # Rutas de productos
    path('', include(router.urls)),
    
    # Endpoint de prueba
    path('health/', health_check, name='health_check'),
    
    # Rutas de autenticación
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/register/', register_user, name='register'),
    path('auth/refresh/', refresh_token, name='token_refresh'),
    path('auth/logout/', logout_user, name='logout'),
    path('auth/profile/', user_profile, name='user_profile'),
]