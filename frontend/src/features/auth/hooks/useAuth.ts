import { useAuth as useAuthContext } from '@/store/contexts/AuthContext';

/**
 * Hook personalizado para acceder fácilmente al contexto de autenticación
 * 
 * @returns Objeto con estado de autenticación y funciones relacionadas
 * 
 * @example
 * ```tsx
 * const { isAuthenticated, login, logout, isAdmin, getUserName } = useAuth();
 * 
 * if (isAdmin()) {
 *   // Mostrar opciones de administrador
 * }
 * ```
 */
export const useAuth = () => {
  const auth = useAuthContext();
  
  return {
    // Estado
    isAuthenticated: auth.isAuthenticated,
    usuario: auth.usuario,
    
    // Funciones de autenticación
    login: auth.login,
    logout: auth.logout,
    
    // Utilidades de rol
    isAdmin: auth.isAdmin,
    isEmployee: auth.isEmployee,
    getUserRole: auth.getUserRole,
    getUserName: auth.getUserName,
    
    // Funciones de conveniencia adicionales
    hasRole: (role: string) => auth.getUserRole() === role,
    canAccess: (requiredRole: 'Administrador' | 'Empleado') => {
      const userRole = auth.getUserRole();
      if (requiredRole === 'Empleado') {
        return userRole === 'Empleado' || userRole === 'Administrador';
      }
      return userRole === requiredRole;
    }
  };
};
