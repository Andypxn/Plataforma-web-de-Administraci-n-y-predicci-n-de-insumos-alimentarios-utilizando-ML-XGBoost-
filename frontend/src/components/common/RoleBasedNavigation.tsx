import React from 'react';
import { useAuth } from '../hooks/useAuth';
import './RoleBasedNavigation.css';

interface RoleBasedNavigationProps {
  onNavigation: (view: string) => void;
}

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ onNavigation }) => {
  const { isAdmin, isEmployee, getUserRole, getUserName } = useAuth();

  // Definir botones disponibles según el rol
  const getAvailableButtons = () => {
    if (isAdmin()) {
      // Administradores ven todos los botones
      return [
        {
          id: 'pdv',
          title: 'Punto de Venta',
          description: 'Gestión de ventas y cobros',
          icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
              <path d="M9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
            </svg>
          ),
          variant: 'pos',
          action: () => onNavigation('pdv')
        },
        {
          id: 'inventario',
          title: 'Inventario',
          description: 'Gestión de productos y stock',
          icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12"/>
            </svg>
          ),
          variant: 'inventory',
          action: () => onNavigation('inventario')
        },
        {
          id: 'empleados',
          title: 'Administración',
          description: 'Gestión de empleados, proveedores y clientes',
          icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12C13.8 12 12 10.2 12 8S13.8 4 16 4ZM16 6C14.9 6 14 6.9 14 8S14.9 10 16 10C17.1 10 18 9.1 18 8S17.1 6 16 6ZM20 18V20H12V18C12 15.8 13.8 14 16 14S20 15.8 20 18ZM8 12C10.2 12 12 10.2 12 8S10.2 4 8 4C5.8 4 4 5.8 4 8S5.8 12 8 12ZM8 6C9.1 6 10 6.9 10 8S9.1 10 8 10C6.9 10 6 9.1 6 8S6.9 6 8 6ZM12 18V20H4V18C4 15.8 5.8 14 8 14S12 15.8 12 18Z"/>
            </svg>
          ),
          variant: 'employees',
          action: () => onNavigation('empleados')
        }
      ];
    } else if (isEmployee()) {
      // Empleados solo ven el Punto de Venta
      return [
        {
          id: 'pdv',
          title: 'Punto de Venta',
          description: 'Gestión de ventas y cobros',
          icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
              <path d="M9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
            </svg>
          ),
          variant: 'pos',
          action: () => onNavigation('pdv')
        }
      ];
    }

    // Sin rol definido - no mostrar botones
    return [];
  };

  const availableButtons = getAvailableButtons();
  const userName = getUserName();
  const userRole = getUserRole();

  return (
    <div className="role-based-navigation">
      {/* Header con información del usuario */}
      <div className="role-nav__welcome">
        <h2 className="md-headline-medium">
          ¡Bienvenido, {userName}!
        </h2>
        <p className="role-nav__welcome-subtitle md-body-large">
          Selecciona el módulo al que deseas acceder
        </p>
        <div className="role-nav__user-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9M21 11V9L15 8.5V11M21 12.5V11L15 10.5V12.5C15 13.3 14.3 14 13.5 14S12 13.3 12 12.5V3C12 2.4 11.6 2 11 2S10 2.4 10 3V12.5C10 13.3 9.3 14 8.5 14S7 13.3 7 12.5V10.5L1 11V12.5L7 13V12.5C7 14.4 8.6 16 10.5 16S14 14.4 14 12.5V13L21 12.5Z"/>
          </svg>
          {userRole}
        </div>
      </div>

      {/* Botones de navegación basados en rol */}
      {availableButtons.length > 0 ? (
        <div className="role-nav__grid">
          {availableButtons.map((button) => (
            <button
              key={button.id}
              onClick={button.action}
              className={`role-nav__card role-nav__card--${button.variant}`}
            >
              <div className="role-nav__card-icon">
                {button.icon}
              </div>
              
              <div className="role-nav__card-content">
                <h3 className="md-title-large">{button.title}</h3>
                <p className="md-body-medium">{button.description}</p>
              </div>
              
              <div className="role-nav__card-arrow">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      ) : (
        // Mensaje cuando no hay permisos
        <div className="role-nav__no-access">
          <svg className="role-nav__no-access-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20ZM12.5 7H11V13H12.5V7ZM12.5 15H11V16.5H12.5V15Z"/>
          </svg>
          <h3 className="md-title-large">
            Sin Permisos de Acceso
          </h3>
          <p className="md-body-medium">
            Tu rol "{userRole}" no tiene permisos para acceder a ningún módulo.
            <br />
            Contacta al administrador del sistema.
          </p>
        </div>
      )}

      {/* Información de acceso para empleados */}
      {isEmployee() && (
        <div className="role-nav__info role-nav__info--employee">
          <div className="role-nav__info-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"/>
            </svg>
          </div>
          <div className="role-nav__info-content">
            <h4 className="md-body-large">Acceso de Empleado</h4>
            <p className="md-body-medium">
              Como empleado, tienes acceso únicamente al módulo de Punto de Venta.
              Si necesitas acceso a otras funcionalidades, contacta al administrador.
            </p>
          </div>
        </div>
      )}

      {/* Información completa para administradores */}
      {isAdmin() && (
        <div className="role-nav__info role-nav__info--admin">
          <div className="role-nav__info-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1ZM12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.3 14.8,17.3H9.2C8.6,17.3 8,16.8 8,16.2V12.8C8,12.2 8.6,11.7 9.2,11.7V10.2C9.2,8.6 10.6,7 12,7ZM12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11.5H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z"/>
            </svg>
          </div>
          <div className="role-nav__info-content">
            <h4 className="md-body-large">Acceso Completo de Administrador</h4>
            <p className="md-body-medium">
              Tienes acceso a todas las funcionalidades del sistema: ventas, inventario y gestión de empleados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleBasedNavigation;
