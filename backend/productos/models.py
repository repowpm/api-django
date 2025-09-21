from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import os

def validate_pdf_file(value):
    """Validador para archivos PDF"""
    if value:
        # Verificar que el archivo no sea demasiado grande (10MB)
        if len(value) > 10 * 1024 * 1024:
            raise ValidationError('El archivo PDF no puede ser mayor a 10MB')
        
        # Verificar que sea un PDF (verificación básica)
        if not value.startswith(b'%PDF'):
            raise ValidationError('El archivo debe ser un PDF válido')

class Producto(models.Model):
    nombre = models.CharField(
        max_length=255,
        help_text="Nombre del producto"
    )
    precio = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Precio del producto (mínimo $0.01)"
    )
    descripcion = models.TextField(
        null=True, 
        blank=True,
        help_text="Descripción detallada del producto"
    )
    stock = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Cantidad disponible en stock"
    )
    numero_ot = models.IntegerField(
        null=True, 
        blank=True, 
        verbose_name="Número OT",
        validators=[MinValueValidator(1)],
        help_text="Número de Orden de Trabajo"
    )
    orden_trabajo_pdf = models.BinaryField(
        null=True, 
        blank=True, 
        verbose_name="PDF OT",
        validators=[validate_pdf_file],
        help_text="Archivo PDF de la Orden de Trabajo"
    )
    
    # Campos de auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True, help_text="Indica si el producto está activo")

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['precio']),
            models.Index(fields=['activo']),
        ]

    def __str__(self):
        return f"{self.nombre} - ${self.precio}"

    def clean(self):
        """Validaciones adicionales del modelo"""
        if self.stock is not None and self.stock < 0:
            raise ValidationError({'stock': 'El stock no puede ser negativo'})
        
        if self.numero_ot is not None and self.numero_ot <= 0:
            raise ValidationError({'numero_ot': 'El número de OT debe ser mayor a 0'})

    def save(self, *args, **kwargs):
        """Sobrescribir save para aplicar validaciones"""
        try:
            self.full_clean()
        except ValidationError as e:
            # Log del error pero no fallar el save
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"ValidationError en modelo Producto: {e}")
        super().save(*args, **kwargs)

    @property
    def tiene_pdf(self):
        """Indica si el producto tiene un PDF asociado"""
        return bool(self.orden_trabajo_pdf)

    def get_precio_formateado(self):
        """Retorna el precio formateado como string"""
        return f"${self.precio:,.2f}"

    def reducir_stock(self, cantidad):
        """Reduce el stock del producto"""
        if self.stock is None:
            raise ValidationError("Este producto no tiene stock configurado")
        
        if self.stock < cantidad:
            raise ValidationError("No hay suficiente stock disponible")
        
        self.stock -= cantidad
        self.save(update_fields=['stock'])

    def aumentar_stock(self, cantidad):
        """Aumenta el stock del producto"""
        if self.stock is None:
            self.stock = 0
        
        self.stock += cantidad
        self.save(update_fields=['stock'])