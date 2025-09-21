import axios from 'axios';
import toast from 'react-hot-toast';

// Configuración base de la API
const API_BASE_URL = 'https://api-django-uwx1.onrender.com/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor. Inténtalo más tarde.');
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else {
      toast.error('Error de conexión. Verifica tu conexión a internet.');
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  async login(username, password) {
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refresh', refresh);
      
      // Obtener información del usuario
      const userResponse = await api.get('/auth/profile/');
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      return { success: true, data: userResponse.data };
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    }
  },

  async refreshToken() {
    try {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) throw new Error('No refresh token');
      
      const response = await api.post('/auth/refresh/', { refresh });
      const { access } = response.data;
      
      localStorage.setItem('token', access);
      return access;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      throw error;
    }
  }
};

// Servicios de productos
export const productService = {
  async getProducts(params = {}) {
    try {
      const response = await api.get('/productos/', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getProduct(id) {
    try {
      const response = await api.get(`/productos/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createProduct(productData) {
    try {
      const response = await api.post('/productos/', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateProduct(id, productData) {
    try {
      const response = await api.put(`/productos/${id}/`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      await api.delete(`/productos/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  async downloadPDF(id) {
    try {
      const response = await api.get(`/productos/${id}/descargar-ot/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async reduceStock(id, cantidad) {
    try {
      const response = await api.post(`/productos/${id}/reducir-stock/`, { cantidad });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async increaseStock(id, cantidad) {
    try {
      const response = await api.post(`/productos/${id}/aumentar-stock/`, { cantidad });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getStatistics() {
    try {
      const response = await api.get('/productos/estadisticas/');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;
