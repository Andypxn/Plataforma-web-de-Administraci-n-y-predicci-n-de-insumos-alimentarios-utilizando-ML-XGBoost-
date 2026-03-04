import React, { useState, useEffect } from 'react';
import { deudasProveedoresService } from '@/services/deudasService';
import type { DeudaProveedor, EstadisticasDeudas } from '@/types/index';
import './DeudasProveedores.css';

/**
 * Componente para visualizar las deudas a proveedores
 * Muestra una tabla con información detallada de las deudas pendientes
 * Incluye filtros, búsqueda y estadísticas generales
 */
export const DeudasProveedores: React.FC = () => {
  // Estado principal
  const [deudas, setDeudas] = useState<DeudaProveedor[]>([]);
  const [deudasFiltradas, setDeudasFiltradas] = useState<DeudaProveedor[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDeudas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para filtros y búsqueda
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'verde' | 'amarillo'>('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'deuda' | 'fecha'>('deuda');

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    aplicarFiltros();
  }, [deudas, filtroEstado, terminoBusqueda, ordenamiento]);

  /**
   * Carga los datos de deudas y estadísticas desde el backend
   */
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const [deudasData, estadisticasData] = await Promise.all([
        deudasProveedoresService.obtenerDeudasProveedores(),
        deudasProveedoresService.obtenerEstadisticasDeudas()
      ]);

      // LOGS DE DEPURACIÓN
      console.log('=== DATOS RECIBIDOS DE LA API ===');
      console.log('Deudas data:', deudasData);
      console.log('Estadísticas data:', estadisticasData);
      
      if (deudasData && deudasData.length > 0) {
        console.log('=== PRIMER PROVEEDOR ===');
        console.log('Proveedor:', deudasData[0].proveedorNombre);
        console.log('Estado de deuda:', deudasData[0].estadoDeuda);
        console.log('Deuda pendiente:', deudasData[0].deudaPendiente);
        console.log('Total compras:', deudasData[0].totalCompras);
        console.log('Total pagos:', deudasData[0].totalPagos);
      }

      setDeudas(deudasData);
      setEstadisticas(estadisticasData);
    } catch (err) {
      console.error('ERROR AL CARGAR DATOS:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Aplica filtros, búsqueda y ordenamiento a las deudas
   */
  const aplicarFiltros = () => {
    let resultado = [...deudas];

    console.log('=== APLICANDO FILTROS ===');
    console.log('Deudas originales:', deudas.length);
    console.log('Filtro estado:', filtroEstado);

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      resultado = deudasProveedoresService.filtrarPorEstado(resultado, filtroEstado);
      console.log('Después de filtrar por estado:', resultado.length);
    }

    // Buscar por nombre
    resultado = deudasProveedoresService.buscarPorNombre(resultado, terminoBusqueda);
    console.log('Después de buscar por nombre:', resultado.length);

    // Ordenar
    switch (ordenamiento) {
      case 'deuda':
        resultado = deudasProveedoresService.ordenarPorDeuda(resultado);
        break;
      case 'fecha':
        resultado = deudasProveedoresService.ordenarPorFecha(resultado);
        break;
      case 'nombre':
        resultado.sort((a, b) => a.proveedorNombre.localeCompare(b.proveedorNombre));
        break;
    }

    console.log('Resultado final:', resultado);
    if (resultado.length > 0) {
      console.log('Primer elemento del resultado:', resultado[0]);
    }

    setDeudasFiltradas(resultado);
  };

  /**
   * Formatea un número como moneda mexicana
   */
  const formatearMoneda = (cantidad: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cantidad);
  };

  /**
   * Formatea una fecha para mostrar
   */
  const formatearFecha = (fecha: string | undefined): string => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX');
  };

  /**
   * Obtiene la clase CSS para el estado de la deuda
   */
  const obtenerClaseEstado = (estado: 'verde' | 'amarillo'): string => {
    return estado === 'verde' ? 'estado-sin-deuda' : 'estado-con-deuda';
  };

  /**
   * Obtiene estilos inline para el estado de la deuda (fallback para garantizar visualización)
   */
  const obtenerEstilosEstado = (estado: 'verde' | 'amarillo'): React.CSSProperties => {
    if (estado === 'amarillo') {
      return {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderLeft: '4px solid #ffc107'
      };
    }
    return {
      backgroundColor: 'rgba(39, 174, 96, 0.05)'
    };
  };

  /**
   * Obtiene estilos inline para el indicador de estado
   */
  const obtenerEstilosIndicador = (estado: 'verde' | 'amarillo'): React.CSSProperties => {
    if (estado === 'amarillo') {
      return {
        background: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffc107',
        fontWeight: '700',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px'
      };
    }
    return {
      background: '#d5eedd',
      color: '#27ae60',
      border: '1px solid #27ae60',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    };
  };

  if (cargando) {
    return (
      <div className="deudas-proveedores">
        <div className="cargando">
          <div className="spinner"></div>
          <p>Cargando deudas de proveedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deudas-proveedores">
        <div className="error">
          <h3>Error al cargar los datos</h3>
          <p>{error}</p>
          <button onClick={cargarDatos} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deudas-proveedores">
      <div className="header">
        <h1>Deudas a Proveedores</h1>
        <button onClick={cargarDatos} className="btn-actualizar" disabled={cargando}>
          🔄 Actualizar
        </button>
      </div>

      {/* Estadísticas generales */}
      {estadisticas && (
        <div className="estadisticas">
          <div className="tarjeta-estadistica">
            <h3>Proveedores con Deuda</h3>
            <span className="numero">{estadisticas.totalProveedoresConDeuda}</span>
          </div>
          <div className="tarjeta-estadistica">
            <h3>Total Adeudado</h3>
            <span className="numero">{formatearMoneda(estadisticas.totalDeudasPendientes)}</span>
          </div>
          <div className="tarjeta-estadistica">
            <h3>Deuda Promedio</h3>
            <span className="numero">{formatearMoneda(estadisticas.deudaPromedio)}</span>
          </div>
        </div>
      )}

      {/* Controles de filtrado */}
      <div className="controles">
        <div className="grupo-control">
          <label>Buscar proveedor:</label>
          <input
            type="text"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            placeholder="Nombre del proveedor..."
            className="input-busqueda"
          />
        </div>

        <div className="grupo-control">
          <label>Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'verde' | 'amarillo')}
            className="select-filtro"
          >
            <option value="todos">Todos</option>
            <option value="amarillo">Con deuda</option>
            <option value="verde">Sin deuda</option>
          </select>
        </div>

        <div className="grupo-control">
          <label>Ordenar por:</label>
          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value as 'nombre' | 'deuda' | 'fecha')}
            className="select-ordenamiento"
          >
            <option value="deuda">Deuda (mayor a menor)</option>
            <option value="nombre">Nombre (A-Z)</option>
            <option value="fecha">Fecha más antigua</option>
          </select>
        </div>
      </div>

      {/* Tabla de deudas */}
      <div className="tabla-container">
        {deudasFiltradas.length === 0 ? (
          <div className="sin-resultados">
            <p>No se encontraron deudas que coincidan con los filtros aplicados.</p>
          </div>
        ) : (
          <table className="tabla-deudas">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Total Compras</th>
                <th>Total Pagos</th>
                <th>Deuda Pendiente</th>
                <th>Estado</th>
                <th>Órdenes Pendientes</th>
                <th>Fecha Más Antigua</th>
              </tr>
            </thead>
            <tbody>
              {deudasFiltradas.map((deuda) => {
                // LOG DE DEPURACIÓN PARA CADA FILA
                console.log(`=== RENDERIZANDO ${deuda.proveedorNombre} ===`);
                console.log('Estado de deuda:', deuda.estadoDeuda);
                console.log('Deuda pendiente:', deuda.deudaPendiente);
                console.log('Estilos que se aplicarán:', obtenerEstilosEstado(deuda.estadoDeuda));
                
                return (
                  <tr 
                    key={deuda.proveedorId} 
                    className={obtenerClaseEstado(deuda.estadoDeuda)}
                    style={obtenerEstilosEstado(deuda.estadoDeuda)}
                  >
                    <td className="proveedor-info">
                      <div className="nombre">{deuda.proveedorNombre}</div>
                      {deuda.estadoDeuda === 'amarillo' && (
                        <div 
                          className="alerta-deuda"
                          style={{
                            fontSize: '12px',
                            color: '#856404',
                            background: '#fff3cd',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            marginTop: '5px',
                            border: '1px solid #ffc107',
                            fontWeight: '600'
                          }}
                        >
                          ⚠️ Deuda pendiente: {formatearMoneda(deuda.deudaPendiente)}
                        </div>
                      )}
                    </td>
                    <td className="contacto-info">
                      {deuda.telefonoProveedor && (
                        <div className="telefono">📞 {deuda.telefonoProveedor}</div>
                      )}
                      {deuda.emailProveedor && (
                        <div className="email">📧 {deuda.emailProveedor}</div>
                      )}
                    </td>
                    <td className="monto">{formatearMoneda(deuda.totalCompras)}</td>
                    <td className="monto">{formatearMoneda(deuda.totalPagos)}</td>
                    <td className="monto deuda-pendiente" style={{ color: '#d63384', fontWeight: '700' }}>
                      {formatearMoneda(deuda.deudaPendiente)}
                    </td>
                    <td className={`estado ${deuda.estadoDeuda}`}>
                      <span 
                        className={`indicador-estado ${deuda.estadoDeuda}`}
                        style={obtenerEstilosIndicador(deuda.estadoDeuda)}
                      >
                        {deuda.estadoDeuda === 'verde' ? '✅ Sin deuda' : '⚠️ Con deuda'}
                      </span>
                    </td>
                    <td className="ordenes-pendientes">
                      {deuda.cantidadOrdenesPendientes}
                    </td>
                    <td className="fecha">
                      {formatearFecha(deuda.fechaOrdenMasAntigua)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Resumen de resultados */}
      <div className="resumen">
        <p>
          Mostrando {deudasFiltradas.length} de {deudas.length} proveedores
          {filtroEstado !== 'todos' && ` (filtrado por: ${filtroEstado})`}
          {terminoBusqueda && ` (búsqueda: "${terminoBusqueda}")`}
        </p>
      </div>
    </div>
  );
};