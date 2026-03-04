import React, { useState, useEffect } from 'react';
import { comprasService } from '@/features/pos/services/comprasService';
import { deudasProveedoresService } from '@/services/deudasService';
import { useToast } from '@/hooks/useToast';
import type { Proveedor, DeudaProveedor } from '@/types';
import './SeleccionProveedores.css'; // Estilos específicos Material Design
import axios from 'axios';
interface SeleccionProveedoresProps {
  onProveedorSelect: (proveedor: Proveedor) => void;
  onBackToInventario?: () => void;
}

const SeleccionProveedores: React.FC<SeleccionProveedoresProps> = ({ 
  onProveedorSelect, 
  onBackToInventario 
}) => {
  const toast = useToast();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [deudasMap, setDeudasMap] = useState<Map<string, DeudaProveedor>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProveedores = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando proveedores...');
      console.log('🔗 Backend URL configurada:', import.meta.env.VITE_API_URL || 'http://localhost:8080');
      
      // Verificar si hay token de autenticación
      const authData = localStorage.getItem('pos_auth_data');
      console.log('🔑 Auth data presente:', !!authData);
      
      // Cargar proveedores y deudas en paralelo
      const [proveedoresData, deudasData] = await Promise.all([
        comprasService.obtenerProveedores(),
        deudasProveedoresService.obtenerDeudasProveedores().catch(err => {
          console.warn('⚠️ No se pudieron cargar deudas:', err);
          return [];
        })
      ]);
      
      console.log('✅ Proveedores cargados:', proveedoresData);
      console.log('✅ Deudas cargadas:', deudasData);
      console.log('📊 Cantidad de proveedores:', proveedoresData.length);
      console.log('📊 Cantidad de deudas:', deudasData.length);
      
      // Crear mapa de deudas por proveedor ID  
      const deudasMap = new Map<string, DeudaProveedor>();
      deudasData.forEach(deuda => {
        deudasMap.set(deuda.proveedorId, deuda);
        console.log(`💰 Deuda encontrada: ${deuda.proveedorNombre} -> $${deuda.deudaPendiente}`);
      });
      
      setDeudasMap(deudasMap);
      
      if (proveedoresData.length === 0) {
        setError('No se encontraron proveedores activos en el sistema');
        toast.showError('No hay proveedores disponibles');
      } else {
        setProveedores(proveedoresData);
        setError(null);
      }
    } catch (error: unknown) {
      console.error('❌ Error loading proveedores:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        status: axios.isAxiosError(error) && error.response?.status,
        statusText: axios.isAxiosError(error) && error.response?.statusText,
        data: axios.isAxiosError(error) && error.response?.data,
        url: axios.isAxiosError(error) && error.config?.url
      });
      
      let errorMessage = 'Error al cargar los proveedores';
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        errorMessage = 'No tienes permisos para acceder a esta información.';
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        errorMessage = 'Endpoint de proveedores no encontrado.';
      } else if (error instanceof Error ? error.message : String(error)?.includes('Network Error')) {
        errorMessage = 'Error de conexión. Verifica que el backend esté funcionando.';
      }
      
      setError(errorMessage);
      toast.showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const handleProveedorClick = (proveedor: Proveedor) => {
    onProveedorSelect(proveedor);
  };

  const getStatusInfo = (proveedor: Proveedor) => {
    // Buscar deuda en el mapa de deudas
    const deudaInfo = deudasMap.get(proveedor.id);
    const deudaTotal = deudaInfo?.deudaPendiente || 0;
    
    console.log(`🔍 Verificando deuda para ${proveedor.nombreCompleto}:`, {
      proveedorId: proveedor.id,
      deudaEncontrada: !!deudaInfo,
      deudaPendiente: deudaTotal,
      estadoDeuda: deudaInfo?.estadoDeuda
    });
    
    if (deudaTotal > 0) {
      return {
        className: 'status-debt',
        text: 'Con deuda',
        deudaTotal
      };
    } else {
      return {
        className: 'status-available',
        text: 'Sin deuda',
        deudaTotal: 0
      };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getNombreCompleto = (proveedor: Proveedor) => {
    return proveedor.nombreCompleto; // El backend ya nos da el nombre completo
  };

  if (isLoading) {
    return (
      <div className="proveedores-container">
        <div className="proveedores-loading">
          <div style={{ fontSize: '48px', color: 'var(--md-primary)' }}>🔄</div>
          <h3>Cargando proveedores...</h3>
          <p>Por favor espera mientras obtenemos la información</p>
        </div>
      </div>
    );
  }

  return (
    <div className="proveedores-container">
      <div className="proveedores-header">
        <div className="proveedores-title-section">
          <h2>Seleccionar Proveedor</h2>
          <p className="proveedores-subtitle">Elige un proveedor para realizar compras</p>
        </div>
        
        {onBackToInventario && (
          <button 
            className="back-button md-button"
            onClick={onBackToInventario}
          >
            <span className="back-button-icon">←</span>
            Volver al Inventario
          </button>
        )}
      </div>

      {error && (
        <div className="proveedores-error">
          <span className="proveedores-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="proveedores-grid">
        {proveedores.map((proveedor) => {
          const statusInfo = getStatusInfo(proveedor);
          const deudaInfo = deudasMap.get(proveedor.id);
          
          console.log(`🎨 Renderizando ${proveedor.nombreCompleto}:`, {
            statusInfo,
            deudaInfo: deudaInfo ? {
              deudaPendiente: deudaInfo.deudaPendiente,
              estadoDeuda: deudaInfo.estadoDeuda
            } : 'No encontrada'
          });
          
          return (
            <button
              key={proveedor.id}
              className={`proveedor-card ${statusInfo.className}`}
              onClick={() => handleProveedorClick(proveedor)}
            >
              <div className="proveedor-icon">
                🏪
              </div>
              
              <div className="proveedor-info">
                <h3 className="proveedor-name">
                  {getNombreCompleto(proveedor)}
                </h3>
                
                <div className="proveedor-details">
                  {proveedor.telefono && (
                    <div className="proveedor-detail-item">
                      <span className="proveedor-detail-label">Teléfono:</span>
                      <span className="proveedor-detail-value">{proveedor.telefono}</span>
                    </div>
                  )}
                  
                  {proveedor.email && (
                    <div className="proveedor-detail-item">
                      <span className="proveedor-detail-label">Email:</span>
                      <span className="proveedor-detail-value">{proveedor.email}</span>
                    </div>
                  )}
                  
                  {statusInfo.deudaTotal > 0 && (
                    <div className="proveedor-debt-info">
                      <div className="proveedor-detail-item">
                        <span className="proveedor-detail-label">Deuda pendiente:</span>
                        <span className="proveedor-debt-amount">
                          {formatCurrency(statusInfo.deudaTotal)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`proveedor-status ${statusInfo.className}`}>
                {statusInfo.text}
              </div>
            </button>
          );
        })}
      </div>

      {proveedores.length === 0 && !isLoading && (
        <div className="proveedores-empty">
          <div className="proveedores-empty-icon">🏪</div>
          <h3>No hay proveedores disponibles</h3>
          <p>No se encontraron proveedores activos en el sistema.</p>
        </div>
      )}
    </div>
  );
};

export default SeleccionProveedores;