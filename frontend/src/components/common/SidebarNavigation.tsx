import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  LayoutGrid,
  Package, 
  Users, 
  LogOut, 
  Menu,
  Armchair
} from 'lucide-react';
import './SidebarNavigation.css';

interface SidebarNavigationProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
  onLogout?: () => void;
}

interface NavigationButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiresAdmin?: boolean;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ 
  activeSection = '', 
  onNavigate = () => {}, 
  onLogout 
}) => {
  const { logout, isAdmin, isEmployee } = useAuth();

  // Manejar logout por defecto si no se proporciona
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  // Definir botones de navegación disponibles según el rol
  const navigationButtons: NavigationButton[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />
    },
    {
      id: 'workspaces',
      label: 'Mesas',
      icon: <Armchair className="w-5 h-5 md:w-6 md:h-6" />
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: <Package className="w-5 h-5 md:w-6 md:h-6" />,
      requiresAdmin: true
    },
    {
      id: 'personal',
      label: 'Personal',
      icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
      requiresAdmin: true
    }
  ];

  // Filtrar botones según permisos del usuario
  const getVisibleButtons = () => {
    if (isAdmin()) {
      return navigationButtons; // Administradores ven todos los botones
    } else if (isEmployee()) {
      // Empleados solo ven Home (pueden acceder al POS desde ahí)
      return navigationButtons.filter(button => !button.requiresAdmin);
    }
    return navigationButtons.filter(button => !button.requiresAdmin);
  };

  const visibleButtons = getVisibleButtons();

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-nav__content">
        {/* Logo/Icono Principal */}
        <div className="sidebar-nav__logo">
          <div className="sidebar-nav__logo-icon">
            <Menu className="w-6 h-6 md:w-7 md:h-7" />
          </div>
        </div>
        
        {/* Menú Principal */}
        <nav className="sidebar-nav__menu">
          {visibleButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => onNavigate(button.id)}
              className={`sidebar-nav__button ${
                activeSection === button.id ? 'sidebar-nav__button--active' : ''
              }`}
              title={button.label}
            >
              <div className="sidebar-nav__button-icon">
                {button.icon}
              </div>
              <span className="sidebar-nav__button-label">
                {button.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Botón de Salir */}
      <div className="sidebar-nav__footer">
        <button
          onClick={handleLogout}
          className="sidebar-nav__button sidebar-nav__button--logout"
          title="Cerrar Sesión"
        >
          <div className="sidebar-nav__button-icon">
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="sidebar-nav__button-label">
            Salir
          </span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarNavigation;