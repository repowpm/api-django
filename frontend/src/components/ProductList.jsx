import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import ProductCard from './ProductCard';
import toast from 'react-hot-toast';

const ProductList = ({ onProductEdit, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    con_stock: false,
    con_pdf: false
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        nombre: searchTerm || undefined,
        ...filters
      };
      
      const data = await productService.getProducts(params);
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
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

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.con_stock}
                onChange={(e) => setFilters({...filters, con_stock: e.target.checked})}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Con stock</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.con_pdf}
                onChange={(e) => setFilters({...filters, con_pdf: e.target.checked})}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Con PDF</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filters.con_stock || filters.con_pdf 
              ? 'No se encontraron productos con los filtros aplicados.'
              : 'Comienza agregando un nuevo producto.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={onProductEdit}
              onDelete={handleDelete}
              onDownloadPDF={handleDownloadPDF}
              onStockChange={handleStockChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
