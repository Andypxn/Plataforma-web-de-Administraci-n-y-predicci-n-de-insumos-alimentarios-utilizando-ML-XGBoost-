import axios from 'axios';
import type { 
  Proveedor, 
  CompraRequest, 
  PagoRequest, 
  DeudaProveedor,
  ProductoCompra,
  OrdenCompra
} from '../types/index';

// Obtener la URL del backend dinámicamente en el cliente
const getBackendUrl = () => {
  // En desarrollo con Docker, usar variable de entorno o localhost
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En producción real
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    return 'https://pos-finanzas-q2ddz.ondigitalocean.app';
  }
  
  // Fallback para desarrollo local
  return 'http://localhost:8080';
};

const backendUrl = getBackendUrl();

// Configuración base de axios
const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT a todas las peticiones
api.interceptors.request.use(config => {
  // Buscar token en el nuevo sistema de autenticación primero
  const authData = localStorage.getItem('pos_auth_data');
  if (authData) {
    try {
      const userData = JSON.parse(authData);
      if (userData.token) {
        config.headers.Authorization = `Bearer ${userData.token}`;
        return config;
      }
    } catch (error) {
      console.warn('Error parsing auth data:', error);
    }
  }
  
  // Fallback al sistema legacy
  const legacyToken = localStorage.getItem('authToken');
  if (legacyToken) {
    config.headers.Authorization = `Bearer ${legacyToken}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor para manejar respuestas de error (token expirado, etc.)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - limpiar todos los datos de autenticación
      localStorage.removeItem('authToken'); // Legacy
      localStorage.removeItem('pos_auth_data'); // Nuevo sistema
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios para compras y proveedores
export const comprasService = {
  // ========== GESTIÓN DE PROVEEDORES ==========
  
  async obtenerProveedores(): Promise<Proveedor[]> {
    try {
      const response = await api.get('/proveedores');
      console.log('✅ Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obtenerProveedores:', error);
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('URL:', error.config?.url);
      }
      throw error;
    }
  },

  async obtenerProveedorPorId(id: string): Promise<Proveedor> {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  },

  async obtenerDeudasProveedores(): Promise<DeudaProveedor[]> {
    try {
      // Usar el endpoint específico de deudas-proveedores
      const response = await api.get('/deudas-proveedores');
      return response.data;
    } catch (error) {
      console.error('❌ Error obtenerDeudasProveedores:', error);
      // Fallback: usar obtenerProveedores y mapear al formato de DeudaProveedor
      const proveedores = await this.obtenerProveedores();
      return proveedores.map(p => ({
        proveedorId: p.id,
        proveedorNombre: p.nombre,
        telefonoProveedor: p.telefono,
        emailProveedor: p.email,
        totalCompras: p.deudaTotal || 0,
        totalPagos: 0,
        deudaPendiente: p.deudaTotal || 0,
        estadoDeuda: (p.deudaTotal || 0) > 1000 ? 'amarillo' : 'verde' as 'verde' | 'amarillo',
        fechaOrdenMasAntigua: new Date().toISOString(),
        cantidadOrdenesPendientes: 0
      }));
    }
  },

  async obtenerDeudaProveedor(proveedorId: string): Promise<DeudaProveedor> {
    const response = await api.get(`/proveedores/${proveedorId}/deuda`);
    return response.data;
  },

  // ========== GESTIÓN DE COMPRAS ==========

  async crearCompra(compraRequest: CompraRequest): Promise<OrdenCompra> {
    const response = await api.post('/ordenes-compras', compraRequest);
    return response.data;
  },

  async obtenerComprasPorProveedor(proveedorId: string): Promise<OrdenCompra[]> {
    // Endpoint no implementado en el backend, retornar array vacío por ahora
    console.log(`Obteniendo compras para proveedor: ${proveedorId}`);
    return [];
  },

  async obtenerTodasLasCompras(): Promise<OrdenCompra[]> {
    // Endpoint no implementado en el backend, retornar array vacío por ahora
    return [];
  },

  // ========== GESTIÓN DE PAGOS ==========

  async registrarPago(pagoRequest: PagoRequest): Promise<{ mensaje: string; nuevaDeuda: number }> {
    const response = await api.post(`/proveedores/${pagoRequest.proveedorId}/pago`, pagoRequest);
    return {
      mensaje: 'Pago registrado exitosamente',
      nuevaDeuda: response.data.montoPendiente || 0
    };
  },

  // ========== UTILIDADES ==========

  async obtenerUltimoPrecioCompra(productoId: string): Promise<{ costo: number } | null> {
    try {
      const response = await api.get(`/historial-costos/producto/${productoId}/ultimo-costo`);
      return {
        costo: parseFloat(response.data.costo) || 0
      };
    } catch {
      console.log(`No se encontró historial de costos para producto ${productoId}`);
      return null;
    }
  },

  async obtenerProductosParaCompra(): Promise<ProductoCompra[]> {
    const response = await api.get('/productos');
    return response.data;
  },

  async obtenerProductosPorProveedor(proveedorId: string): Promise<ProductoCompra[]> {
    const response = await api.get(`/productos/proveedor/${proveedorId}`);
    return response.data;
  },

  // Función helper para calcular el total de una compra
  calcularTotalCompra(productos: { cantidadKg: number; cantidadPz: number; costoUnitarioKg: number; costoUnitarioPz: number }[]): number {
    return productos.reduce((total, producto) => {
      const subtotalKg = producto.cantidadKg * producto.costoUnitarioKg;
      const subtotalPz = producto.cantidadPz * producto.costoUnitarioPz;
      return total + subtotalKg + subtotalPz;
    }, 0);
  },

  // Función helper para validar datos de compra
  validarCompra(compra: CompraRequest): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!compra.proveedorId) {
      errores.push('Debe seleccionar un proveedor');
    }

    if (!compra.productos || compra.productos.length === 0) {
      errores.push('Debe agregar al menos un producto al carrito');
    }

    // Validar cada producto en la lista
    compra.productos?.forEach((producto, index) => {
      if (!producto.productoId) {
        errores.push(`Producto ${index + 1}: ID de producto requerido`);
      }

      if (producto.cantidadKg < 0 || producto.cantidadPz < 0) {
        errores.push(`Producto ${index + 1}: Las cantidades no pueden ser negativas`);
      }

      if (producto.cantidadKg === 0 && producto.cantidadPz === 0) {
        errores.push(`Producto ${index + 1}: Debe especificar al menos una cantidad (Kg o Pz)`);
      }
    });

    return {
      valida: errores.length === 0,
      errores
    };
  },

  // Función helper para validar datos de pago
  validarPago(pago: PagoRequest): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!pago.proveedorId) {
      errores.push('Debe seleccionar un proveedor');
    }

    if (!pago.ordenCompraId) {
      errores.push('ID de orden de compra requerido');
    }

    if (!pago.metodoPagoId) {
      errores.push('Debe seleccionar un método de pago');
    }

    if (pago.montoPagado <= 0) {
      errores.push('El monto del pago debe ser mayor a cero');
    }

    return {
      valida: errores.length === 0,
      errores
    };
  }
};

export default comprasService;