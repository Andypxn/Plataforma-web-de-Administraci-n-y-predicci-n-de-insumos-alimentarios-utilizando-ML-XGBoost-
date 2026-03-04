import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { inventarioService } from '@/features/inventory/services/inventarioService';
import { comprasService } from '@/features/pos/services/comprasService';
import { metodoPagoService } from '@/services/apiService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { ProductoDTO } from '@/features/inventory/services/inventarioService';
import type { 
  ItemCarritoCompra, 
  Proveedor, 
  PagoRequest, 
  MetodoPago 
} from '@/types';
import './PuntoDeCompras.css';

interface PuntoDeComprasProps {
  proveedor: Proveedor;
  onBackToProveedores: () => void;
}

const PuntoDeCompras: React.FC<PuntoDeComprasProps> = ({ 
  proveedor, 
  onBackToProveedores 
}) => {
  // Hooks
  const toast = useToast();
  const { usuario } = useAuth();

  // Estados principales
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [carrito, setCarrito] = useState<ItemCarritoCompra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para selección
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(0);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);

  // Estados para finalización
  const [mostrarResumenCompra, setMostrarResumenCompra] = useState(false);
  const [pagoInmediato, setPagoInmediato] = useState(false);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('');
  const [montoPago, setMontoPago] = useState<number>(0);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🔄 [PuntoDeCompras] Iniciando carga datos para compras');
        console.log('🔄 [PuntoDeCompras] Proveedor seleccionado:', proveedor);

        console.log('⏳ [PuntoDeCompras] Cargando productos del proveedor...');
        // Cargar todos los productos y filtrar por proveedor
        const todosLosProductos = await inventarioService.getAllProductos();
        console.log('📦 [PuntoDeCompras] Todos los productos cargados:', todosLosProductos.length);
        const productosData = todosLosProductos.filter(p => p.proveedorId === proveedor.id);
        console.log('✅ [PuntoDeCompras] Productos del proveedor cargados:', productosData.length, 'de', todosLosProductos.length, 'totales');

        console.log('⏳ [PuntoDeCompras] Cargando métodos de pago...');
        const metodosData = await metodoPagoService.getAll();
        console.log('✅ [PuntoDeCompras] Métodos de pago cargados:', metodosData.length);

        console.log('💾 [PuntoDeCompras] Guardando datos en estado...');
        setProductos(productosData);
        setMetodosPago(metodosData);

        console.log('✅ [PuntoDeCompras] Todos los datos cargados correctamente');
        setError(null);
      } catch (error) {
        console.error('❌ [PuntoDeCompras] Error cargando datos:', error);
        if (axios.isAxiosError(error)) {
          console.error('❌ [PuntoDeCompras] Axios Error Details:');
          console.error('- Status:', error.response?.status);
          console.error('- StatusText:', error.response?.statusText);
          console.error('- URL:', error.config?.url);
          console.error('- Data:', error.response?.data);
        }
        const errorMessage = `Error al cargar datos del sistema: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        console.error('❌ [PuntoDeCompras] Error message:', errorMessage);
        setError(errorMessage);
        toast.showError('Error al cargar los datos del sistema');
      } finally {
        console.log('🏁 [PuntoDeCompras] Finalizando carga de datos - setIsLoading(false)');
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [proveedor.id]); // Solo proveedor.id como dependencia

  // Obtener precio automático cuando se selecciona un producto
  useEffect(() => {
    const obtenerPrecioAutomatico = async () => {
      if (!productoSeleccionado) {
        setCostoUnitario(0);
        return;
      }

      try {
        console.log('🔄 [PuntoDeCompras] Obteniendo último precio para producto:', productoSeleccionado);
        const ultimoPrecio = await comprasService.obtenerUltimoPrecioCompra(productoSeleccionado);
        
        if (ultimoPrecio && ultimoPrecio.costo > 0) {
          console.log('✅ [PuntoDeCompras] Precio automático encontrado:', ultimoPrecio.costo);
          setCostoUnitario(ultimoPrecio.costo);
          toast.showInfo(`Precio automático cargado: $${ultimoPrecio.costo.toFixed(2)}`);
        } else {
          console.log('⚠️ [PuntoDeCompras] No hay historial de precios, manteniendo costo en 0');
          setCostoUnitario(0);
        }
      } catch (error) {
        console.error('❌ [PuntoDeCompras] Error obteniendo precio automático:', error);
        setCostoUnitario(0);
      }
    };

    obtenerPrecioAutomatico();
  }, [productoSeleccionado]);

  // Calcular total del carrito
  const calcularTotal = (): number => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  };

  // Limpiar formulario de producto
  const limpiarFormulario = () => {
    setProductoSeleccionado('');
    setCantidad(0);
    setCostoUnitario(0);
  };

  // Agregar producto al carrito
  const agregarAlCarrito = () => {
    if (!productoSeleccionado) {
      toast.showError('Debe seleccionar un producto');
      return;
    }

    if (cantidad <= 0) {
      toast.showError('Debe especificar una cantidad mayor a 0');
      return;
    }

    if (costoUnitario < 0) {
      toast.showError('El costo unitario no puede ser negativo');
      return;
    }

    const producto = productos.find(p => p.id === productoSeleccionado);
    if (!producto) {
      toast.showError('Producto no encontrado');
      return;
    }

    const subtotal = cantidad * costoUnitario;

    // Detectar automáticamente la unidad: buscar item existente en el carrito
    const itemExistenteKg = carrito.find(item => 
      item.productoId === productoSeleccionado && item.cantidadKg > 0
    );
    const itemExistentePz = carrito.find(item => 
      item.productoId === productoSeleccionado && item.cantidadPz > 0
    );

    // Determinar la unidad automáticamente
    let unidadDetectada: 'kg' | 'pz';
    if (itemExistenteKg && !itemExistentePz) {
      unidadDetectada = 'kg';
    } else if (itemExistentePz && !itemExistenteKg) {
      unidadDetectada = 'pz';
    } else {
      // Si no hay items existentes o hay conflicto, usar piezas por defecto
      unidadDetectada = 'pz';
    }
    
    // Verificar si el producto ya está en el carrito con la unidad detectada
    const indiceExistente = carrito.findIndex(item => 
      item.productoId === productoSeleccionado && 
      ((unidadDetectada === 'kg' && item.cantidadKg > 0) || (unidadDetectada === 'pz' && item.cantidadPz > 0))
    );
    
    if (indiceExistente >= 0) {
      // Actualizar item existente
      const carritoActualizado = [...carrito];
      if (unidadDetectada === 'kg') {
        carritoActualizado[indiceExistente] = {
          ...carritoActualizado[indiceExistente],
          cantidadKg: carritoActualizado[indiceExistente].cantidadKg + cantidad,
          costoUnitarioKg: costoUnitario,
          subtotal: carritoActualizado[indiceExistente].subtotal + subtotal
        };
      } else {
        carritoActualizado[indiceExistente] = {
          ...carritoActualizado[indiceExistente],
          cantidadPz: carritoActualizado[indiceExistente].cantidadPz + cantidad,
          costoUnitarioPz: costoUnitario,
          subtotal: carritoActualizado[indiceExistente].subtotal + subtotal
        };
      }
      setCarrito(carritoActualizado);
    } else {
      // Agregar nuevo item
      const nuevoItem: ItemCarritoCompra = {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidadKg: unidadDetectada === 'kg' ? cantidad : 0,
        cantidadPz: unidadDetectada === 'pz' ? cantidad : 0,
        costoUnitarioKg: unidadDetectada === 'kg' ? costoUnitario : 0,
        costoUnitarioPz: unidadDetectada === 'pz' ? costoUnitario : 0,
        subtotal
      };
      setCarrito([...carrito, nuevoItem]);
    }

    // Mostrar mensaje indicando la unidad utilizada
    toast.showSuccess(`Producto agregado al carrito (${unidadDetectada === 'kg' ? 'Kilogramos' : 'Piezas'})`);
    limpiarFormulario();
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (index: number) => {
    const carritoActualizado = carrito.filter((_, i) => i !== index);
    setCarrito(carritoActualizado);
    toast.showInfo('Producto eliminado del carrito');
  };

  // Crear compra
  const crearCompra = async () => {
    if (carrito.length === 0) {
      toast.showError('El carrito está vacío');
      return;
    }

    if (!usuario) {
      toast.showError('Error de autenticación');
      return;
    }

    setIsSaving(true);
    try {
      // Crear una sola compra con todos los productos del carrito
      const compraRequest = {
        proveedorId: proveedor.id,
        metodoPagoId: metodoPagoSeleccionado || "1", // Efectivo por defecto
        productos: carrito.map(item => ({
          productoId: item.productoId,
          cantidadKg: item.cantidadKg,
          cantidadPz: item.cantidadPz
        }))
      };

      const ordenCreada = await comprasService.crearCompra(compraRequest);

      toast.showSuccess('Compra registrada exitosamente');

      // Si hay pago inmediato, procesarlo con el ID de la orden creada
      if (pagoInmediato && montoPago > 0 && metodoPagoSeleccionado) {
        await procesarPago(ordenCreada.id);
      }

      // Limpiar carrito y volver
      setCarrito([]);
      setMostrarResumenCompra(false);
      
    } catch (error) {
      console.error('❌ Error creando compra:', error);
      toast.showError('Error al registrar la compra');
    } finally {
      setIsSaving(false);
    }
  };

  // Procesar pago
  const procesarPago = async (ordenCompraId: string) => {
    if (!usuario || !metodoPagoSeleccionado || montoPago <= 0) {
      toast.showError('Datos de pago incompletos');
      return;
    }

    try {
      const pagoRequest: PagoRequest = {
        proveedorId: proveedor.id,
        ordenCompraId,
        montoPagado: montoPago,
        metodoPagoId: metodoPagoSeleccionado,
        pagarTodoElTotal: false
      };

      await comprasService.registrarPago(pagoRequest);
      toast.showSuccess(`Pago de $${montoPago.toFixed(2)} registrado exitosamente`);
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      toast.showError('Error al procesar el pago');
    }
  };

  if (isLoading) {
    console.log('🔄 [PuntoDeCompras] Renderizando loading spinner...');
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Cargando datos del sistema...</p>
      </div>
    );
  }

  if (error) {
    console.log('❌ [PuntoDeCompras] Renderizando pantalla de error:', error);
    return (
      <div className="punto-compras">
        <div className="error-container">
          <h2>Error del Sistema</h2>
          <p>{error}</p>
          <button onClick={onBackToProveedores} className="btn-back">
            Volver a Proveedores
          </button>
        </div>
      </div>
    );
  }

  if (mostrarResumenCompra) {
    const total = calcularTotal();
    
    return (
      <div className="punto-compras">
        <div className="resumen-compra-container">
          <div className="resumen-header">
            <h2>Resumen de Compra</h2>
            <p className="proveedor-info">
              Proveedor: <strong>{proveedor.nombreCompleto}</strong>
              {proveedor.deudaTotal > 0 && (
                <span className="deuda-actual">
                  (Deuda actual: ${proveedor.deudaTotal.toFixed(2)})
                </span>
              )}
            </p>
          </div>

          <div className="productos-resumen">
            <h3>Productos a Comprar</h3>
            <div className="productos-lista">
              {carrito.map((item, index) => (
                <div key={index} className="producto-resumen-item">
                  <div className="producto-info">
                    <h4>{item.productoNombre}</h4>
                    <div className="cantidades">
                      {item.cantidadKg > 0 && (
                        <span>Kg: {item.cantidadKg} × ${item.costoUnitarioKg.toFixed(2)}</span>
                      )}
                      {item.cantidadPz > 0 && (
                        <span>Pz: {item.cantidadPz} × ${item.costoUnitarioPz.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="subtotal">
                    ${item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="total-compra">
              <strong>Total de Compra: ${total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="pago-inmediato-section">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="pagoInmediato"
                checked={pagoInmediato}
                onChange={(e) => setPagoInmediato(e.target.checked)}
              />
              <label htmlFor="pagoInmediato">Realizar pago inmediato</label>
            </div>

            {pagoInmediato && (
              <div className="pago-form">
                <div className="form-group">
                  <label>Método de Pago:</label>
                  <select
                    value={metodoPagoSeleccionado}
                    onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar método</option>
                    {metodosPago.map(metodo => (
                      <option key={metodo.id} value={metodo.id}>
                        {metodo.metodoPago}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Monto del Pago:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoPago}
                    onChange={(e) => setMontoPago(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="acciones-resumen">
            <button
              onClick={() => setMostrarResumenCompra(false)}
              className="btn-cancelar"
              disabled={isSaving}
            >
              Modificar Compra
            </button>
            <button
              onClick={crearCompra}
              className="btn-confirmar"
              disabled={isSaving || (pagoInmediato && (!metodoPagoSeleccionado || montoPago <= 0))}
            >
              {isSaving ? 'Procesando...' : 'Confirmar Compra'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ [PuntoDeCompras] Renderizando pantalla principal de compras');
  console.log('📊 [PuntoDeCompras] Estado actual:', {
    productos: productos.length,
    metodosPago: metodosPago.length,
    carrito: carrito.length,
    isLoading,
    error
  });

  return (
    <div className="punto-compras">
      <div className="header-section">
        <div className="header-left">
          <button onClick={onBackToProveedores} className="btn-back">
            ← Volver a Proveedores
          </button>
          <div className="proveedor-info">
            <h2>Compra a: {proveedor.nombreCompleto}</h2>
            {proveedor.deudaTotal > 0 && (
              <p className="deuda-info warning">
                Deuda pendiente: <strong>${proveedor.deudaTotal.toFixed(2)}</strong>
              </p>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="carrito-resumen">
            <h3>Carrito: {carrito.length} productos</h3>
            <p className="total-carrito">${calcularTotal().toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="productos-section">
          <div className="agregar-producto-form">
            <div className="filtro-producto">
              <label>Producto:</label>
              <select
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="">Seleccionar producto</option>
                {productos.map(producto => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} - Stock: {producto.cantidadInventario || 0}
                  </option>
                ))}
              </select>
            </div>
            <div className="cantidades-costos">
              <div className="cantidad-grupo">
                <label>Cantidad:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <div className="costo-grupo">
                <label>Precio por unidad:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costoUnitario}
                  readOnly
                  placeholder="0.00"
                  className="readonly-field"
                />
              </div>
            </div>

            <button
              onClick={agregarAlCarrito}
              className="btn-agregar"
              disabled={!productoSeleccionado || cantidad <= 0}
            >
              Agregar al Carrito
            </button>
          </div>
        </div>

        <div className="carrito-section">
          <div className="carrito-header">
            <h3>Carrito de Compras</h3>
            <button
              onClick={() => setMostrarResumenCompra(true)}
              className="btn-finalizar"
              disabled={carrito.length === 0}
            >
              Finalizar Compra
            </button>
          </div>

          <div className="carrito-items">
            {carrito.length === 0 ? (
              <p className="carrito-vacio">El carrito está vacío</p>
            ) : (
              carrito.map((item, index) => (
                <div key={index} className="carrito-item">
                  <div className="item-info">
                    <h4>{item.productoNombre}</h4>
                     <div className="cantidades-info">
                       {item.cantidadKg > 0 && (
                         <span>Kg: {Number.isInteger(item.cantidadKg) ? item.cantidadKg : item.cantidadKg.toFixed(2)} × ${item.costoUnitarioKg.toFixed(2)}</span>
                       )}
                       {item.cantidadPz > 0 && (
                         <span>Pz: {Number.isInteger(item.cantidadPz) ? item.cantidadPz : item.cantidadPz.toFixed(2)} × ${item.costoUnitarioPz.toFixed(2)}</span>
                       )}
                     </div>                  </div>
                  <div className="item-total">
                    <span className="subtotal">${item.subtotal.toFixed(2)}</span>
                    <button
                      onClick={() => eliminarDelCarrito(index)}
                      className="btn-eliminar"
                      aria-label="Eliminar producto"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {carrito.length > 0 && (
            <div className="carrito-total">
              <strong>Total: ${calcularTotal().toFixed(2)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuntoDeCompras;