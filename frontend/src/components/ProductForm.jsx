import React, { useState } from 'react';
import { productService } from '../services/api';
import toast from 'react-hot-toast';

const ProductForm = ({ onProductAdded, onProductUpdated, editingProduct, setEditingProduct }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    stock: '',
    numero_ot: '',
    orden_trabajo_pdf: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos del producto si está en modo edición
  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        nombre: editingProduct.nombre || '',
        precio: editingProduct.precio || '',
        descripcion: editingProduct.descripcion || '',
        stock: editingProduct.stock || '',
        numero_ot: editingProduct.numero_ot || '',
        orden_trabajo_pdf: null
      });
    } else {
      setFormData({
        nombre: '',
        precio: '',
        descripcion: '',
        stock: '',
        numero_ot: '',
        orden_trabajo_pdf: null
      });
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea un PDF
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }
      setFormData({
        ...formData,
        orden_trabajo_pdf: file
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio) {
      toast.error('Nombre y precio son obligatorios');
      return;
    }

    setIsLoading(true);

    try {
      const productData = new FormData();
      productData.append('nombre', formData.nombre);
      productData.append('precio', formData.precio);
      if (formData.descripcion) productData.append('descripcion', formData.descripcion);
      if (formData.stock) productData.append('stock', formData.stock);
      if (formData.numero_ot) productData.append('numero_ot', formData.numero_ot);
      if (formData.orden_trabajo_pdf) productData.append('orden_trabajo_pdf', formData.orden_trabajo_pdf);

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
        toast.success('Producto actualizado exitosamente');
        onProductUpdated();
      } else {
        await productService.createProduct(productData);
        toast.success('Producto creado exitosamente');
        onProductAdded();
      }

      // Limpiar formulario
      setFormData({
        nombre: '',
        precio: '',
        descripcion: '',
        stock: '',
        numero_ot: '',
        orden_trabajo_pdf: null
      });
      setEditingProduct(null);
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
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
    setEditingProduct(null);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
        </h2>
        {editingProduct && (
          <button
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              required
              className="input-field mt-1"
              value={formData.nombre}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
              Precio *
            </label>
            <input
              type="number"
              id="precio"
              name="precio"
              step="0.01"
              min="0.01"
              required
              className="input-field mt-1"
              value={formData.precio}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            className="input-field mt-1"
            value={formData.descripcion}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
              Stock
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              min="0"
              className="input-field mt-1"
              value={formData.stock}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="numero_ot" className="block text-sm font-medium text-gray-700">
              Número OT
            </label>
            <input
              type="number"
              id="numero_ot"
              name="numero_ot"
              min="1"
              className="input-field mt-1"
              value={formData.numero_ot}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="orden_trabajo_pdf" className="block text-sm font-medium text-gray-700">
            PDF Orden de Trabajo
          </label>
          <input
            type="file"
            id="orden_trabajo_pdf"
            name="orden_trabajo_pdf"
            accept=".pdf"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Solo archivos PDF, máximo 10MB
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {editingProduct && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : (editingProduct ? 'Actualizar' : 'Agregar')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
