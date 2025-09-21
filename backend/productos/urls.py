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

@api_view(['POST'])
@permission_classes([AllowAny])
def create_admin_user(request):
    """Crear usuario admin para desarrollo/producción"""
    try:
        from django.contrib.auth.models import User
        
        # Verificar si el usuario admin ya existe
        if User.objects.filter(username='admin').exists():
            return Response({
                'message': 'Usuario admin ya existe',
                'username': 'admin'
            })
        
        # Crear usuario admin
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            is_staff=True,
            is_superuser=True
        )
        
        return Response({
            'message': 'Usuario admin creado exitosamente',
            'username': 'admin',
            'password': 'admin123'
        })
        
    except Exception as e:
        return Response({
            'error': f'Error al crear usuario admin: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)

urlpatterns = [
    # Rutas de productos
    path('', include(router.urls)),
    
    # Endpoint de prueba
    path('health/', health_check, name='health_check'),
    path('create-admin/', create_admin_user, name='create_admin'),
    
    # Rutas de autenticación
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/register/', register_user, name='register'),
    path('auth/refresh/', refresh_token, name='token_refresh'),
    path('auth/logout/', logout_user, name='logout'),
    path('auth/profile/', user_profile, name='user_profile'),
]