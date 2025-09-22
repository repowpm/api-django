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
        precio: editingProduct.precio ? Math.round(editingProduct.precio) : '',
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
      // Asegurar que el precio se envíe como número
      productData.append('precio', parseFloat(formData.precio));
      if (formData.descripcion) productData.append('descripcion', formData.descripcion);
      if (formData.stock) productData.append('stock', parseInt(formData.stock));
      if (formData.numero_ot) productData.append('numero_ot', parseInt(formData.numero_ot));
      if (formData.orden_trabajo_pdf) productData.append('orden_trabajo_pdf', formData.orden_trabajo_pdf);

      console.log('Enviando datos:', {
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        descripcion: formData.descripcion,
        stock: formData.stock ? parseInt(formData.stock) : null,
        numero_ot: formData.numero_ot ? parseInt(formData.numero_ot) : null
      });

      if (editingProduct) {
        const updatedProduct = await productService.updateProduct(editingProduct.id, productData);
        toast.success('Producto actualizado exitosamente');
        onProductUpdated(updatedProduct);
      } else {
        const newProduct = await productService.createProduct(productData);
        toast.success('Producto creado exitosamente');
        onProductAdded(newProduct);
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
      
      // Manejo específico de errores
      if (error.response?.status === 400) {
        const details = error.response.data?.details;
        
        // Verificar si es un error de nombre duplicado
        if (typeof details === 'string' && details.includes('Ya existe un producto con este nombre')) {
          // Sugerir un nombre alternativo
          const nombreActual = formData.nombre;
          const nombreSugerido = `${nombreActual} (${new Date().getTime().toString().slice(-4)})`;
          toast.error(`Ya existe un producto con este nombre. Sugerencia: "${nombreSugerido}"`, {
            duration: 5000,
            action: {
              label: 'Usar sugerencia',
              onClick: () => {
                setFormData(prev => ({ ...prev, nombre: nombreSugerido }));
              }
            }
          });
        } else if (details?.nombre && details.nombre.includes('Ya existe un producto con este nombre')) {
          // Manejo para formato de objeto
          const nombreActual = formData.nombre;
          const nombreSugerido = `${nombreActual} (${new Date().getTime().toString().slice(-4)})`;
          toast.error(`Ya existe un producto con este nombre. Sugerencia: "${nombreSugerido}"`, {
            duration: 5000,
            action: {
              label: 'Usar sugerencia',
              onClick: () => {
                setFormData(prev => ({ ...prev, nombre: nombreSugerido }));
              }
            }
          });
        } else if (details) {
          // Mostrar errores específicos de validación
          const errorMessages = Object.entries(details).map(([field, errors]) => {
            if (field === 'nombre' && Array.isArray(errors) && errors.includes('Ya existe un producto con este nombre')) {
              return 'Ya existe un producto con este nombre';
            }
            return `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
          }).join('; ');
          toast.error(`Error de validación: ${errorMessages}`);
        } else {
          toast.error('Error al guardar el producto. Verifica los datos ingresados.');
        }
      } else {
        toast.error('Error al guardar el producto. Inténtalo más tarde.');
      }
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
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white">
          {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
        </h2>
        {editingProduct && (
          <button
            onClick={handleCancel}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-3">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-300">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
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
            <label htmlFor="precio" className="block text-sm font-medium text-gray-300">
              Precio *
            </label>
            <input
              type="number"
              id="precio"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-300">
              Stock
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              min="0"
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 mt-1"
              value={formData.stock}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Stock"
            />
          </div>

          <div>
            <label htmlFor="numero_ot" className="block text-sm font-medium text-gray-300">
              Número Factura
            </label>
            <input
              type="number"
              id="numero_ot"
              name="numero_ot"
              min="1"
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 mt-1"
              value={formData.numero_ot}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Factura"
            />
          </div>
        </div>

        <div>
          <label htmlFor="orden_trabajo_pdf" className="block text-sm font-medium text-gray-300">
            PDF Factura
          </label>
          <input
            type="file"
            id="orden_trabajo_pdf"
            name="orden_trabajo_pdf"
            accept=".pdf"
            className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-400">
            Solo archivos PDF, máximo 10MB
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          {editingProduct && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm"
              disabled={isLoading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 text-sm"
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
