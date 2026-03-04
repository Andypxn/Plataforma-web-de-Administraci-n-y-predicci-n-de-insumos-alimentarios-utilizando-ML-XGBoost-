import React, { useState, useEffect, useCallback } from 'react';
import { 
  Edit3,
  Trash2
} from 'lucide-react';
import SidebarNavigation from '@/components/common/SidebarNavigation';
import { inventarioService } from '@/features/inventory/services/inventarioService';
import { stockService } from '@/features/inventory/services/stockService';
import { useToast } from '@/hooks/useToast';
import ModalCrearProducto from './ModalCrearProducto';
import ModalEditarProducto from './ModalEditarProducto';
import ModalPredicciones from './ModalPredicciones';
import type { ProductoDTO } from '@/features/inventory/services/inventarioService';
import type { ProductoStockBajo } from '@/types/index';
import './Inventario.css';

interface InventarioProps {
  onNavigateToCompras?: () => void;
  onNavigate?: (section: string) => void;
  openPredictions?: boolean; // Nuevo prop para abrir el modal automáticamente
}

const Inventario: React.FC<InventarioProps> = ({ onNavigateToCompras, onNavigate, openPredictions = false }) => {
  // Estados principales
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de los modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPredictionsModal, setShowPredictionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoDTO | null>(null);

  // Estados para alertas de stock
  const [stockVerificado, setStockVerificado] = useState(false);

  // Hook de toasts
  const toast = useToast();

  // Abrir modal de predicciones automáticamente si se recibe el parámetro
  useEffect(() => {
    if (openPredictions) {
      setShowPredictionsModal(true);
    }
  }, [openPredictions]);

  // Cargar datos iniciales
  useEffect(() => {
    loadProductos();
  }, []);

  // Filtrar productos en base a búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProductos(productos);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(query) ||
        producto.categoriasProductosCategoria?.toLowerCase().includes(query) ||
        producto.proveedorNombre?.toLowerCase().includes(query)
      );
      setFilteredProductos(filtered);
    }
  }, [productos, searchQuery]);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const productosData = await inventarioService.getAllProductos();
      const productosActivos = productosData.filter(producto => 
        producto.estadosEstado?.toLowerCase() === 'activo'
      );
      setProductos(productosActivos);
      verificarStockBajo(productosActivos);
    } catch (err) {
      console.error('Error loading productos:', err);
      toast.showError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const verificarStockBajo = useCallback((productosParaVerificar?: ProductoDTO[]) => {
    const productosActuales = productosParaVerificar || productos;
    
    if (productosActuales.length === 0 || stockVerificado) {
      return;
    }

    const resultado = stockService.verificarStockBajo(productosActuales);

    if (resultado.tieneProductosBajos) {
      const productosParaAlertar = stockService.obtenerProductosParaAlertar(resultado.productosBajos);
      
      if (productosParaAlertar.length > 0) {
        mostrarAlertasStock(productosParaAlertar);
      }
    }

    setStockVerificado(true);
  }, [productos, stockVerificado, toast]);

  const mostrarAlertasStock = (productosConStockBajo: ProductoStockBajo[]) => {
    const tipoAlerta = stockService.determinarTipoAlerta(productosConStockBajo);
    
    if (tipoAlerta === 'agrupada') {
      toast.showMultipleStockWarning(
        productosConStockBajo.map(p => ({ nombre: p.nombre, cantidad: p.cantidadActual }))
      );
    } else {
      productosConStockBajo.forEach((producto, index) => {
        setTimeout(() => {
          toast.showStockWarning(producto.nombre, producto.cantidadActual);
        }, index * 300);
      });
    }
  };

  const handleCrearNuevo = () => {
    setShowCreateModal(true);
  };

  const handleComprarProducto = () => {
    if (onNavigateToCompras) {
      onNavigateToCompras();
    }
  };

  const handleEditarProducto = (producto: ProductoDTO) => {
    setSelectedProduct(producto);
    setShowEditModal(true);
  };

  const handleEliminarProducto = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}"?`)) {
      try {
        await inventarioService.desactivarProducto(id);
        await loadProductos();
        toast.showSuccess('Producto eliminado correctamente');
      } catch (err) {
        console.error('Error deleting product:', err);
        toast.showError('Error al eliminar el producto');
      }
    }
  };

  const handleModalSuccess = () => {
    setStockVerificado(false);
    loadProductos();
  };

  const handleShowPredictions = () => {
    setShowPredictionsModal(true);
  };

  const handleCreatePurchaseOrder = (productosSeleccionados: any[]) => {
    alert(`Orden de compra creada para ${productosSeleccionados.length} productos`);
    
    if (onNavigateToCompras) {
      onNavigateToCompras();
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStatusBadge = (cantidadInventario: number | undefined, estadosEstado: string | undefined) => {
    const cantidad = cantidadInventario || 0;
    
    if (estadosEstado?.toLowerCase() === 'inactivo') {
      return <span className="inventario-status-badge inventario-status-badge--inactive">Inactivo</span>;
    }
    
    if (cantidad === 0) {
      return <span className="inventario-status-badge inventario-status-badge--out">Agotado</span>;
    } else if (cantidad <= 10) {
      return <span className="inventario-status-badge inventario-status-badge--low">Bajo</span>;
    } else if (cantidad <= 50) {
      return <span className="inventario-status-badge inventario-status-badge--warning">Medio</span>;
    } else {
      return <span className="inventario-status-badge inventario-status-badge--optimal">En Stock</span>;
    }
  };

  const handleNavigation = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  if (loading) {
    return (
      <div className="inventario-container">
        <SidebarNavigation activeSection="inventario" onNavigate={handleNavigation} />
        <main className="inventario-main">
          <div className="inventario-loading">
            <div className="inventario-loading__spinner"></div>
            <p className="inventario-loading__text">Cargando productos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      {/* Sidebar Navigation */}
      <SidebarNavigation activeSection="inventario" onNavigate={handleNavigation} />

      {/* Main Content Area - Ocupa el resto del espacio */}
      <main className="inventario-main">
        
        {/* Header Superior */}
        <header className="inventario-header">
          <div className="inventario-header__title-section">
            <h1 className="inventario-header__title">Gestión de Inventario</h1>
            <p className="inventario-header__subtitle">Administra tus productos, precios y stock en tiempo real.</p>
          </div>
          {/* Barra de búsqueda (Compacta y redonda) */}
          <div className="inventario-search">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto, categoría o SKU..." 
              className="inventario-search__input"
            />
            <span className="inventario-search__icon">🔍</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="inventario-content">
          
          {/* GRID DE TARJETAS SUPERIORES (KPIs) */}
          <div className="inventario-actions-grid">
            
            {/* Card 1: Nuevo Producto (Naranja) */}
            <div 
              onClick={handleCrearNuevo}
              className="inventario-action-card inventario-action-card--primary"
            >
              <div className="inventario-action-card__content">
                <div className="inventario-action-card__icon">➕</div>
                <div className="inventario-action-card__text">
                  <h3 className="inventario-action-card__title">Nuevo Producto</h3>
                  <p className="inventario-action-card__subtitle">Agregar al catálogo</p>
                </div>
              </div>
              {/* Decoración de fondo */}
              <div className="inventario-action-card__decoration">
                📦
              </div>
            </div>

            {/* Card 2: Realizar Compra (Blanco) */}
            <div 
              onClick={handleComprarProducto}
              className="inventario-action-card inventario-action-card--secondary"
            >
              <div className="inventario-action-card__content">
                <div className="inventario-action-card__icon">🛒</div>
                <div className="inventario-action-card__text">
                  <h3 className="inventario-action-card__title">Realizar Compra</h3>
                  <p className="inventario-action-card__subtitle">Reabastecer stock</p>
                </div>
              </div>
            </div>

            {/* Card 3: Predicciones IA (Gradiente Morado) */}
            <div 
              onClick={handleShowPredictions}
              className="inventario-action-card inventario-action-card--ai"
            >
              <div className="inventario-action-card__content">
                <div className="inventario-action-card__icon">✨</div>
                <div className="inventario-action-card__text">
                  <h3 className="inventario-action-card__title">Predicciones IA</h3>
                  <p className="inventario-action-card__subtitle">Análisis de compra</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE LA TABLA (CARD BLANCA FLOTANTE) */}
          <div className="inventario-table-card">
            <div className="inventario-table-card__header">
              <h2 className="inventario-table-card__title">Todos los Productos</h2>
              <span className="inventario-table-card__count">
                {filteredProductos.length}
              </span>
            </div>
            
            <div className="inventario-table-wrapper">
              <table className="inventario-table">
                <thead className="inventario-table__head">
                  <tr className="inventario-table__head-row">
                    <th className="inventario-table__th">Producto</th>
                    <th className="inventario-table__th">Categoría</th>
                    <th className="inventario-table__th">Proveedor</th>
                    <th className="inventario-table__th">P. Venta</th>
                    <th className="inventario-table__th">Stock</th>
                    <th className="inventario-table__th">Estado</th>
                    <th className="inventario-table__th inventario-table__th--right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="inventario-table__body">
                  {filteredProductos.map((producto) => (
                    <tr key={producto.id} className="inventario-table__row">
                      {/* Producto */}
                      <td className="inventario-table__td">
                        <div className="inventario-product">
                          <div className="inventario-product__image">
                            📦
                          </div>
                          <div className="inventario-product__info">
                            <p className="inventario-product__name">{producto.nombre}</p>
                            <p className="inventario-product__id">ID: #{producto.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="inventario-table__td">
                        <span className="inventario-category">
                          {producto.categoriasProductosCategoria || 'Sin categoría'}
                        </span>
                      </td>

                      {/* Proveedor */}
                      <td className="inventario-table__td">
                        <div className="inventario-supplier">
                          <span className="inventario-supplier__name">
                            {producto.proveedorNombre || 'Sin proveedor'}
                            {producto.proveedorApellidoPaterno && ` ${producto.proveedorApellidoPaterno}`}
                          </span>
                        </div>
                      </td>

                      {/* Precio Venta */}
                      <td className="inventario-table__td">
                        <span className="inventario-price">
                          {formatPrice(producto.precioVentaActual)}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="inventario-table__td">
                        <div className="inventario-stock">
                          <span className="inventario-stock__value">
                            {producto.cantidadInventario || 0}
                          </span>
                          <span className="inventario-stock__label">unidades</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="inventario-table__td">
                        {getStatusBadge(producto.cantidadInventario, producto.estadosEstado)}
                      </td>

                      {/* Acciones */}
                      <td className="inventario-table__td">
                        <div className="inventario-actions">
                          {/* Editar */}
                          <button 
                            onClick={() => handleEditarProducto(producto)}
                            className="inventario-action-btn inventario-action-btn--edit"
                            title="Editar Producto"
                          >
                            <Edit3 className="inventario-action-btn__icon" />
                          </button>

                          {/* Eliminar */}
                          <button 
                            onClick={() => handleEliminarProducto(producto.id, producto.nombre)}
                            className="inventario-action-btn inventario-action-btn--delete"
                            title="Eliminar"
                          >
                            <Trash2 className="inventario-action-btn__icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProductos.length === 0 && (
                <div className="inventario-empty">
                  <div className="inventario-empty__icon">
                    📦
                  </div>
                  <h3 className="inventario-empty__title">
                    {searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}
                  </h3>
                  <p className="inventario-empty__description">
                    {searchQuery 
                      ? `No encontramos productos que coincidan con "${searchQuery}"`
                      : 'Comienza creando tu primer producto con el botón "Nuevo Producto"'
                    }
                  </p>
                  {!searchQuery && (
                    <button 
                      onClick={handleCrearNuevo}
                      className="inventario-empty__btn"
                    >
                      Crear Primer Producto
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modales */}
      <ModalCrearProducto
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      <ModalEditarProducto
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
        producto={selectedProduct}
      />

      <ModalPredicciones
        isOpen={showPredictionsModal}
        onClose={() => setShowPredictionsModal(false)}
        onCreatePurchaseOrder={handleCreatePurchaseOrder}
      />
    </div>
  );
};

export default Inventario;
