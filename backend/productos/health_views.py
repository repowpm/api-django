from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
import logging
import time
from datetime import datetime

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint de health check para monitoreo y evitar que Render se duerma.
    Verifica:
    - Estado de la aplicación
    - Conexión a la base de datos
    - Cache
    - Tiempo de respuesta
    """
    start_time = time.time()
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'checks': {}
    }
    
    try:
        # 1. Verificar conexión a la base de datos
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                db_result = cursor.fetchone()
            health_status['checks']['database'] = {
                'status': 'ok',
                'message': 'Database connection successful'
            }
        except Exception as e:
            health_status['checks']['database'] = {
                'status': 'error',
                'message': f'Database connection failed: {str(e)}'
            }
            health_status['status'] = 'unhealthy'
        
        # 2. Verificar cache
        try:
            cache_key = 'health_check_test'
            cache.set(cache_key, 'test_value', 30)
            cached_value = cache.get(cache_key)
            if cached_value == 'test_value':
                health_status['checks']['cache'] = {
                    'status': 'ok',
                    'message': 'Cache is working'
                }
            else:
                health_status['checks']['cache'] = {
                    'status': 'warning',
                    'message': 'Cache test failed'
                }
        except Exception as e:
            health_status['checks']['cache'] = {
                'status': 'error',
                'message': f'Cache failed: {str(e)}'
            }
        
        # 3. Verificar tiempo de respuesta
        response_time = (time.time() - start_time) * 1000  # en milisegundos
        health_status['checks']['response_time'] = {
            'status': 'ok' if response_time < 1000 else 'warning',
            'value': f'{response_time:.2f}ms',
            'message': 'Response time acceptable' if response_time < 1000 else 'Response time slow'
        }
        
        # 4. Información del sistema
        health_status['system'] = {
            'python_version': '3.13.4',
            'django_version': '5.2.6',
            'environment': 'production'
        }
        
        # Determinar estado general
        if health_status['status'] == 'healthy':
            # Verificar si hay warnings
            warnings = [check for check in health_status['checks'].values() 
                       if check.get('status') == 'warning']
            if warnings:
                health_status['status'] = 'degraded'
        
        # Log del health check
        logger.info(f"Health check completed: {health_status['status']} in {response_time:.2f}ms")
        
        # Retornar status code apropiado
        if health_status['status'] == 'healthy':
            return Response(health_status, status=status.HTTP_200_OK)
        elif health_status['status'] == 'degraded':
            return Response(health_status, status=status.HTTP_200_OK)
        else:
            return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return Response({
            'status': 'error',
            'timestamp': datetime.now().isoformat(),
            'message': f'Health check failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def simple_ping(request):
    """
    Endpoint simple de ping para monitoreo básico.
    Muy ligero, ideal para Pulsetic.
    """
    return Response({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'message': 'API is alive'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def status_check(request):
    """
    Endpoint de status para verificación rápida.
    """
    return Response({
        'status': 'online',
        'service': 'Django API',
        'timestamp': datetime.now().isoformat()
    }, status=status.HTTP_200_OK)
