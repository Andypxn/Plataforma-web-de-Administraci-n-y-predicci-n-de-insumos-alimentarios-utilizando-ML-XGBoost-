import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, 
  Users, 
  LineChart,
  LogOut, 
  Search, 
  Package,
  Menu,
  LayoutGrid,
  Plus,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import './InventarioModernoNew.css';
import { inventarioService } from '@/features/inventory/services/inventarioService';
import { stockService } from '@/features/inventory/services/stockService';
import { useToast } from '@/hooks/useToast';
import ModalCrearProducto from './ModalCrearProducto';
import ModalEditarProducto from './ModalEditarProducto';
import ModalPredicciones from './ModalPredicciones';
import type { ProductoDTO } from '@/features/inventory/services/inventarioService';
import type { ProductoStockBajo } from '@/types/index';

interface InventarioModernoNewProps {
  onNavigateToCompras?: () => void;
  onNavigate?: (section: string) => void;
}

const InventarioModernoNew: React.FC<InventarioModernoNewProps> = ({ onNavigateToCompras, onNavigate }) => {
  // Estados principales
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      // Filtrar solo productos activos
      const productosActivos = productosData.filter(producto => 
        producto.estadosEstado?.toLowerCase() === 'activo'
      );
      setProductos(productosActivos);
      setError(null);
      
      // Verificar stock después de cargar productos
      verificarStockBajo(productosActivos);
      
    } catch (err) {
      setError('Error al cargar los productos');
      console.error('Error loading productos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar stock bajo y mostrar alertas
  const verificarStockBajo = useCallback((productosParaVerificar?: ProductoDTO[]) => {
    const productosActuales = productosParaVerificar || productos;
    
    // No verificar si no hay productos o ya se verificó en esta sesión
    if (productosActuales.length === 0 || stockVerificado) {
      return;
    }

    console.log('🔍 Verificando stock bajo para', productosActuales.length, 'productos');

    // Usar el servicio de stock para verificar
    const resultado = stockService.verificarStockBajo(productosActuales);

    if (resultado.tieneProductosBajos) {
      console.log('⚠️ Stock bajo detectado:', {
        criticos: resultado.cantidadProductosCriticos,
        bajos: resultado.cantidadProductosBajos
      });

      // Filtrar productos que pueden generar alertas (considerando throttle)
      const productosParaAlertar = stockService.obtenerProductosParaAlertar(resultado.productosBajos);
      
      if (productosParaAlertar.length > 0) {
        mostrarAlertasStock(productosParaAlertar);
      } else {
        console.log('🕒 Alertas de stock en throttle, no mostrando alertas');
      }
    } else {
      console.log('✅ Todos los productos tienen stock suficiente');
    }

    // Marcar como verificado para esta sesión
    setStockVerificado(true);
  }, [productos, stockVerificado, toast]);

  // Función para mostrar alertas de stock
  const mostrarAlertasStock = (productosConStockBajo: ProductoStockBajo[]) => {
    const tipoAlerta = stockService.determinarTipoAlerta(productosConStockBajo);
    
    if (tipoAlerta === 'agrupada') {
      // Mostrar alerta agrupada para múltiples productos
      toast.showMultipleStockWarning(
        productosConStockBajo.map(p => ({ nombre: p.nombre, cantidad: p.cantidadActual }))
      );
      
      console.log('🚨 Alerta agrupada mostrada para', productosConStockBajo.length, 'productos');
    } else {
      // Mostrar alertas individuales
      productosConStockBajo.forEach((producto, index) => {
        // Agregar pequeño delay entre alertas para evitar superposición
        setTimeout(() => {
          toast.showStockWarning(producto.nombre, producto.cantidadActual);
          console.log(`🚨 Alerta individual mostrada para: ${producto.nombre} (${producto.cantidadActual} unidades)`);
        }, index * 300); // 300ms entre cada alerta
      });
    }
  };

  // Abrir modal para crear nuevo producto
  const handleCrearNuevo = () => {
    setShowCreateModal(true);
  };

  // Navegar a compras a proveedores
  const handleComprarProducto = () => {
    console.log('🛒 Botón Comprar Producto clickeado!');
    console.log('onNavigateToCompras:', onNavigateToCompras);
    if (onNavigateToCompras) {
      onNavigateToCompras();
    } else {
      console.warn('onNavigateToCompras no está definido');
    }
  };

  // Abrir modal para editar producto
  const handleEditarProducto = (producto: ProductoDTO) => {
    setSelectedProduct(producto);
    setShowEditModal(true);
  };

  // Desactivar producto (eliminar)
  const handleEliminarProducto = async (id: string, nombre: string) => {
    console.log('🚀 handleEliminarProducto called with:', { id, nombre });
    
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}"?`)) {
      console.log('✅ User confirmed deletion');
      try {
        console.log('🔄 Calling inventarioService.desactivarProducto...');
        const result = await inventarioService.desactivarProducto(id);
        console.log('✅ Deletion successful:', result);
        
        console.log('🔄 Reloading products...');
        await loadProductos(); // Recargar datos
        console.log('✅ Products reloaded');
        setError(null);
      } catch (err) {
        console.error('❌ Error deleting product:', err);
        setError('Error al eliminar el producto');
      }
    } else {
      console.log('❌ User cancelled deletion');
    }
  };

  // Manejar éxito en creación/edición
  const handleModalSuccess = () => {
    // Resetear verificación de stock para permitir nuevas alertas
    setStockVerificado(false);
    loadProductos();
  };

  // Abrir modal de predicciones ML
  const handleShowPredictions = () => {
    setShowPredictionsModal(true);
  };

  // Manejar creación de orden de compra desde predicciones
  const handleCreatePurchaseOrder = (productosSeleccionados: any[]) => {
    console.log('🛒 Creando orden de compra con productos:', productosSeleccionados);
    
    // Aquí podrías mostrar un mensaje de éxito o redirigir
    alert(`Orden de compra creada para ${productosSeleccionados.length} productos`);
    
    // Opcionalmente navegar a la sección de compras
    if (onNavigateToCompras) {
      onNavigateToCompras();
    }
  };

  // Función para formatear precio
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // Función auxiliar para los badges de estado basado en stock
  const getStatusBadge = (cantidadInventario: number | undefined, estadosEstado: string | undefined) => {
    const cantidad = cantidadInventario || 0;
    
    if (estadosEstado?.toLowerCase() === 'inactivo') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">Inactivo</span>;
    }
    
    if (cantidad === 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">Agotado</span>;
    } else if (cantidad <= 10) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Bajo</span>;
    } else if (cantidad <= 50) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-200">Medio</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 border border-green-200">En Stock</span>;
    }
  };

  // Función para manejar navegación desde sidebar
  const handleNavigation = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 font-sans text-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 font-sans text-gray-800 flex flex-row overflow-hidden">
      
      {/* --- SIDEBAR LATERAL (Actualizado: Inventario Activo) --- */}
      <aside className="flex flex-col w-20 md:w-24 bg-white border-r border-gray-200 py-8 items-center justify-between z-20 h-full flex-shrink-0 shadow-sm">
        <div className="flex flex-col gap-10 items-center w-full">
          {/* Logo */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
            <Menu className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          
          {/* Menú Principal */}
          <nav className="flex flex-col gap-6 w-full px-2 md:px-4 items-center">
            {/* Home (Inactivo) */}
            <button 
              onClick={() => handleNavigation('workspaces')}
              className="flex flex-col items-center gap-1 p-2 md:p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all w-full md:w-auto"
            >
              <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-[10px] font-medium">Home</span>
            </button>
            
            {/* Inventario (ACTIVO - Naranja) */}
            <button className="flex flex-col items-center gap-1 p-2 md:p-3 bg-orange-50 text-orange-600 rounded-2xl transition-all shadow-sm w-full md:w-auto ring-1 ring-orange-100">
              <Package className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-[10px] font-bold">Inventario</span>
            </button>
            
            {/* Personal (Inactivo) */}
            <button 
              onClick={() => handleNavigation('empleados')}
              className="flex flex-col items-center gap-1 p-2 md:p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all w-full md:w-auto"
            >
              <Users className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-[10px] font-medium">Personal</span>
            </button>
          </nav>
        </div>

        <button 
          onClick={() => handleNavigation('logout')}
          className="flex flex-col items-center gap-1 p-2 md:p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all mb-4 w-full md:w-auto"
        >
          <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          <span className="text-[9px] md:text-[10px] font-medium">Salir</span>
        </button>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50">
        
        {/* Header Superior */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Gestión de Inventario</h1>
            <p className="text-gray-500 text-sm mt-1">Administra tus productos, precios y stock en tiempo real.</p>
          </div>
          
          {/* Barra de Búsqueda Rápida */}
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm text-sm pl-12"
              placeholder="Buscar producto, categoría o SKU..."
            />
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            {error}
          </div>
        )}

        {/* --- GRID DE ACCIONES PRINCIPALES (Los 3 Botones Solicitados) --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          
          {/* 1. Crear Nuevo Producto */}
          <button 
            onClick={handleCrearNuevo}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-[1.5rem] shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-row items-center justify-between group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex flex-col items-start gap-1 z-10">
              <span className="bg-white/20 p-2 rounded-xl mb-1 group-hover:bg-white/30 transition-colors">
                <Plus className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold">Nuevo Producto</h3>
              <p className="text-orange-100 text-xs font-medium">Agregar al catálogo</p>
            </div>
            <div className="bg-white/20 p-2 rounded-full z-10">
               <Package className="w-8 h-8 opacity-80" />
            </div>
          </button>

          {/* 2. Comprar Productos (Purchase Order) */}
          <button 
            onClick={handleComprarProducto}
            className="bg-white text-gray-800 p-6 rounded-[1.5rem] border border-gray-200 shadow-sm hover:border-yellow-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-row items-center justify-between group"
          >
             <div className="flex flex-col items-start gap-1">
              <span className="bg-yellow-50 text-yellow-600 p-2 rounded-xl mb-1 group-hover:bg-yellow-100 transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold">Realizar Compra</h3>
              <p className="text-gray-400 text-xs font-medium">Reabastecer stock</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-full group-hover:bg-yellow-50 transition-colors">
               <ShoppingBag className="w-6 h-6 text-gray-300 group-hover:text-yellow-500" />
            </div>
          </button>

          {/* 3. Predicciones ML (Smart Feature) */}
          <button 
            onClick={handleShowPredictions}
            className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-6 rounded-[1.5rem] shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-row items-center justify-between group relative overflow-hidden"
          >
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-pink-500/30 rounded-full blur-xl pointer-events-none"></div>
             <div className="flex flex-col items-start gap-1 z-10">
              <span className="bg-white/20 p-2 rounded-xl mb-1 group-hover:bg-white/30 transition-colors">
                <Sparkles className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold">Predicciones IA</h3>
              <p className="text-indigo-100 text-xs font-medium">Análisis de compra</p>
            </div>
            <div className="bg-white/10 p-2 rounded-full z-10 backdrop-blur-sm">
               <LineChart className="w-8 h-8 text-white" />
            </div>
          </button>
        </section>

        {/* --- TABLA DE INVENTARIO --- */}
        <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-22rem)]">
          
          {/* Toolbar de la tabla */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
               Todos los Productos 
               <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-lg font-bold">
                 {filteredProductos.length}
               </span>
             </h3>
          </div>

          {/* Contenedor Scrollable (Sin paginación) */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                  <th className="p-5 pl-8">Producto</th>
                  <th className="p-5">Categoría</th>
                  <th className="p-5">Proveedor</th>
                  <th className="p-5">P. Compra</th>
                  <th className="p-5">P. Venta</th>
                  <th className="p-5 text-center">Stock</th>
                  <th className="p-5 text-center">Estado</th>
                  <th className="p-5 text-right pr-8">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProductos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50 transition-colors group">
                    {/* Producto */}
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl shadow-sm border border-orange-100">
                          📦
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{producto.nombre}</p>
                          <p className="text-xs text-gray-400">ID: #{producto.id.padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="p-5">
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                        {producto.categoriasProductosCategoria || 'Sin categoría'}
                      </span>
                    </td>

                    {/* Proveedor */}
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          {producto.proveedorNombre || 'Sin proveedor'}
                          {producto.proveedorApellidoPaterno && ` ${producto.proveedorApellidoPaterno}`}
                        </span>
                      </div>
                    </td>

                    {/* Precios */}
                    <td className="p-5 font-medium text-gray-500 text-sm">
                      {formatPrice(producto.precioCompraActual)}
                    </td>
                    <td className="p-5 font-bold text-gray-800 text-sm">
                      {formatPrice(producto.precioVentaActual)}
                    </td>

                    {/* Stock */}
                    <td className="p-5 text-center">
                      <span className="text-sm font-bold text-gray-700">
                        {producto.cantidadInventario || 0}
                      </span>
                      <span className="text-xs text-gray-400 block">unid.</span>
                    </td>

                    {/* Estado */}
                    <td className="p-5 text-center">
                      {getStatusBadge(producto.cantidadInventario, producto.estadosEstado)}
                    </td>

                    {/* ACCIONES (Editar y Eliminar - NO edición de stock) */}
                    <td className="p-5 text-right pr-8">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        
                        {/* 1. Editar */}
                        <button 
                          onClick={() => handleEditarProducto(producto)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Editar Producto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* 2. Eliminar */}
                        <button 
                          onClick={() => handleEliminarProducto(producto.id, producto.nombre)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProductos.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {searchQuery 
                    ? `No encontramos productos que coincidan con "${searchQuery}"`
                    : 'Comienza creando tu primer producto con el botón "Nuevo Producto"'
                  }
                </p>
                {!searchQuery && (
                  <button 
                    onClick={handleCrearNuevo}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Crear Primer Producto
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Modal para crear producto */}
      <ModalCrearProducto
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Modal para editar producto */}
      <ModalEditarProducto
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
        producto={selectedProduct}
      />

      {/* Modal para predicciones ML */}
      <ModalPredicciones
        isOpen={showPredictionsModal}
        onClose={() => setShowPredictionsModal(false)}
        onCreatePurchaseOrder={handleCreatePurchaseOrder}
      />
    </div>
  );
};

export default InventarioModernoNew;