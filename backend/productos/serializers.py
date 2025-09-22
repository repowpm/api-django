from rest_framework import serializers
from .models import Producto
from django.core.exceptions import ValidationError

class ProductoSerializer(serializers.ModelSerializer):
    orden_trabajo_pdf = serializers.SerializerMethodField()
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_actualizacion = serializers.DateTimeField(read_only=True)
    activo = serializers.BooleanField(read_only=True)
    precio_formateado = serializers.SerializerMethodField()
    tiene_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'precio', 'descripcion', 'stock', 'numero_ot', 
            'orden_trabajo_pdf', 'fecha_creacion', 'fecha_actualizacion', 
            'activo', 'precio_formateado', 'tiene_pdf'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def get_orden_trabajo_pdf(self, obj):
        """Indica si existe un PDF sin exponer el contenido"""
        return obj.tiene_pdf

    def get_precio_formateado(self, obj):
        """Retorna el precio formateado"""
        return obj.get_precio_formateado()

    def get_tiene_pdf(self, obj):
        """Indica si el producto tiene PDF"""
        return obj.tiene_pdf

    def validate_nombre(self, value):
        """Validación personalizada para el nombre"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Validando nombre: '{value}' (tipo: {type(value)})")
        
        if not value or not value.strip():
            logger.error(f"Nombre vacío: '{value}'")
            raise serializers.ValidationError("El nombre no puede estar vacío")
        
        # Verificar que no exista otro producto con el mismo nombre
        if self.instance is None:  # Creando nuevo producto
            if Producto.objects.filter(nombre__iexact=value.strip()).exists():
                logger.error(f"Nombre duplicado: '{value.strip()}'")
                raise serializers.ValidationError("Ya existe un producto con este nombre")
        else:  # Actualizando producto existente
            if Producto.objects.filter(nombre__iexact=value.strip()).exclude(id=self.instance.id).exists():
                logger.error(f"Nombre duplicado: '{value.strip()}'")
                raise serializers.ValidationError("Ya existe un producto con este nombre")
        
        logger.info(f"Nombre válido: '{value.strip()}'")
        return value.strip()

    def validate_precio(self, value):
        """Validación personalizada para el precio"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Validando precio: {value} (tipo: {type(value)})")
        
        if value <= 0:
            logger.error(f"Precio inválido: {value} <= 0")
            raise serializers.ValidationError("El precio debe ser mayor a 0")
        
        if value > 99999999.99:
            logger.error(f"Precio demasiado alto: {value} > 99999999.99")
            raise serializers.ValidationError("El precio no puede ser mayor a $99,999,999.99")
        
        logger.info(f"Precio válido: {value}")
        return value

    def validate_stock(self, value):
        """Validación personalizada para el stock"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Validando stock: {value} (tipo: {type(value)})")
        
        if value is not None and value < 0:
            logger.error(f"Stock inválido: {value} < 0")
            raise serializers.ValidationError("El stock no puede ser negativo")
        
        logger.info(f"Stock válido: {value}")
        return value

    def validate_numero_ot(self, value):
        """Validación personalizada para el número de Factura"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Validando numero_ot: {value} (tipo: {type(value)})")
        
        if value is not None and value <= 0:
            logger.error(f"Número Factura inválido: {value} <= 0")
            raise serializers.ValidationError("El número de Factura debe ser mayor a 0")
        
        logger.info(f"Número Factura válido: {value}")
        return value

    def validate(self, data):
        """Validaciones a nivel de objeto"""
        # Validar que si se proporciona número_ot, también se proporcione stock
        if data.get('numero_ot') and not data.get('stock'):
            raise serializers.ValidationError({
                'stock': 'Si se proporciona número de Factura, también debe proporcionarse el stock'
            })
        
        return data

class ProductoCreateSerializer(ProductoSerializer):
    """Serializer específico para crear productos"""
    # Remover el campo PDF del serializer para evitar problemas
    # orden_trabajo_pdf = serializers.FileField(required=False, allow_null=True, allow_empty_file=True)
    
    class Meta(ProductoSerializer.Meta):
        # Remover campos de solo lectura para creación
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion', 'activo']
    
    def create(self, validated_data):
        """Crear producto con validaciones adicionales"""
        try:
            import logging
            logger = logging.getLogger(__name__)
            
            logger.info(f"ProductoCreateSerializer.create - validated_data keys: {list(validated_data.keys())}")
            
            # Remover el campo PDF si está vacío o es None para evitar problemas
            if 'orden_trabajo_pdf' in validated_data:
                if validated_data['orden_trabajo_pdf'] is None or validated_data['orden_trabajo_pdf'] == '':
                    logger.info("Removiendo campo orden_trabajo_pdf vacío")
                    del validated_data['orden_trabajo_pdf']
                else:
                    logger.info(f"PDF presente, tamaño: {len(validated_data['orden_trabajo_pdf']) if isinstance(validated_data['orden_trabajo_pdf'], (bytes, str)) else 'N/A'}")
            
            logger.info("Llamando a super().create()...")
            result = super().create(validated_data)
            logger.info(f"Producto creado exitosamente: {result.id}")
            return result
        except ValidationError as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"ValidationError en ProductoCreateSerializer: {e}")
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else str(e))
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error inesperado en ProductoCreateSerializer: {e}", exc_info=True)
            raise

class ProductoUpdateSerializer(ProductoSerializer):
    """Serializer específico para actualizar productos"""
    # Remover el campo PDF del serializer para evitar problemas
    # orden_trabajo_pdf = serializers.FileField(required=False, allow_null=True, allow_empty_file=True)
    
    class Meta(ProductoSerializer.Meta):
        # Remover campos de solo lectura para actualización
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion', 'activo']
    
    def update(self, instance, validated_data):
        """Actualizar producto con validaciones adicionales"""
        try:
            import logging
            logger = logging.getLogger(__name__)
            
            logger.info(f"ProductoUpdateSerializer.update - validated_data keys: {list(validated_data.keys())}")
            
            # Remover el campo PDF si está vacío o es None para evitar problemas
            if 'orden_trabajo_pdf' in validated_data:
                if validated_data['orden_trabajo_pdf'] is None or validated_data['orden_trabajo_pdf'] == '':
                    logger.info("Removiendo campo orden_trabajo_pdf vacío")
                    del validated_data['orden_trabajo_pdf']
                else:
                    logger.info(f"PDF presente, tamaño: {len(validated_data['orden_trabajo_pdf']) if isinstance(validated_data['orden_trabajo_pdf'], (bytes, str)) else 'N/A'}")
            
            logger.info("Llamando a super().update()...")
            result = super().update(instance, validated_data)
            logger.info(f"Producto actualizado exitosamente: {result.id}")
            return result
        except ValidationError as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"ValidationError en ProductoUpdateSerializer: {e}")
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else str(e))
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error inesperado en ProductoUpdateSerializer: {e}", exc_info=True)
            raise

class ProductoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar productos"""
    precio_formateado = serializers.SerializerMethodField()
    tiene_pdf = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'precio', 'precio_formateado', 'stock', 
            'numero_ot', 'tiene_pdf', 'fecha_creacion', 'activo'
        ]
    
    def get_precio_formateado(self, obj):
        return obj.get_precio_formateado()
    
    def get_tiene_pdf(self, obj):
        return obj.tiene_pdf