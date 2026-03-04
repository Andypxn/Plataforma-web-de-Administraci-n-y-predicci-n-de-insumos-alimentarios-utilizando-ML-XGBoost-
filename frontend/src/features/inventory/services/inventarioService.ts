import axios from 'axios';

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
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
      // Token expirado o inválido
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interfaces TypeScript basadas en el DTO del backend
export interface InventarioDTO {
  id: string;
  cantidadPz?: number;
  cantidadKg?: number;
  cantidadMinima: number;
  cantidadMaxima: number;
  productoId: string;
  productoNombre: string;
  ubicacionId: string;
  ubicacionNombre: string;
}

// Interface para crear/actualizar inventario (formato que espera el backend)
export interface CreateInventarioRequest {
  cantidadPz?: number;
  cantidadKg?: number;
  cantidadMinima: number;
  cantidadMaxima: number;
  producto: {
    id: string;
  };
  ubicacion: {
    id: string;
  };
}

// Interfaces para los datos de los dropdowns
export interface ProductoDTO {
  id: string;
  nombre: string;
  categoriasProductosId?: string;
  categoriasProductosCategoria?: string;
  proveedorId?: string;
  proveedorNombre?: string;
  proveedorApellidoPaterno?: string;
  proveedorApellidoMaterno?: string;
  estadosId?: string;
  estadosEstado?: string;
  precioVentaActual?: number;
  precioCompraActual?: number;
  cantidadInventario?: number;
}

export interface UbicacionDTO {
  id: string;
  nombre: string;
  ubicacion: string;
  descripcion?: string;
}

export interface CategoriaDTO {
  id: string;
  categoria: string;
}

export interface ProveedorDTO {
  id: string;
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombreCompleto: string;
  rfc?: string;
  email?: string;
  telefono?: string;
}

export interface UsuarioDTO {
  id: string;
  nombreUsuario: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}

// Interface para crear un producto completo
export interface ProductoCreacionRequest {
  nombre: string;
  categoriasProductosId: string;
  proveedorId: string;
  precioVenta: number;
  precioCompra: number;
  unidadMedida: string; // "piezas" o "kilogramos"
  stockInicial: number;
  ubicacionId: string;
  stockMinimo: number;
  stockMaximo: number;
  usuarioId: string;
}

// ==================== INTERFACES PARA ÓRDENES WORKSPACE ====================

export interface OrdenesWorkspaceDTO {
  id: string;
  workspaceId: string;
  workspaceNombre: string;
  productoId: string;
  productoNombre: string;
  historialPrecioId: string;
  precio: number;
  cantidadPz: number;
  cantidadKg: number;
}

export interface AgregarProductoOrdenRequest {
  workspaceId: string;
  productoId: string;
  cantidadPz: number;
  cantidadKg: number;
}

// ==================== INTERFACES PARA ÓRDENES DE VENTAS ====================

export interface OrdenesDeVentasDTO {
  id: string;
  personaId?: string;
  personaNombre?: string;
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  metodoPagoId: string;
  metodoPagoNombre: string;
  total: number;
  detalles: DetallesOrdenesDeVentasDTO[];
}

export interface DetallesOrdenesDeVentasDTO {
  id: string;
  ordenVentaId: string;
  productoId: string;
  productoNombre: string;
  historialPrecioId: string;
  precio: number;
  cantidadKg: number;
  cantidadPz: number;
  subtotal: number;
}

// ==================== INTERFACES PARA MÉTODOS DE PAGO Y PERSONAS ====================

export interface MetodoPagoDTO {
  id: string;
  metodoPago: string;
  descripcion?: string;
}

export interface PersonaDTO {
  id: string;
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  email?: string;
}

// Servicios para inventarios
export const inventarioService = {
  // Obtener todos los inventarios
  getAllInventarios: async (): Promise<InventarioDTO[]> => {
    const response = await api.get<InventarioDTO[]>('/inventarios');
    return response.data;
  },

  // Obtener inventario por ID
  getInventarioById: async (id: string): Promise<InventarioDTO> => {
    const response = await api.get<InventarioDTO>(`/inventarios/${id}`);
    return response.data;
  },

  // Crear nuevo inventario
  createInventario: async (inventario: CreateInventarioRequest): Promise<InventarioDTO> => {
    const response = await api.post<InventarioDTO>('/inventarios', inventario);
    return response.data;
  },

  // Actualizar inventario
  updateInventario: async (id: string, inventario: CreateInventarioRequest): Promise<InventarioDTO> => {
    const response = await api.put<InventarioDTO>(`/inventarios/${id}`, inventario);
    return response.data;
  },

  // Eliminar inventario
  deleteInventario: async (id: string): Promise<void> => {
    await api.delete(`/inventarios/${id}`);
  },

  // Obtener productos para dropdown
  getAllProductos: async (): Promise<ProductoDTO[]> => {
    const startTime = performance.now();
    console.log(`LATENCY_TEST_START: getAllProductos`);
    const response = await api.get<ProductoDTO[]>('/productos');
    const endTime = performance.now();
    console.log(`LATENCY_TEST_END: getAllProductos took ${endTime - startTime} ms`);
    return response.data;
  },

  // Obtener ubicaciones para dropdown
  getAllUbicaciones: async (): Promise<UbicacionDTO[]> => {
    const response = await api.get<UbicacionDTO[]>('/ubicaciones');
    return response.data;
  },

  // Obtener categorías para dropdown
  getAllCategorias: async (): Promise<CategoriaDTO[]> => {
    const response = await api.get<CategoriaDTO[]>('/categorias-productos');
    return response.data;
  },

  // Obtener proveedores para dropdown (personas que son proveedores)
  getAllProveedores: async (): Promise<ProveedorDTO[]> => {
    // Cambiar para obtener solo proveedores activos por categoría
    const response = await api.get<ProveedorDTO[]>('/personas/categoria/50887317-1DD8-4DE4-AAC5-62A342AC7FD4/activos');
    return response.data;
  },

  // Obtener usuarios para dropdown
  getAllUsuarios: async (): Promise<UsuarioDTO[]> => {
    const response = await api.get<UsuarioDTO[]>('/usuarios');
    return response.data;
  },

  // Obtener el primer usuario disponible (solución temporal)
  getFirstAvailableUser: async (): Promise<string> => {
    const usuarios = await inventarioService.getAllUsuarios();
    if (usuarios.length === 0) {
      throw new Error('No hay usuarios disponibles en el sistema');
    }
    return usuarios[0].id;
  },

  // Crear producto completo con inventario inicial
  createProductoCompleto: async (producto: ProductoCreacionRequest): Promise<ProductoDTO> => {
    const startTime = performance.now();
    console.log(`LATENCY_TEST_START: createProductoCompleto`);
    const response = await api.post<ProductoDTO>('/productos/completo', producto);
    const endTime = performance.now();
    console.log(`LATENCY_TEST_END: createProductoCompleto took ${endTime - startTime} ms`);
    return response.data;
  },

  // Desactivar producto
  desactivarProducto: async (id: string): Promise<ProductoDTO> => {
    console.log('🌐 API Call: PATCH /productos/' + id + '/desactivar');
    console.log('🌐 Backend URL:', `${backendUrl}/api`);
    try {
      const response = await api.patch<ProductoDTO>(`/productos/${id}/desactivar`);
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  },

  // Actualizar producto
  updateProducto: async (id: string, producto: Partial<ProductoDTO>): Promise<ProductoDTO> => {
    const response = await api.put<ProductoDTO>(`/productos/${id}`, producto);
    return response.data;
  },

  // ==================== SERVICIOS PARA ÓRDENES WORKSPACE ====================
  
  // Obtener órdenes actuales de un workspace
  getOrdenesWorkspace: async (workspaceId: string): Promise<OrdenesWorkspaceDTO[]> => {
    const response = await api.get<OrdenesWorkspaceDTO[]>(`/workspaces/${workspaceId}/ordenes`);
    return response.data;
  },

  // Agregar o actualizar producto en órdenes workspace
  agregarProductoOrden: async (workspaceId: string, productoId: string, cantidadPz: number, cantidadKg: number = 0): Promise<OrdenesWorkspaceDTO> => {
    const response = await api.post<OrdenesWorkspaceDTO>('/ordenes-workspace/agregar-producto', {
      workspaceId,
      productoId,
      cantidadPz,
      cantidadKg
    });
    return response.data;
  },

  // Eliminar producto específico de órdenes workspace
  eliminarProductoOrden: async (ordenId: string): Promise<void> => {
    await api.delete(`/ordenes-workspace/${ordenId}`);
  },

  // Limpiar todas las órdenes de un workspace
  limpiarOrdenesWorkspace: async (workspaceId: string): Promise<void> => {
    await api.delete(`/workspaces/${workspaceId}/ordenes`);
  },

  // ==================== SERVICIOS PARA PRODUCTOS CON STOCK ====================
  
  // Obtener solo productos activos con stock > 0
  getProductosConStock: async (): Promise<ProductoDTO[]> => {
    const productos = await inventarioService.getAllProductos();
    return productos.filter(
      producto => producto.estadosEstado?.toLowerCase() === 'activo' &&
                 producto.cantidadInventario && 
                 producto.cantidadInventario > 0
    );
  },

  // Verificar disponibilidad de stock antes de agregar
  verificarStock: async (productoId: string, cantidadRequerida: number): Promise<boolean> => {
    const producto = await api.get<ProductoDTO>(`/productos/${productoId}`);
    const stockDisponible = producto.data.cantidadInventario || 0;
    return stockDisponible >= cantidadRequerida;
  },

  // ==================== SERVICIOS PARA FINALIZACIÓN DE VENTA ====================
  
  // Procesar venta completa desde workspace
  procesarVentaDesdeWorkspace: async (workspaceId: string, metodoPagoId: string, personaId?: string): Promise<OrdenesDeVentasDTO> => {
    const startTime = performance.now();
    console.log(`LATENCY_TEST_START: procesarVentaDesdeWorkspace`);
    const response = await api.post<OrdenesDeVentasDTO>(`/workspaces/${workspaceId}/finalizar-venta`, {
      metodoPagoId,
      personaId
    });
    const endTime = performance.now();
    console.log(`LATENCY_TEST_END: procesarVentaDesdeWorkspace took ${endTime - startTime} ms`);
    return response.data;
  },

  // Obtener métodos de pago disponibles
  getMetodosPago: async (): Promise<MetodoPagoDTO[]> => {
    const response = await api.get<MetodoPagoDTO[]>('/metodos_pago');
    return response.data;
  },

  // Obtener personas (clientes) para ventas
  getPersonas: async (): Promise<PersonaDTO[]> => {
    const response = await api.get<PersonaDTO[]>('/personas');
    return response.data;
  },
};
