import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import { productService } from './services/api';
import toast from 'react-hot-toast';

// Componente para la vista principal (dashboard)
const Dashboard = () => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [productListFunctions, setProductListFunctions] = useState(null);

  const handleProductAdded = (newProduct) => {
    // Si tenemos las funciones del ProductList, usarlas para agregar directamente
    if (productListFunctions?.addProduct) {
      productListFunctions.addProduct(newProduct);
    } else {
      // Fallback: recargar la lista
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleProductUpdated = (updatedProduct) => {
    // Si tenemos las funciones del ProductList, usarlas para actualizar directamente
    if (productListFunctions?.updateProduct) {
      productListFunctions.updateProduct(updatedProduct);
    } else {
      // Fallback: recargar la lista
      setRefreshTrigger(prev => prev + 1);
    }
    setEditingProduct(null);
  };

  const handleProductEdit = (product) => {
    setEditingProduct(product);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de productos - Lado izquierdo (más pequeño) */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit">
            <ProductForm
              onProductAdded={handleProductAdded}
              onProductUpdated={handleProductUpdated}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
            />
          </div>

          {/* Lista de productos - Lado derecho (más espacio) */}
          <div className="lg:col-span-2">
            <ProductList
              onProductEdit={handleProductEdit}
              refreshTrigger={refreshTrigger}
              onProductAdded={setProductListFunctions}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente principal de la aplicación
const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

// Componente raíz con providers
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;