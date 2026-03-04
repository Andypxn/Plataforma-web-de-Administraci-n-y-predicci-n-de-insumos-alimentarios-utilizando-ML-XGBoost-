import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { RolUsuario } from '@/types/index';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: RolUsuario;
  adminOnly?: boolean;
  employeeAccess?: boolean;
  fallback?: ReactNode;
}

/**
 * Componente para proteger rutas basándose en el rol del usuario
 * 
 * @param children - Componente a renderizar si el usuario tiene permisos
 * @param requiredRole - Rol específico requerido ('Administrador' | 'Empleado')
 * @param adminOnly - Solo administradores (equivale a requiredRole='Administrador')
 * @param employeeAccess - Permite acceso a empleados y administradores
 * @param fallback - Componente a mostrar si no tiene permisos
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  adminOnly = false,
  employeeAccess = false,
  fallback
}) => {
  const { isAuthenticated, isAdmin, isEmployee, getUserRole } = useAuth();

  // Si no está autenticado, no mostrar nada (debería redirigir a login en un nivel superior)
  if (!isAuthenticated) {
    return fallback || <div>No autorizado - inicie sesión</div>;
  }

  const userRole = getUserRole();

  // Determinar si el usuario tiene acceso
  const hasAccess = (() => {
    // Si se especifica adminOnly, solo administradores
    if (adminOnly) {
      return isAdmin();
    }

    // Si se especifica un rol requerido
    if (requiredRole) {
      return userRole === requiredRole;
    }

    // Si se permite acceso a empleados (empleados y administradores)
    if (employeeAccess) {
      return isEmployee() || isAdmin();
    }

    // Por defecto, negar acceso
    return false;
  })();

  if (hasAccess) {
    return <>{children}</>;
  }

  // Mostrar mensaje de acceso denegado
  return fallback || (
    <div className="protected-route-denied">
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <i className="material-icons text-6xl text-red-500 mb-4">block</i>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Acceso Denegado
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No tienes permisos para acceder a esta sección.
            </p>
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <i className="material-icons text-red-500">info</i>
                <div className="text-left">
                  <p className="text-sm text-red-800">
                    <strong>Tu rol actual:</strong> {userRole || 'Sin definir'}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Esta funcionalidad requiere permisos de{' '}
                    {adminOnly || requiredRole === 'Administrador' 
                      ? 'Administrador' 
                      : employeeAccess 
                        ? 'Empleado o Administrador'
                        : 'nivel superior'
                    }.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i className="material-icons mr-2">arrow_back</i>
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
