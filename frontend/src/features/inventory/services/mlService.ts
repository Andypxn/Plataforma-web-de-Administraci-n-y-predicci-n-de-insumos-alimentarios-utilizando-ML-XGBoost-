// Servicio para consumir la API de Machine Learning
import axios from 'axios';

// URL base de la API de ML (a través del proxy del backend)
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_URL || (import.meta.env.VITE_API_URL || 'https://api.tonatiuham.dev') + '/api/ml';

// Cliente axios configurado para ML API
const mlApiClient = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 30000, // 30 segundos para predicciones
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos TypeScript para las respuestas de ML

// Datos de ventas históricas requeridos por la API ML
export interface VentaHistorica {
  fecha_orden: string;
  productos_id: string;
  cantidad_pz: number;
  precio_venta?: number;
  costo_compra?: number;
}

export interface PredictionRequest {
  ventas_historicas: VentaHistorica[];
  productos_objetivo?: string[];
}

export interface ProductoPrediccion {
  productos_id: string;
  cantidad_recomendada: number;
  prioridad_score: number;
  confianza: number;
}

export interface PredictionResponse {
  predicciones: ProductoPrediccion[];
  timestamp: string;
  modelo_version: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  modelos_cargados: boolean;
  version: string;
}

// Clase de servicio principal
class MLService {
  
  /**
   * Verifica el estado de la API de ML
   */
  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await mlApiClient.get<HealthResponse>('/health');
      return response.data;
    } catch (error) {
      console.error('Error verificando salud de ML API:', error);
      throw new Error('No se pudo conectar con el servicio de predicciones');
    }
  }

  /**
   * Obtiene predicciones de productos con datos históricos
   */
  async getPredictions(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = performance.now();
    console.log(`LATENCY_TEST_START: getPredictions`);
    try {
      console.log('🔮 Solicitando predicciones ML:', request);

      const response = await mlApiClient.post<PredictionResponse>('/predict', request);
      
      console.log('✅ Predicciones recibidas:', response.data);
      const endTime = performance.now();
      console.log(`LATENCY_TEST_END: getPredictions took ${endTime - startTime} ms`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo predicciones:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
        throw new Error(`Error en predicciones: ${errorMessage}`);
      }
      
      throw new Error('Error desconocido al obtener predicciones');
    }
  }

  /**
   * Obtiene datos históricos de ventas del backend
   */
  private async getVentasHistoricas(diasAtras: number = 90): Promise<VentaHistorica[]> {
    try {
      // Importar el cliente API por defecto
      const api = await import('../../../services/apiService');
      
      // Calcular fecha límite
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAtras);
      
      console.log('📡 Obteniendo ventas históricas desde:', fechaLimite.toISOString().split('T')[0]);
      
      // Obtener ventas desde el nuevo endpoint ML del backend
      const ventasResponse = await api.default.get('/ordenes-de-ventas/historial-ml', {
        params: {
          fechaDesde: fechaLimite.toISOString().split('T')[0],
          limite: 1000
        }
      });
      
      console.log('📊 Respuesta del backend - Status:', ventasResponse.status);
      console.log('📊 Cantidad de registros recibidos:', Array.isArray(ventasResponse.data) ? ventasResponse.data.length : 'No es array');
      console.log('📊 Primeros registros:', ventasResponse.data?.slice(0, 3));
      
      // Validar que la respuesta sea un array
      if (!Array.isArray(ventasResponse.data)) {
        console.warn('⚠️ La respuesta no es un array, usando datos dummy');
        return this.generateDummyVentasHistoricas();
      }
      
      // Validar que el array no esté vacío
      if (ventasResponse.data.length === 0) {
        console.warn('⚠️ El backend devolvió un array vacío, usando datos dummy');
        return this.generateDummyVentasHistoricas();
      }
      
      // Los datos ya vienen en el formato correcto para ML API
      return ventasResponse.data as VentaHistorica[];
      
    } catch (error) {
      console.error('❌ Error obteniendo ventas históricas del backend:', error);
      if (error instanceof Error) {
        console.error('❌ Mensaje de error:', error.message);
      }
      console.log('⚠️ Usando datos dummy para testing...');
      // Retornar datos dummy para testing
      return this.generateDummyVentasHistoricas();
    }
  }

  /**
   * Obtiene información adicional de productos del backend con stock
   */
  private async getProductosInfo(): Promise<Map<string, {nombre: string, categoria: string, stock: number}>> {
    try {
      const api = await import('../../../services/apiService');
      const productosResponse = await api.default.get('/productos');
      
      const productosMap = new Map();
      
      productosResponse.data.forEach((producto: any) => {
        productosMap.set(producto.id, {
          nombre: producto.nombre || `Producto ${producto.id}`,
          categoria: producto.categoriasProductosCategoria || 'General',
          stock: producto.cantidadInventario || 0
        });
      });
      
      console.log('📦 Información de productos obtenida:', productosMap.size, 'productos');
      console.log('📦 Ejemplo de producto:', productosResponse.data[0]);
      return productosMap;
    } catch (error) {
      console.error('Error obteniendo información de productos:', error);
      if (error instanceof Error) {
        console.error('Detalles del error:', error.message);
      }
      return new Map();
    }
  }

  /**
   * Calcula promedio de consumo diario basado en ventas históricas
   */
  private calcularConsumoPromedio(ventasHistoricas: VentaHistorica[], productoId: string, dias: number = 30): number {
    const ventasProducto = ventasHistoricas.filter(venta => venta.productos_id === productoId);
    
    if (ventasProducto.length === 0) return 0;
    
    const totalVendido = ventasProducto.reduce((sum, venta) => sum + venta.cantidad_pz, 0);
    return totalVendido / dias;
  }

  /**
   * Genera datos dummy para testing cuando no hay datos históricos
   */
  private generateDummyVentasHistoricas(): VentaHistorica[] {
    const productos = ['PROD001', 'PROD002', 'PROD003', 'PROD004', 'PROD005'];
    const ventasDummy: VentaHistorica[] = [];
    
    for (let i = 0; i < 50; i++) {
      const fechaBase = new Date();
      fechaBase.setDate(fechaBase.getDate() - Math.floor(Math.random() * 90));
      
      ventasDummy.push({
        fecha_orden: fechaBase.toISOString().split('T')[0],
        productos_id: productos[Math.floor(Math.random() * productos.length)],
        cantidad_pz: Math.floor(Math.random() * 20) + 1,
        precio_venta: Math.random() * 100 + 10,
        costo_compra: Math.random() * 80 + 5
      });
    }
    
    return ventasDummy;
  }

  /**
   * Obtiene predicciones con datos históricos automáticos
   */
  async getPredictionsWithHistory(productosObjetivo?: string[], diasHistoricos: number = 90): Promise<PredictionResponse> {
    const ventasHistoricas = await this.getVentasHistoricas(diasHistoricos);
    
    return this.getPredictions({
      ventas_historicas: ventasHistoricas,
      productos_objetivo: productosObjetivo
    });
  }

  /**
   * Verifica si el servicio ML está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.modelos_cargados;
    } catch {
      return false;
    }
  }

  /**
   * Formatea la respuesta de predicciones para mostrar en UI
   */
  async formatPredictionsForDisplay(response: PredictionResponse, ventasHistoricas?: VentaHistorica[]): Promise<Array<{
    id: string;
    nombre: string;
    categoria: string;
    cantidadSugerida: number;
    prioridad: 'Alta' | 'Media' | 'Baja';
    prioridadScore: number;
    stockActual: number;
    diasStock: number | null;
    confianza: string;
    recomendacion: string;
  }>> {
    console.log('🎨 Iniciando formateo de predicciones...');
    console.log('🎨 Predicciones recibidas:', response.predicciones.length);
    
    // Obtener información de productos con stock
    const productosInfo = await this.getProductosInfo();
    console.log('🎨 ProductosInfo obtenido:', productosInfo.size, 'productos');
    
    // Si no se proporcionan ventas históricas, obtenerlas
    let ventasData = ventasHistoricas;
    if (!ventasData) {
      ventasData = await this.getVentasHistoricas(90);
    }
    console.log('🎨 Ventas históricas:', ventasData.length, 'registros');
    
    const resultados = response.predicciones.map(prediccion => {
      console.log(`🎨 Procesando predicción para producto: ${prediccion.productos_id}`);
      
      // Obtener información del producto
      const infoProducto = productosInfo.get(prediccion.productos_id);
      console.log(`🎨 Info producto encontrada:`, infoProducto);
      
      // Calcular stock actual y días de stock
      const stockActual = infoProducto?.stock || 0;
      const consumoPromedio = this.calcularConsumoPromedio(ventasData!, prediccion.productos_id, 30);
      const diasStock = consumoPromedio > 0 ? Math.floor(stockActual / consumoPromedio) : null;
      
      console.log(`🎨 Stock: ${stockActual}, Consumo promedio: ${consumoPromedio}, Días stock: ${diasStock}`);
      
      // Determinar nivel de prioridad
      let prioridad: 'Alta' | 'Media' | 'Baja';
      if (prediccion.prioridad_score >= 0.7) {
        prioridad = 'Alta';
      } else if (prediccion.prioridad_score >= 0.4) {
        prioridad = 'Media';
      } else {
        prioridad = 'Baja';
      }

      // Generar recomendación mejorada
      let recomendacion = '';
      if (prediccion.cantidad_recomendada > 0) {
        if (diasStock !== null && diasStock < 7) {
          recomendacion = 'Compra urgente - Stock crítico';
        } else if (prediccion.prioridad_score >= 0.7) {
          recomendacion = 'Compra recomendada - Alta demanda';
        } else if (prediccion.cantidad_recomendada >= 50) {
          recomendacion = 'Considerar compra en cantidad';
        } else {
          recomendacion = 'Reposición normal';
        }
      } else {
        if (stockActual > 0) {
          recomendacion = 'Stock suficiente por ahora';
        } else {
          recomendacion = 'Sin stock - Evaluar demanda';
        }
      }

      const resultado = {
        id: prediccion.productos_id,
        nombre: infoProducto?.nombre || `Producto ${prediccion.productos_id}`,
        categoria: infoProducto?.categoria || 'General',
        cantidadSugerida: Math.round(prediccion.cantidad_recomendada),
        prioridad,
        prioridadScore: prediccion.prioridad_score,
        stockActual,
        diasStock,
        confianza: `${Math.round(prediccion.confianza * 100)}%`,
        recomendacion
      };
      
      console.log(`🎨 Resultado formateado:`, resultado);
      return resultado;
    });
    
    console.log('🎨 Formateo completado. Total resultados:', resultados.length);
    return resultados;
  }
}

// Exportar instancia única del servicio
export const mlService = new MLService();

// Hook personalizado para React
import { useState, useEffect } from 'react';

export const useMLPredictions = () => {
  const [predictions, setPredictions] = useState<ProductoPrediccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMLAvailable, setIsMLAvailable] = useState(false);

  // Verificar disponibilidad del servicio ML al montar
  useEffect(() => {
    mlService.isAvailable().then(setIsMLAvailable);
  }, []);

  const loadPredictions = async (productosObjetivo?: string[], diasHistoricos: number = 90) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mlService.getPredictionsWithHistory(productosObjetivo, diasHistoricos);
      setPredictions(response.predicciones);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const loadPredictionsWithCustomData = async (ventasHistoricas: VentaHistorica[], productosObjetivo?: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mlService.getPredictions({
        ventas_historicas: ventasHistoricas,
        productos_objetivo: productosObjetivo
      });
      setPredictions(response.predicciones);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return {
    predictions,
    loading,
    error,
    isMLAvailable,
    loadPredictions,
    loadPredictionsWithCustomData,
    refetch: () => loadPredictions()
  };
};

export default mlService;