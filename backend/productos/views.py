from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse
from django.core.exceptions import ValidationError
from django.db import transaction
import logging

from .models import Producto
from .serializers import (
    ProductoSerializer, 
    ProductoCreateSerializer, 
    ProductoUpdateSerializer,
    ProductoListSerializer
)

logger = logging.getLogger(__name__)

class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar productos con autenticación JWT.
    """
    queryset = Producto.objects.filter(activo=True)
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return ProductoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductoUpdateSerializer
        elif self.action == 'list':
            return ProductoListSerializer
        return ProductoSerializer

    def get_queryset(self):
        """Filtros adicionales para el queryset"""
        queryset = super().get_queryset()
        
        # Filtro por nombre (búsqueda)
        nombre = self.request.query_params.get('nombre', None)
        if nombre:
            queryset = queryset.filter(nombre__icontains=nombre)
        
        # Filtro por rango de precios
        precio_min = self.request.query_params.get('precio_min', None)
        precio_max = self.request.query_params.get('precio_max', None)
        
        if precio_min:
            queryset = queryset.filter(precio__gte=precio_min)
        if precio_max:
            queryset = queryset.filter(precio__lte=precio_max)
        
        # Filtro por stock disponible
        con_stock = self.request.query_params.get('con_stock', None)
        if con_stock and con_stock.lower() == 'true':
            queryset = queryset.filter(stock__gt=0)
        
        # Filtro por productos con PDF
        con_pdf = self.request.query_params.get('con_pdf', None)
        if con_pdf and con_pdf.lower() == 'true':
            queryset = queryset.exclude(orden_trabajo_pdf__isnull=True)
        
        return queryset.order_by('-fecha_creacion')

    def create(self, request, *args, **kwargs):
        """Crear producto con manejo de PDF"""
        try:
            logger.info(f"Iniciando creación de producto. Usuario: {request.user.username}")
            logger.info(f"Datos recibidos: {dict(request.data)}")
            logger.info(f"Archivos recibidos: {list(request.FILES.keys())}")
            
            with transaction.atomic():
                # Usar directamente los datos sin copiar para evitar problemas
                data = request.data.copy()
                pdf_file = request.FILES.get('orden_trabajo_pdf')
                
                logger.info(f"PDF file presente: {pdf_file is not None}")
                
                # Remover el campo PDF de los datos para evitar problemas de validación
                if 'orden_trabajo_pdf' in data:
                    del data['orden_trabajo_pdf']
                
                logger.info(f"Campos en data: {list(data.keys())}")
                
                serializer = self.get_serializer(data=data)
                logger.info(f"Serializer creado: {type(serializer).__name__}")
                
                logger.info("Validando serializer...")
                if serializer.is_valid():
                    logger.info("Serializer es válido, guardando producto...")
                    producto = serializer.save()
                    
                    # Manejar PDF después de crear el producto
                    if pdf_file:
                        logger.info(f"Procesando archivo PDF. Tamaño: {pdf_file.size}")
                        if pdf_file.size > 10 * 1024 * 1024:  # 10MB
                            logger.warning(f"Archivo PDF demasiado grande: {pdf_file.size} bytes")
                            return Response({
                                'error': 'El archivo PDF no puede ser mayor a 10MB'
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        producto.orden_trabajo_pdf = pdf_file.read()
                        producto.save()
                        logger.info("PDF guardado en el producto")
                    
                    logger.info(f"Producto creado exitosamente: {producto.nombre} (ID: {producto.id})")
                    
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                else:
                    logger.error(f"Serializer no es válido. Errores: {serializer.errors}")
                    # Procesar errores específicos para el usuario
                    error_messages = []
                    for field, errors in serializer.errors.items():
                        if field == 'nombre' and 'Ya existe un producto con este nombre' in str(errors):
                            error_messages.append('Ya existe un producto con este nombre. Por favor, usa un nombre diferente.')
                        elif field == 'precio':
                            error_messages.append('El precio debe ser un número válido mayor a 0.')
                        elif field == 'stock':
                            error_messages.append('El stock debe ser un número entero mayor o igual a 0.')
                        elif field == 'numero_ot':
                            error_messages.append('El número de OT debe ser un número entero mayor a 0.')
                        else:
                            error_messages.append(f'{field}: {errors[0] if isinstance(errors, list) else errors}')
                    
                    return Response({
                        'error': 'Datos inválidos',
                        'details': '; '.join(error_messages) if error_messages else 'Por favor, verifica los datos ingresados'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValidationError as e:
            logger.error(f"Error de validación al crear producto: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error inesperado al crear producto: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """Actualizar producto con manejo de PDF"""
        try:
            logger.info(f"Iniciando actualización de producto. Usuario: {request.user.username}")
            logger.info(f"Datos recibidos: {dict(request.data)}")
            logger.info(f"Archivos recibidos: {list(request.FILES.keys())}")
            
            with transaction.atomic():
                instance = self.get_object()
                data = request.data.copy()
                pdf_file = request.FILES.get('orden_trabajo_pdf')
                
                logger.info(f"PDF file presente: {pdf_file is not None}")
                
                # Remover el campo PDF de los datos para evitar problemas de validación
                if 'orden_trabajo_pdf' in data:
                    del data['orden_trabajo_pdf']
                
                logger.info(f"Campos en data: {list(data.keys())}")
                
                partial = kwargs.pop('partial', False)
                serializer = self.get_serializer(instance, data=data, partial=partial)
                logger.info(f"Serializer creado: {type(serializer).__name__}")
                
                logger.info("Validando serializer...")
                if serializer.is_valid():
                    logger.info("Serializer es válido, guardando producto...")
                    producto = serializer.save()
                    
                    # Manejar PDF después de actualizar el producto
                    if pdf_file:
                        logger.info(f"Procesando archivo PDF. Tamaño: {pdf_file.size}")
                        if pdf_file.size > 10 * 1024 * 1024:  # 10MB
                            logger.warning(f"Archivo PDF demasiado grande: {pdf_file.size} bytes")
                            return Response({
                                'error': 'El archivo PDF no puede ser mayor a 10MB'
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        producto.orden_trabajo_pdf = pdf_file.read()
                        producto.save()
                        logger.info("PDF guardado en el producto")
                    
                    logger.info(f"Producto actualizado exitosamente: {producto.nombre} (ID: {producto.id})")
                    
                    return Response(serializer.data)
                else:
                    logger.error(f"Serializer no es válido. Errores: {serializer.errors}")
                    # Procesar errores específicos para el usuario
                    error_messages = []
                    for field, errors in serializer.errors.items():
                        if field == 'nombre' and 'Ya existe un producto con este nombre' in str(errors):
                            error_messages.append('Ya existe un producto con este nombre. Por favor, usa un nombre diferente.')
                        elif field == 'precio':
                            error_messages.append('El precio debe ser un número válido mayor a 0.')
                        elif field == 'stock':
                            error_messages.append('El stock debe ser un número entero mayor o igual a 0.')
                        elif field == 'numero_ot':
                            error_messages.append('El número de OT debe ser un número entero mayor a 0.')
                        else:
                            error_messages.append(f'{field}: {errors[0] if isinstance(errors, list) else errors}')
                    
                    return Response({
                        'error': 'Datos inválidos',
                        'details': '; '.join(error_messages) if error_messages else 'Por favor, verifica los datos ingresados'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValidationError as e:
            logger.error(f"Error de validación al actualizar producto: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error inesperado al actualizar producto: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """Eliminación lógica del producto"""
        try:
            logger.info(f"Iniciando eliminación de producto. Usuario: {request.user.username}")
            logger.info(f"ID del producto a eliminar: {kwargs.get('pk')}")
            
            instance = self.get_object()
            logger.info(f"Producto encontrado: {instance.nombre} (ID: {instance.id})")
            
            instance.activo = False
            instance.save(update_fields=['activo'])
            
            logger.info(f"Producto desactivado exitosamente: {instance.nombre} por usuario {request.user.username}")
            
            return Response({
                'message': 'Producto eliminado exitosamente'
            }, status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error(f"Error al eliminar producto: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='descargar-ot')
    def descargar_ot(self, request, pk=None):
        """Descargar PDF de orden de trabajo"""
        try:
            producto = self.get_object()
            
            if not producto.orden_trabajo_pdf:
                return Response({
                    'error': 'No hay PDF cargado para este producto'
                }, status=status.HTTP_404_NOT_FOUND)
            
            response = HttpResponse(
                producto.orden_trabajo_pdf, 
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename=orden_trabajo_{producto.id}_{producto.nombre}.pdf'
            
            logger.info(f"PDF descargado: {producto.nombre} por usuario {request.user.username}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error al descargar PDF: {e}")
            return Response({
                'error': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='reducir-stock')
    def reducir_stock(self, request, pk=None):
        """Reducir stock del producto"""
        try:
            producto = self.get_object()
            cantidad = request.data.get('cantidad')
            
            if not cantidad or cantidad <= 0:
                return Response({
                    'error': 'La cantidad debe ser mayor a 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            producto.reducir_stock(cantidad)
            
            logger.info(f"Stock reducido: {producto.nombre} - {cantidad} unidades por usuario {request.user.username}")
            
            return Response({
                'message': f'Stock reducido exitosamente. Stock actual: {producto.stock}',
                'stock_actual': producto.stock
            })
            
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error al reducir stock: {e}")
            return Response({
                'error': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='aumentar-stock')
    def aumentar_stock(self, request, pk=None):
        """Aumentar stock del producto"""
        try:
            producto = self.get_object()
            cantidad = request.data.get('cantidad')
            
            if not cantidad or cantidad <= 0:
                return Response({
                    'error': 'La cantidad debe ser mayor a 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            producto.aumentar_stock(cantidad)
            
            logger.info(f"Stock aumentado: {producto.nombre} - {cantidad} unidades por usuario {request.user.username}")
            
            return Response({
                'message': f'Stock aumentado exitosamente. Stock actual: {producto.stock}',
                'stock_actual': producto.stock
            })
            
        except Exception as e:
            logger.error(f"Error al aumentar stock: {e}")
            return Response({
                'error': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        """Estadísticas generales de productos"""
        try:
            total_productos = self.get_queryset().count()
            productos_con_stock = self.get_queryset().filter(stock__gt=0).count()
            productos_con_pdf = self.get_queryset().exclude(orden_trabajo_pdf__isnull=True).count()
            
            # Precio promedio
            from django.db.models import Avg
            precio_promedio = self.get_queryset().aggregate(
                precio_promedio=Avg('precio')
            )['precio_promedio'] or 0
            
            return Response({
                'total_productos': total_productos,
                'productos_con_stock': productos_con_stock,
                'productos_con_pdf': productos_con_pdf,
                'precio_promedio': round(precio_promedio, 2)
            })
            
        except Exception as e:
            logger.error(f"Error al obtener estadísticas: {e}")
            return Response({
                'error': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)