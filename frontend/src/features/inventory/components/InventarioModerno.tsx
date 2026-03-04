import React, { useState, useEffect } from 'react';
import { inventarioService } from '@/features/inventory/services/inventarioService';
import type { 
  InventarioDTO, 
  ProductoDTO, 
  UbicacionDTO, 
  CategoriaDTO, 
  ProveedorDTO,
  ProductoCreacionRequest 
} from '@/features/inventory/services/inventarioService';
import './InventarioModerno.css';

interface InventarioModernoProps {
  usuarioId?: string; // Para los movimientos de inventario
}

const InventarioModerno: React.FC<InventarioModernoProps> = ({ usuarioId = "default-user-id" }) => {
  // Estados principales
  const [inventarios, setInventarios] = useState<InventarioDTO[]>([]);
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del modal de creación de producto
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<ProductoCreacionRequest>({
    nombre: '',
    categoriasProductosId: '',
    proveedorId: '',
    precioVenta: 0,
    precioCompra: 0,
    unidadMedida: 'piezas',
    stockInicial: 0,
    ubicacionId: '',
    stockMinimo: 0,
    stockMaximo: 0,
    usuarioId: usuarioId
  });

  // Estados del modal de edición de producto (reserved for future use)
  // const [showEditModal, setShowEditModal] = useState(false);
  // const [editingProduct, setEditingProduct] = useState<ProductoDTO | null>(null);

  // Estado para vista de tabla
  const [viewMode, setViewMode] = useState<'productos' | 'inventario'>('productos');

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventariosData, productosData, ubicacionesData, categoriasData, proveedoresData] = await Promise.all([
        inventarioService.getAllInventarios(),
        inventarioService.getAllProductos(),
        inventarioService.getAllUbicaciones(),
        inventarioService.getAllCategorias(),
        inventarioService.getAllProveedores()
      ]);
      
      // Filtrar solo productos activos
      const productosActivos = productosData.filter(producto => 
        producto.estadosEstado?.toLowerCase() === 'activo'
      );
      
      setInventarios(inventariosData);
      setProductos(productosActivos);
      setUbicaciones(ubicacionesData);
      setCategorias(categoriasData);
      setProveedores(proveedoresData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario de creación
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['precioVenta', 'precioCompra', 'stockInicial', 'stockMinimo', 'stockMaximo'].includes(name) 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  // Crear nuevo producto completo
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.categoriasProductosId || !formData.proveedorId || !formData.ubicacionId) {
      setError('Todos los campos obligatorios deben ser completados');
      return;
    }

    try {
      await inventarioService.createProductoCompleto(formData);
      setShowCreateModal(false);
      resetForm();
      await loadData();
      setError(null);
    } catch (err) {
      setError('Error al crear el producto');
      console.error('Error creating product:', err);
    }
  };

  // Desactivar producto
  const handleDeactivateProduct = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este producto?')) {
      try {
        await inventarioService.desactivarProducto(productId);
        await loadData();
        setError(null);
      } catch (err) {
        setError('Error al desactivar el producto');
        console.error('Error deactivating product:', err);
      }
    }
  };

  // Abrir modal de edición
  const handleEditProduct = (product: ProductoDTO) => {
    // TODO: Implement edit modal
    console.log('Editing product:', product);
    // setEditingProduct(product);
    // setShowEditModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      categoriasProductosId: '',
      proveedorId: '',
      precioVenta: 0,
      precioCompra: 0,
      unidadMedida: 'piezas',
      stockInicial: 0,
      ubicacionId: '',
      stockMinimo: 0,
      stockMaximo: 0,
      usuarioId: usuarioId
    });
  };

  // Cerrar modales
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
    setError(null);
  };

  // const handleCloseEditModal = () => {
  //   setShowEditModal(false);
  //   setEditingProduct(null);
  //   setError(null);
  // };

  if (loading) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner"></div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="inventory-modern">
      {/* Header */}
      <header className="inventory-header">
        <div className="inventory-header-content">
          <div className="inventory-title-section">
            <h1 className="inventory-title">Gestión de Inventario</h1>
            <p className="inventory-subtitle">
              {viewMode === 'productos' ? 'Administra tu catálogo de productos' : 'Controla las existencias de inventario'}
            </p>
          </div>
          
          <div className="inventory-actions">
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'productos' ? 'active' : ''}`}
                onClick={() => setViewMode('productos')}
              >
                Productos
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'inventario' ? 'active' : ''}`}
                onClick={() => setViewMode('inventario')}
              >
                Inventario
              </button>
            </div>
            
            <button 
              className="create-btn primary"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="btn-icon">+</span>
              Crear Nuevo Producto
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* Main Content */}
      <main className="inventory-content">
        {viewMode === 'productos' ? (
          <div className="products-view">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Precio Venta</th>
                    <th>Precio Compra</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <div className="product-info">
                          <span className="product-name">{producto.nombre}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">
                          {producto.categoriasProductosCategoria || 'Sin categoría'}
                        </span>
                      </td>
                      <td>
                        {producto.proveedorNombre} {producto.proveedorApellidoPaterno}
                      </td>
                      <td>
                        <span className="price">
                          ${producto.precioVentaActual?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td>
                        <span className="price">
                          ${producto.precioCompraActual?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td>
                        <span className={`stock ${(producto.cantidadInventario || 0) < 10 ? 'low' : ''}`}>
                          {producto.cantidadInventario || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${producto.estadosEstado?.toLowerCase()}`}>
                          {producto.estadosEstado || 'Desconocido'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => handleEditProduct(producto)}
                            title="Editar producto"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeactivateProduct(producto.id)}
                            title="Desactivar producto"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="inventory-view">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Ubicación</th>
                    <th>Cantidad (Pz)</th>
                    <th>Cantidad (Kg)</th>
                    <th>Stock Mínimo</th>
                    <th>Stock Máximo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarios.map((inventario) => (
                    <tr key={inventario.id}>
                      <td>{inventario.productoNombre}</td>
                      <td>{inventario.ubicacionNombre}</td>
                      <td>
                        <span className={`stock ${(inventario.cantidadPz || 0) < inventario.cantidadMinima ? 'low' : ''}`}>
                          {inventario.cantidadPz || 0}
                        </span>
                      </td>
                      <td>{inventario.cantidadKg || 0}</td>
                      <td>{inventario.cantidadMinima}</td>
                      <td>{inventario.cantidadMaxima}</td>
                      <td>
                        <span className={`status-indicator ${
                          (inventario.cantidadPz || 0) < inventario.cantidadMinima ? 'low' : 
                          (inventario.cantidadPz || 0) > inventario.cantidadMaxima ? 'high' : 'normal'
                        }`}>
                          {(inventario.cantidadPz || 0) < inventario.cantidadMinima ? 'Bajo' : 
                           (inventario.cantidadPz || 0) > inventario.cantidadMaxima ? 'Alto' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Creación de Producto */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Producto</h2>
              <button className="modal-close" onClick={handleCloseCreateModal}>×</button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre del Producto *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Ingresa el nombre del producto"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="categoriasProductosId">Categoría *</label>
                  <select
                    id="categoriasProductosId"
                    name="categoriasProductosId"
                    value={formData.categoriasProductosId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="proveedorId">Proveedor *</label>
                  <select
                    id="proveedorId"
                    name="proveedorId"
                    value={formData.proveedorId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona un proveedor</option>
                    {proveedores.map(proveedor => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre} {proveedor.apellidoPaterno}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="precioVenta">Precio de Venta *</label>
                  <input
                    type="number"
                    id="precioVenta"
                    name="precioVenta"
                    value={formData.precioVenta}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="precioCompra">Precio de Compra *</label>
                  <input
                    type="number"
                    id="precioCompra"
                    name="precioCompra"
                    value={formData.precioCompra}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="unidadMedida">Unidad de Medida *</label>
                  <select
                    id="unidadMedida"
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="piezas">Piezas</option>
                    <option value="kilogramos">Kilogramos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="stockInicial">Stock Inicial *</label>
                  <input
                    type="number"
                    id="stockInicial"
                    name="stockInicial"
                    value={formData.stockInicial}
                    onChange={handleInputChange}
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ubicacionId">Ubicación Inicial *</label>
                  <select
                    id="ubicacionId"
                    name="ubicacionId"
                    value={formData.ubicacionId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona una ubicación</option>
                    {ubicaciones.map(ubicacion => (
                      <option key={ubicacion.id} value={ubicacion.id}>
                        {ubicacion.nombre} - {ubicacion.ubicacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="stockMinimo">Stock Mínimo *</label>
                  <input
                    type="number"
                    id="stockMinimo"
                    name="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={handleInputChange}
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stockMaximo">Stock Máximo *</label>
                  <input
                    type="number"
                    id="stockMaximo"
                    name="stockMaximo"
                    value={formData.stockMaximo}
                    onChange={handleInputChange}
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={handleCloseCreateModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  Crear Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioModerno;
