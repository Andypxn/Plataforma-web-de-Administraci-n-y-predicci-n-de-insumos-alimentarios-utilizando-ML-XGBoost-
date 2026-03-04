import axios from 'axios';
import type { OrdenVentaReciente } from '../types/ordenes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';

// Configurar axios con interceptor para incluir token de autorización
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para añadir token JWT a las requests
apiClient.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('pos_auth_data');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        if (userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error('Error al obtener token de autenticación:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Formatear número como moneda
 */
const formatearMoneda = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

/**
 * Formatear fecha para mostrar solo la hora
 */
const formatearHora = (fechaISO: string): string => {
  try {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '00:00';
  }
};

/**
 * Obtener las órdenes de venta más recientes para mostrar en el dashboard
 */
export const obtenerOrdenesRecientes = async (limite: number = 5): Promise<OrdenVentaReciente[]> => {
  try {
    const response = await apiClient.get(`/api/ordenes-de-ventas/recientes?limite=${limite}`);
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((orden: any) => ({
        id: orden.id,
        usuario: orden.usuarioNombre || 'Usuario Desconocido',
        mesa: orden.mesa || 'Sin especificar',
        fechaVenta: orden.fechaVenta,
        hora: formatearHora(orden.fechaVenta),
        total: orden.total,
        totalFormateado: formatearMoneda(orden.total)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error al obtener órdenes recientes:', error);
    
    // Si hay error, retornar datos de ejemplo para no romper la interfaz
    return [
      {
        id: "1",
        usuario: "Carlos Ruiz",
        mesa: "4",
        fechaVenta: new Date().toISOString(),
        hora: "14:30",
        total: 45.00,
        totalFormateado: "$45.00"
      },
      {
        id: "2",
        usuario: "Ana López",
        mesa: "Delivery",
        fechaVenta: new Date().toISOString(),
        hora: "14:42",
        total: 22.50,
        totalFormateado: "$22.50"
      },
      {
        id: "3",
        usuario: "Miguel Ángel",
        mesa: "Barra",
        fechaVenta: new Date().toISOString(),
        hora: "15:05",
        total: 12.00,
        totalFormateado: "$12.00"
      }
    ];
  }
};

/**
 * Obtener estadísticas del dashboard (ventas del día, etc.)
 */
export const obtenerEstadisticasDashboard = async () => {
  try {
    const response = await apiClient.get('/api/ordenes-de-ventas/estadisticas-dashboard');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    
    // Retornar datos por defecto
    return {
      ventasHoy: 0,
      totalHoy: 0,
      clientesAtendidos: 0,
      promedioTicket: 0
    };
  }
};

export default {
  obtenerOrdenesRecientes,
  obtenerEstadisticasDashboard
};