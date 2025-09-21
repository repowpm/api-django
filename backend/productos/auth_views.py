"""
Vistas de autenticación para la API.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para obtener tokens JWT.
    """
    def post(self, request, *args, **kwargs):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            logger.info(f"Intento de login para usuario: {username}")
            
            # Verificar que se proporcionaron las credenciales
            if not username or not password:
                return Response({
                    'error': 'Usuario y contraseña son requeridos'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Intentar autenticación
            user = authenticate(username=username, password=password)
            
            if user is None:
                logger.warning(f"Credenciales incorrectas para usuario: {username}")
                return Response({
                    'error': 'Usuario o contraseña incorrecta, intente nuevamente por favor'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active:
                logger.warning(f"Usuario inactivo: {username}")
                return Response({
                    'error': 'Usuario o contraseña incorrecta, intente nuevamente por favor'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generar tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            logger.info(f"Login exitoso para usuario: {username}")
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error en login: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor, intente más tarde'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Registrar nuevo usuario.
    """
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        # Validaciones básicas
        if not username or not password:
            return Response({
                'error': 'Username y password son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({
                'error': 'La contraseña debe tener al menos 8 caracteres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el usuario ya existe
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'El usuario ya existe'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if email and User.objects.filter(email=email).exists():
            return Response({
                'error': 'El email ya está registrado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear usuario
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Usuario registrado: {username}")
        
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
        
    except ValidationError as e:
        logger.error(f"Error de validación en registro: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error inesperado en registro: {e}")
        return Response({
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Renovar token de acceso.
    """
    try:
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'error': 'Token de refresh es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar y obtener nuevo token
        refresh = RefreshToken(refresh_token)
        access_token = refresh.access_token
        
        logger.info(f"Token renovado para usuario: {refresh.payload.get('username')}")
        
        return Response({
            'access': str(access_token),
            'refresh': str(refresh)
        })
        
    except Exception as e:
        logger.error(f"Error al renovar token: {e}")
        return Response({
            'error': 'Token de refresh inválido'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_user(request):
    """
    Cerrar sesión (invalidar token).
    """
    try:
        refresh_token = request.data.get('refresh')
        
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            logger.info(f"Usuario deslogueado: {request.user.username}")
        
        return Response({
            'message': 'Sesión cerrada exitosamente'
        })
        
    except Exception as e:
        logger.error(f"Error al cerrar sesión: {e}")
        return Response({
            'error': 'Error al cerrar sesión'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def user_profile(request):
    """
    Obtener perfil del usuario autenticado.
    """
    try:
        user = request.user
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined,
            'is_active': user.is_active
        })
        
    except Exception as e:
        logger.error(f"Error al obtener perfil: {e}")
        return Response({
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
