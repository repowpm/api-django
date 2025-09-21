import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onEdit, onDelete, onDownloadPDF, onStockChange }) => {
  const [stockAmount, setStockAmount] = useState(1);
  const [showStockControls, setShowStockControls] = useState(false);

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

  const handleStockAction = (action) => {
    if (stockAmount <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    onStockChange(product, stockAmount, action);
    setStockAmount(1);
    setShowStockControls(false);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">
              {product.nombre}
            </h3>
            <span className="text-lg font-bold text-blue-400">
              ${Math.round(product.precio)}
            </span>
          </div>

          {product.descripcion && (
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {product.descripcion}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
            <div>
              <span className="font-medium">Stock:</span>
              <span className={`ml-1 ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {product.stock !== null ? product.stock : 'N/A'}
              </span>
            </div>
            {product.numero_ot && (
              <div>
                <span className="font-medium">OT:</span>
                <span className="ml-1">{product.numero_ot}</span>
              </div>
            )}
            <div>
              <span className="font-medium">PDF:</span>
              <span className={`ml-1 ${product.tiene_pdf ? 'text-green-400' : 'text-gray-500'}`}>
                {product.tiene_pdf ? 'Disponible' : 'No disponible'}
              </span>
            </div>
            <div>
              <span className="font-medium">Creado:</span>
              <span className="ml-1">{formatDate(product.fecha_creacion)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de stock */}
      {showStockControls && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              value={stockAmount}
              onChange={(e) => setStockAmount(parseInt(e.target.value) || 1)}
              className="w-20 px-2 py-1 bg-gray-600 text-white border border-gray-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleStockAction('reduce')}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Reducir
            </button>
            <button
              onClick={() => handleStockAction('increase')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Aumentar
            </button>
            <button
              onClick={() => setShowStockControls(false)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(product)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Editar
        </button>

        {product.tiene_pdf && (
          <button
            onClick={() => onDownloadPDF(product)}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
          >
            Descargar PDF
          </button>
        )}

        {product.stock !== null && (
          <button
            onClick={() => setShowStockControls(!showStockControls)}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
          >
            {showStockControls ? 'Ocultar Stock' : 'Modificar Stock'}
          </button>
        )}

        <button
          onClick={() => onDelete(product.id)}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
