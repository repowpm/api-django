import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../services/api';
import ProductCard from './ProductCard';
import ExportButtons from './ExportButtons';
import EditProductModal from './EditProductModal';
import toast from 'react-hot-toast';

const ProductList = ({ onProductEdit, refreshTrigger, onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    con_stock: false,
    con_pdf: false
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Máximo 8 productos por página para no superar la altura del formulario
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

  // Función para agregar un producto directamente al estado (sin recargar)
  const addProductToState = (newProduct) => {
    // Validar que newProduct existe y tiene id
    if (!newProduct || !newProduct.id) {
      console.error('addProductToState: newProduct inválido:', newProduct);
      return;
    }
    
    setProducts(prevProducts => {
      // Verificar si el producto ya existe (por ID)
      const exists = prevProducts.some(product => product.id === newProduct.id);
      if (exists) {
        return prevProducts; // No agregar si ya existe
      }
      
      // Agregar el nuevo producto al inicio de la lista
      return [newProduct, ...prevProducts];
    });
  };

  // Función para actualizar un producto en el estado
  const updateProductInState = (updatedProduct) => {
    // Validar que updatedProduct existe y tiene id
    if (!updatedProduct || !updatedProduct.id) {
      console.error('updateProductInState: updatedProduct inválido:', updatedProduct);
      return;
    }
    
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };

  // Función para eliminar un producto del estado
  const removeProductFromState = (productId) => {
    setProducts(prevProducts => 
      prevProducts.filter(product => product.id !== productId)
    );
  };

  useEffect(() => {
    loadProducts();
    setCurrentPage(1); // Resetear a la primera página cuando cambie la búsqueda
  }, [searchTerm, filters, refreshTrigger]);

  // Exponer las funciones para que puedan ser llamadas desde el componente padre
  useEffect(() => {
    if (onProductAdded) {
      onProductAdded({
        addProduct: addProductToState,
        updateProduct: updateProductInState,
        removeProduct: removeProductFromState
      });
    }
  }, [onProductAdded]);

  const handleDelete = async (id) => {
    // Mostrar toast de confirmación personalizado
    const confirmDelete = () => {
      toast((t) => (
        <div className="flex flex-col space-y-2">
          <span className="text-white">¿Estás seguro de que quieres eliminar este producto?</span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                executeDelete(id);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Eliminar
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      ), {
        duration: 10000, // 10 segundos para dar tiempo a decidir
        id: `delete-confirm-${id}` // ID único para evitar duplicados
      });
    };

    const executeDelete = async (id) => {
      try {
        await productService.deleteProduct(id);
        toast.success('Producto eliminado exitosamente');
        removeProductFromState(id);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        toast.error('Error al eliminar el producto');
      }
    };

    confirmDelete();
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

  const handleProductUpdated = (updatedProduct) => {
    updateProductInState(updatedProduct);
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

  // Lógica de paginación
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
            {searchTerm 
              ? 'No se encontraron productos con el término de búsqueda.'
              : 'Comienza agregando un nuevo producto.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Botones de exportación */}
          <ExportButtons products={products} tableRef={tableRef} />
          
          {/* Tabla de productos */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="overflow-hidden max-h-96 overflow-y-auto">
              <table ref={tableRef} className="w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      PDF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-white truncate max-w-[200px]">{product.nombre}</div>
                          {product.descripcion && (
                            <div className="text-sm text-gray-400 truncate max-w-[200px]">
                              {product.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-blue-400 font-medium">
                        ${Math.round(product.precio)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-medium ${
                          product.stock > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {product.stock !== null ? product.stock : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300">
                        {product.numero_ot || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm ${
                          product.tiene_pdf ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {product.tiene_pdf ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300">
                        {formatDate(product.fecha_creacion)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900 rounded transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {product.tiene_pdf && (
                            <button
                              onClick={() => handleDownloadPDF(product)}
                              className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900 rounded transition-colors"
                              title="Descargar PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, products.length)} de {products.length} productos
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
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
