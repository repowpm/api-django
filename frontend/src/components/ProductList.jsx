import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../services/api';
import ProductCard from './ProductCard';
import ExportButtons from './ExportButtons';
import EditProductModal from './EditProductModal';
import toast from 'react-hot-toast';

const ProductList = ({ onProductEdit, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    con_stock: false,
    con_pdf: false
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const tableRef = useRef(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Cargando productos...');
      console.log('Token en localStorage:', localStorage.getItem('token'));
      
      const params = {
        nombre: searchTerm || undefined,
        ...filters
      };
      
      const data = await productService.getProducts(params);
      console.log('Productos cargados:', data);
      console.log('Tipo de datos:', typeof data);
      console.log('Es array:', Array.isArray(data));
      
      // Verificar si es un array o un objeto con resultados
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && data.results) {
        setProducts(data.results);
      } else if (data && data.data) {
        setProducts(data.data);
      } else {
        console.warn('Formato de datos inesperado:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, filters, refreshTrigger]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productService.deleteProduct(id);
        toast.success('Producto eliminado exitosamente');
        loadProducts();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  const handleDownloadPDF = async (product) => {
    try {
      const blob = await productService.downloadPDF(product.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orden_trabajo_${product.id}_${product.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  };

  const handleStockChange = async (product, cantidad, action) => {
    try {
      if (action === 'reduce') {
        await productService.reduceStock(product.id, cantidad);
        toast.success(`Stock reducido en ${cantidad} unidades`);
      } else {
        await productService.increaseStock(product.id, cantidad);
        toast.success(`Stock aumentado en ${cantidad} unidades`);
      }
      loadProducts();
    } catch (error) {
      console.error('Error al modificar stock:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleProductUpdated = () => {
    loadProducts();
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.con_stock}
                  onChange={(e) => setFilters({...filters, con_stock: e.target.checked})}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-300">Con stock</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.con_pdf}
                  onChange={(e) => setFilters({...filters, con_pdf: e.target.checked})}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-300">Con PDF</span>
              </label>
            </div>
            
            {/* Botones de cambio de vista */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No hay productos</h3>
          <p className="mt-1 text-sm text-gray-400">
            {searchTerm || filters.con_stock || filters.con_pdf 
              ? 'No se encontraron productos con los filtros aplicados.'
              : 'Comienza agregando un nuevo producto.'
            }
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="space-y-4">
          {/* Botones de exportación */}
          <ExportButtons products={products} tableRef={tableRef} />
          
          {/* Tabla de productos */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table ref={tableRef} className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      OT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      PDF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{product.nombre}</div>
                          {product.descripcion && (
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {product.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-medium">
                        {product.precio_formateado || formatPrice(product.precio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          product.stock > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {product.stock !== null ? product.stock : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {product.numero_ot || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          product.tiene_pdf ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {product.tiene_pdf ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(product.fecha_creacion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Editar
                          </button>
                          {product.tiene_pdf && (
                            <button
                              onClick={() => handleDownloadPDF(product)}
                              className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              PDF
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDownloadPDF={handleDownloadPDF}
              onStockChange={handleStockChange}
            />
          ))}
        </div>
      )}

      {/* Modal de edición */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        product={editingProduct}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
};

export default ProductList;
