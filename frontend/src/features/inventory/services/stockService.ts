/**
 * Servicio para verificar niveles de stock y generar alertas
 * Integrado con el sistema de inventario existente
 */

import type { ProductoDTO } from './inventarioService';

// Interface para productos con stock bajo
export interface ProductoStockBajo {
  id: string;
  nombre: string;
  cantidadActual: number;
  umbralMinimo: number;
  categoria?: string;
  proveedor?: string;
  nivelCriticidad: 'critico' | 'bajo' | 'medio';
}

// Interface para configuración de umbrales
export interface ConfiguracionStock {
  umbralCritico: number;    // Por defecto: 3
  umbralBajo: number;       // Por defecto: 5
  umbralMedio: number;      // Por defecto: 10
}

// Interface para resultado de verificación
export interface ResultadoVerificacionStock {
  tieneProductosBajos: boolean;
  cantidadProductosCriticos: number;
  cantidadProductosBajos: number;
  productosCriticos: ProductoStockBajo[];
  productosBajos: ProductoStockBajo[];
  todosLosProductos: ProductoStockBajo[];
}

// Configuración por defecto
const CONFIG_DEFAULT: ConfiguracionStock = {
  umbralCritico: 3,
  umbralBajo: 5,
  umbralMedio: 10
};

/**
 * Sistema de throttling para evitar spam de alertas
 */
class ThrottleManager {
  private alertasRecientes: Map<string, number> = new Map();
  private readonly TIEMPO_THROTTLE = 30 * 60 * 1000; // 30 minutos

  /**
   * Verifica si se puede mostrar una alerta para un producto
   */
  puedeAlertarProducto(productoId: string): boolean {
    const ultimaAlerta = this.alertasRecientes.get(productoId);
    const ahora = Date.now();

    if (!ultimaAlerta || (ahora - ultimaAlerta) > this.TIEMPO_THROTTLE) {
      this.alertasRecientes.set(productoId, ahora);
      return true;
    }

    return false;
  }

  /**
   * Limpia alertas antiguas del cache
   */
  limpiarAlertas(): void {
    const ahora = Date.now();
    for (const [productoId, tiempo] of this.alertasRecientes.entries()) {
      if ((ahora - tiempo) > this.TIEMPO_THROTTLE) {
        this.alertasRecientes.delete(productoId);
      }
    }
  }

  /**
   * Reinicia el throttle para un producto específico
   */
  reiniciarThrottleProducto(productoId: string): void {
    this.alertasRecientes.delete(productoId);
  }
}

// Instancia global del throttle manager
const throttleManager = new ThrottleManager();

/**
 * Determina el nivel de criticidad basado en la cantidad y umbrales
 */
function determinarNivelCriticidad(cantidad: number, config: ConfiguracionStock): 'critico' | 'bajo' | 'medio' {
  if (cantidad <= config.umbralCritico) {
    return 'critico';
  } else if (cantidad <= config.umbralBajo) {
    return 'bajo';
  } else if (cantidad <= config.umbralMedio) {
    return 'medio';
  }
  return 'medio'; // Fallback
}

/**
 * Convierte ProductoDTO a ProductoStockBajo
 */
function convertirAProductoStockBajo(producto: ProductoDTO, config: ConfiguracionStock): ProductoStockBajo {
  const cantidadActual = producto.cantidadInventario || 0;
  const umbralMinimo = config.umbralBajo;
  
  return {
    id: producto.id,
    nombre: producto.nombre,
    cantidadActual,
    umbralMinimo,
    categoria: producto.categoriasProductosCategoria,
    proveedor: producto.proveedorNombre ? 
      `${producto.proveedorNombre} ${producto.proveedorApellidoPaterno || ''}`.trim() : undefined,
    nivelCriticidad: determinarNivelCriticidad(cantidadActual, config)
  };
}

/**
 * Obtiene la configuración de stock desde localStorage o usa valores por defecto
 */
function obtenerConfiguracion(): ConfiguracionStock {
  try {
    const configGuardada = localStorage.getItem('configuracion_stock');
    if (configGuardada) {
      const config = JSON.parse(configGuardada);
      return { ...CONFIG_DEFAULT, ...config };
    }
  } catch (error) {
    console.warn('Error al cargar configuración de stock:', error);
  }
  
  return CONFIG_DEFAULT;
}

/**
 * Guarda la configuración de stock en localStorage
 */
function guardarConfiguracion(config: ConfiguracionStock): void {
  try {
    localStorage.setItem('configuracion_stock', JSON.stringify(config));
  } catch (error) {
    console.warn('Error al guardar configuración de stock:', error);
  }
}

/**
 * Servicio principal de verificación de stock
 */
export const stockService = {
  
  /**
   * Verifica qué productos tienen stock bajo según los umbrales configurados
   */
  verificarStockBajo(productos: ProductoDTO[], configuracion?: ConfiguracionStock): ResultadoVerificacionStock {
    const config = configuracion || obtenerConfiguracion();
    
    // Filtrar solo productos activos con inventario definido
    const productosActivos = productos.filter(producto => 
      producto.estadosEstado?.toLowerCase() === 'activo' &&
      producto.cantidadInventario !== undefined &&
      producto.cantidadInventario !== null
    );

    // Convertir a ProductoStockBajo y filtrar por umbral
    const todosLosProductos = productosActivos.map(producto => 
      convertirAProductoStockBajo(producto, config)
    );

    const productosBajos = todosLosProductos.filter(producto => 
      producto.cantidadActual <= config.umbralBajo
    );

    const productosCriticos = productosBajos.filter(producto => 
      producto.cantidadActual <= config.umbralCritico
    );

    return {
      tieneProductosBajos: productosBajos.length > 0,
      cantidadProductosCriticos: productosCriticos.length,
      cantidadProductosBajos: productosBajos.length,
      productosCriticos,
      productosBajos,
      todosLosProductos: todosLosProductos
    };
  },

  /**
   * Filtra productos que pueden generar alertas (considerando throttle)
   */
  obtenerProductosParaAlertar(productos: ProductoStockBajo[]): ProductoStockBajo[] {
    return productos.filter(producto => 
      throttleManager.puedeAlertarProducto(producto.id)
    );
  },

  /**
   * Verifica si se debe mostrar alerta agrupada o individual
   */
  determinarTipoAlerta(productos: ProductoStockBajo[]): 'individual' | 'agrupada' {
    return productos.length > 3 ? 'agrupada' : 'individual';
  },

  /**
   * Obtiene productos organizados por nivel de criticidad para alertas
   */
  organizarProductosPorCriticidad(productos: ProductoStockBajo[]): {
    criticos: ProductoStockBajo[];
    bajos: ProductoStockBajo[];
    medios: ProductoStockBajo[];
  } {
    return {
      criticos: productos.filter(p => p.nivelCriticidad === 'critico'),
      bajos: productos.filter(p => p.nivelCriticidad === 'bajo'),
      medios: productos.filter(p => p.nivelCriticidad === 'medio')
    };
  },

  /**
   * Gestión de configuración
   */
  configuracion: {
    obtener: obtenerConfiguracion,
    guardar: guardarConfiguracion,
    restaurarDefecto: (): ConfiguracionStock => {
      guardarConfiguracion(CONFIG_DEFAULT);
      return CONFIG_DEFAULT;
    }
  },

  /**
   * Gestión de throttle
   */
  throttle: {
    puedeAlertar: (productoId: string) => throttleManager.puedeAlertarProducto(productoId),
    limpiar: () => throttleManager.limpiarAlertas(),
    reiniciar: (productoId: string) => throttleManager.reiniciarThrottleProducto(productoId)
  },

  /**
   * Utilidades adicionales
   */
  utilidades: {
    /**
     * Formatea la información de un producto para mostrar en alerta
     */
    formatearProductoParaAlerta(producto: ProductoStockBajo): string {
      return `📦 ${producto.nombre}: ${producto.cantidadActual} unidades`;
    },

    /**
     * Obtiene el emoji correspondiente al nivel de criticidad
     */
    obtenerEmojiCriticidad(nivel: 'critico' | 'bajo' | 'medio'): string {
      switch (nivel) {
        case 'critico': return '🔴';
        case 'bajo': return '🟡';
        case 'medio': return '🟠';
        default: return '⚪';
      }
    },

    /**
     * Calcula estadísticas de stock para dashboard
     */
    calcularEstadisticas(productos: ProductoStockBajo[], config: ConfiguracionStock) {
      return {
        totalProductos: productos.length,
        productosCriticos: productos.filter(p => p.cantidadActual <= config.umbralCritico).length,
        productosBajos: productos.filter(p => p.cantidadActual <= config.umbralBajo).length,
        productosOk: productos.filter(p => p.cantidadActual > config.umbralBajo).length,
        stockPromedioGeneral: productos.reduce((sum, p) => sum + p.cantidadActual, 0) / productos.length || 0
      };
    }
  }
};