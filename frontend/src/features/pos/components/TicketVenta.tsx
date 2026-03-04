import React, { useState } from 'react';
import { workspaceService, metodoPagoService } from '@/services/apiService';
import { inventarioService } from '@/features/inventory/services/inventarioService';
import { useToast } from '@/hooks/useToast';
import type { TicketVenta as TicketVentaData, MetodoPago, FinalizarVentaRequest, VentaFinalizada } from '@/types';
import './TicketVenta.css';

interface TicketVentaProps {
  ticket: TicketVentaData;
  onVentaFinalizada: (venta: VentaFinalizada) => void;
  onCerrar: () => void;
}

const TicketVenta: React.FC<TicketVentaProps> = ({ ticket, onVentaFinalizada, onCerrar }) => {
  const toast = useToast();
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);

  // Cargar métodos de pago al mostrar el modal
  React.useEffect(() => {
    const cargarMetodosPago = async () => {
      try {
        const metodos = await metodoPagoService.getAll();
        setMetodosPago(metodos);
        if (metodos.length > 0) {
          setMetodoPagoSeleccionado(metodos[0].id);
        }
      } catch (error) {
        console.error('Error al cargar métodos de pago:', error);
      }
    };

    cargarMetodosPago();
  }, []);

  const confirmarPago = async () => {
    if (!metodoPagoSeleccionado) {
      toast.showWarning(`⚠️ MÉTODO DE PAGO REQUERIDO

Por favor seleccione un método de pago antes de continuar.

👆 HAZ CLIC AQUÍ PARA CERRAR`);
      return;
    }

    try {
      setIsLoading(true);

      // Obtener dinámicamente el primer usuario disponible
      const usuarioId = await inventarioService.getFirstAvailableUser();

      const request: FinalizarVentaRequest = {
        metodoPagoId: metodoPagoSeleccionado,
        usuarioId: usuarioId,
        clienteId: undefined // Por ahora sin cliente específico
      };

      const ventaFinalizada = await workspaceService.finalizarVenta(ticket.workspaceId, request);
      onVentaFinalizada(ventaFinalizada);

    } catch (error) {
      console.error('Error al finalizar venta:', error);
      toast.showError(`❌ ERROR AL PROCESAR PAGO

No se pudo completar la transacción. Intente nuevamente.

👆 HAZ CLIC AQUÍ PARA CERRAR`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ticket-venta-overlay">
      <div className="ticket-venta-modal">
        <div className="ticket-header">
          <h2>🧾 Ticket de Venta</h2>
          <button className="btn-cerrar" onClick={onCerrar} disabled={isLoading}>
            ✕
          </button>
        </div>

        <div className="ticket-content">
          <div className="workspace-info">
            <h3>{ticket.workspaceNombre}</h3>
          </div>

          <div className="ticket-productos">
            <h4>Productos en la orden:</h4>
            <div className="productos-carrito">
              {ticket.productos.map((producto, index) => (
                <div key={index} className="carrito-item">
                  <div className="item-info">
                    <h4>{producto.productoNombre}</h4>
                    <div className="item-details">
                      <span className="cantidad">
                        {producto.cantidadPz > 0 && `${producto.cantidadPz} piezas`}
                        {producto.cantidadKg > 0 && `${producto.cantidadKg} kg`}
                      </span>
                      <span className="precio-unitario">
                        ${producto.precioUnitario.toFixed(2)} c/u
                      </span>
                    </div>
                  </div>
                  <div className="item-total">
                    ${producto.totalPorProducto.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="ticket-total">
              <div className="total-line">
                <span className="total-label">Total a pagar:</span>
                <span className="total-amount">${ticket.totalGeneral.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="ticket-acciones">
            {!mostrarModalPago ? (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={onCerrar}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setMostrarModalPago(true)}
                  disabled={isLoading}
                >
                  Procesar Pago
                </button>
              </>
            ) : (
              <div className="modal-pago">
                <h4>Seleccionar Método de Pago</h4>
                <select 
                  value={metodoPagoSeleccionado} 
                  onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
                  disabled={isLoading}
                >
                  {metodosPago.map(metodo => (
                    <option key={metodo.id} value={metodo.id}>
                      {metodo.metodoPago}
                    </option>
                  ))}
                </select>
                
                <div className="modal-pago-acciones">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setMostrarModalPago(false)}
                    disabled={isLoading}
                  >
                    Volver
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={confirmarPago}
                    disabled={isLoading || !metodoPagoSeleccionado}
                  >
                    {isLoading ? 'Procesando...' : 'Confirmar Pago'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketVenta;
