import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import toast from 'react-hot-toast';

const EditProductModal = ({ isOpen, onClose, product, onProductUpdated }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    stock: '',
    numero_ot: '',
    orden_trabajo_pdf: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        nombre: product.nombre || '',
        precio: product.precio ? Math.round(product.precio) : '',
        descripcion: product.descripcion || '',
        stock: product.stock || '',
        numero_ot: product.numero_ot || '',
        orden_trabajo_pdf: null
      });
    }
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        orden_trabajo_pdf: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio) {
      toast.error('Los campos Nombre y Precio son obligatorios');
      return;
    }

    setIsLoading(true);
    
    try {
      const productData = new FormData();
      productData.append('nombre', formData.nombre);
      // Asegurar que el precio se envíe como número
      productData.append('precio', parseFloat(formData.precio));
      if (formData.descripcion) productData.append('descripcion', formData.descripcion);
      if (formData.stock) productData.append('stock', parseInt(formData.stock));
      if (formData.numero_ot) productData.append('numero_ot', parseInt(formData.numero_ot));
      
      // Solo enviar PDF si se ha seleccionado un nuevo archivo
      if (formData.orden_trabajo_pdf) {
        productData.append('orden_trabajo_pdf', formData.orden_trabajo_pdf);
      }

      console.log('Enviando datos de actualización:', {
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        descripcion: formData.descripcion,
        stock: formData.stock ? parseInt(formData.stock) : null,
        numero_ot: formData.numero_ot ? parseInt(formData.numero_ot) : null,
        tiene_nuevo_pdf: !!formData.orden_trabajo_pdf
      });

      const updatedProduct = await productService.updateProduct(product.id, productData);
      toast.success('Producto actualizado exitosamente');
      onProductUpdated(updatedProduct);
      onClose();
      
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error('Error al actualizar producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: '',
      precio: '',
      descripcion: '',
      stock: '',
      numero_ot: '',
      orden_trabajo_pdf: null
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Editar Producto
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_nombre" className="block text-sm font-medium text-gray-300">
                Nombre *
              </label>
              <input
                type="text"
                id="edit_nombre"
                name="nombre"
                required
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 mt-1"
                value={formData.nombre}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Ingrese el nombre del producto"
              />
            </div>

            <div>
              <label htmlFor="edit_precio" className="block text-sm font-medium text-gray-300">
                Precio *
              </label>
            <input
              type="number"
              id="edit_precio"
              name="precio"
              step="1"
              min="1"
              required
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 mt-1"
              value={formData.precio}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="0"
            />
            </div>
          </div>

          <div>
            <label htmlFor="edit_descripcion" className="block text-sm font-medium text-gray-300">
              Descripción
            </label>
            <textarea
              id="edit_descripcion"
              name="descripcion"
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 mt-1"
              value={formData.descripcion}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Descripción del producto (opcional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_stock" className="block text-sm font-medium text-gray-300">
                Stock
              </label>
              <input
                type="number"
                id="edit_stock"
                name="stock"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 mt-1"
                value={formData.stock}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Cantidad en stock"
              />
            </div>

            <div>
              <label htmlFor="edit_numero_ot" className="block text-sm font-medium text-gray-300">
                Número Factura
              </label>
              <input
                type="number"
                id="edit_numero_ot"
                name="numero_ot"
                min="1"
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 mt-1"
                value={formData.numero_ot}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Número de orden de trabajo"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit_orden_trabajo_pdf" className="block text-sm font-medium text-gray-300">
              PDF Orden de Trabajo
            </label>
            {product && product.tiene_pdf && (
              <div className="mb-2 p-2 bg-green-900 border border-green-700 rounded-md">
                <p className="text-sm text-green-300">
                  ✓ Este producto ya tiene un PDF cargado
                </p>
              </div>
            )}
            <input
              type="file"
              id="edit_orden_trabajo_pdf"
              name="orden_trabajo_pdf"
              accept=".pdf"
              className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-400">
              {product && product.tiene_pdf 
                ? 'Selecciona un nuevo archivo para reemplazar el PDF actual, o deja vacío para mantener el existente'
                : 'Solo archivos PDF, máximo 10MB'
              }
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
