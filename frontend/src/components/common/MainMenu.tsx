import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import SidebarNavigation from './SidebarNavigation';
import { obtenerOrdenesRecientes } from '@/features/pos/services/ordenesService';
import type { OrdenVentaReciente } from '@/types/ordenes';
import { 
  Store, 
  Package, 
  Settings, 
  LineChart,
  ChevronRight
} from 'lucide-react';
import './MainMenu.css';

interface MainMenuProps {
  onPuntoDeVentaClick: () => void;
  onInventarioClick: () => void;
  onEmpleadosClick: () => void;
  onLogout: () => void;
  onNavigate?: (section: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onPuntoDeVentaClick, 
  onInventarioClick,
  onEmpleadosClick,
  onLogout,
  onNavigate 
}) => {
  const { getUserName, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [ordenesRecientes, setOrdenesRecientes] = useState<OrdenVentaReciente[]>([]);
  const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(true);

  // Cargar órdenes recientes al montar el componente
  useEffect(() => {
    const cargarOrdenesRecientes = async () => {
      try {
        setIsLoadingOrdenes(true);
        const ordenes = await obtenerOrdenesRecientes(5);
        setOrdenesRecientes(ordenes);
      } catch (error) {
        console.error('Error al cargar órdenes recientes:', error);
      } finally {
        setIsLoadingOrdenes(false);
      }
    };

    cargarOrdenesRecientes();
  }, []);

  // Función para manejar navegación desde la barra lateral
  const handleSidebarNavigation = (section: string) => {
    setActiveSection(section);
    
    // Si hay una función de navegación proporcionada, usarla
    if (onNavigate) {
      onNavigate(section);
      return;
    }
    
    // Fallback a navegación local para compatibilidad
    switch (section) {
      case 'inventario':
        onInventarioClick();
        break;
      case 'personal':
        onEmpleadosClick();
        break;
      case 'workspaces':
        onPuntoDeVentaClick();
        break;
      case 'home':
        // Permanecer en el dashboard principal
        break;
      default:
        console.warn('Sección no reconocida:', section);
    }
  };

  // Función para manejar clicks de los botones del dashboard
  const handleDashboardAction = (action: string) => {
    switch (action) {
      case 'nueva-venta':
        onPuntoDeVentaClick();
        break;
      case 'inventario':
        setActiveSection('inventario');
        onInventarioClick();
        break;
      case 'predicciones':
        // Navegar a inventario y abrir modal de predicciones
        setActiveSection('inventario');
        if (onNavigate) {
          onNavigate('inventario?openPredictions=true');
        } else {
          onInventarioClick();
        }
        break;
      case 'administracion':
        setActiveSection('personal');
        onEmpleadosClick();
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  };

  return (
    <div className="main-menu-new">
      {/* Barra Lateral de Navegación */}
      <SidebarNavigation 
        activeSection={activeSection}
        onNavigate={handleSidebarNavigation}
        onLogout={onLogout}
      />

      {/* Contenido Principal */}
      <main className="main-menu-new__content">
        
        {/* Header Superior */}
        <header className="main-menu-new__header">
          <div>
            <h1 className="main-menu-new__title">
              Hola, {getUserName() || 'Usuario'} 👋
            </h1>
          </div>
        </header>

        {/* Grid de Módulos (Dashboard) */}
        <section className="main-menu-new__dashboard">
          
          {/* Botón Principal: Nueva Venta */}
          <button 
            className="main-menu-new__primary-card"
            onClick={() => handleDashboardAction('nueva-venta')}
          >
            <div className="main-menu-new__primary-card-bg"></div>
            
            <div className="main-menu-new__primary-card-content">
              <div className="main-menu-new__primary-card-icon">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h2 className="main-menu-new__primary-card-title">Nueva Venta</h2>
            </div>
            
            <div className="main-menu-new__primary-card-arrow">
               <div className="main-menu-new__primary-card-arrow-icon">
                 <ChevronRight className="w-6 h-6" />
               </div>
            </div>
          </button>

          {/* Módulos Secundarios */}
          <div className="main-menu-new__secondary-grid">
            
            {/* Inventario */}
            <button 
              className="main-menu-new__card main-menu-new__card--inventory"
              onClick={() => handleDashboardAction('inventario')}
            >
              <div className="main-menu-new__card-icon main-menu-new__card-icon--blue">
                <Package className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <div className="main-menu-new__card-content">
                <h3 className="main-menu-new__card-title">Inventario</h3>
                <span className="main-menu-new__card-subtitle">Gestión Total</span>
              </div>
            </button>

            {/* Predicciones */}
            <button 
              className="main-menu-new__card main-menu-new__card--predictions"
              onClick={() => handleDashboardAction('predicciones')}
            >
              <div className="main-menu-new__card-icon main-menu-new__card-icon--purple">
                <LineChart className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="main-menu-new__card-title">Predicciones</h3>
              <span className="main-menu-new__card-subtitle">Ver Análisis</span>
            </button>

            {/* Administración */}
            {isAdmin() && (
              <button 
                className="main-menu-new__card main-menu-new__card--admin"
                onClick={() => handleDashboardAction('administracion')}
              >
                <div className="main-menu-new__card-icon main-menu-new__card-icon--gray">
                  <Settings className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="main-menu-new__card-title">Administración</h3>
              </button>
            )}

          </div>
        </section>

        {/* Lista de Actividad Reciente */}
        <section className="main-menu-new__activity">
          <div className="main-menu-new__activity-header">
            <h3 className="main-menu-new__activity-title">Actividad Reciente</h3>
          </div>
          
          <div className="main-menu-new__activity-table">
            <div className="main-menu-new__table-container">
              {isLoadingOrdenes ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Cargando actividad reciente...
                </div>
              ) : ordenesRecientes.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  No hay actividad reciente
                </div>
              ) : (
                <table className="main-menu-new__table">
                  <thead>
                    <tr className="main-menu-new__table-header">
                      <th className="main-menu-new__table-th">Usuario</th>
                      <th className="main-menu-new__table-th">Mesa</th>
                      <th className="main-menu-new__table-th">Hora</th>
                      <th className="main-menu-new__table-th main-menu-new__table-th--right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="main-menu-new__table-body">
                    {ordenesRecientes.map((orden) => (
                      <tr key={orden.id} className="main-menu-new__table-row">
                        <td className="main-menu-new__table-td">
                          <div className="main-menu-new__user-cell">
                             <div className="main-menu-new__user-avatar">
                               {orden.usuario.charAt(0).toUpperCase()}
                             </div>
                             <span className="main-menu-new__user-name">{orden.usuario}</span>
                          </div>
                        </td>
                        <td className="main-menu-new__table-td">
                          <span className={`main-menu-new__table-badge ${
                              orden.mesa === 'Delivery' ? 'main-menu-new__table-badge--purple' : 
                              orden.mesa === 'Barra' ? 'main-menu-new__table-badge--blue' : 
                              'main-menu-new__table-badge--gray'
                          }`}>
                              {orden.mesa || 'Sin especificar'}
                          </span>
                        </td>
                        <td className="main-menu-new__table-td main-menu-new__table-time">
                          {orden.hora}
                        </td>
                        <td className="main-menu-new__table-td main-menu-new__table-td--right main-menu-new__table-total">
                          {orden.totalFormateado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default MainMenu;