import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Interfaces para el contexto de autenticación
interface UsuarioAutenticado {
  usuario: string;
  rolNombre: string;
  rolId: string;
  token: string;
  expiresIn: number;
}

interface LoginResponse {
  token: string;
  usuario: string;
  rolNombre: string;
  rolId: string;
  expiresIn: number;
}

interface AuthContextType {
  // Estado del usuario
  isAuthenticated: boolean;
  usuario: UsuarioAutenticado | null;
  
  // Funciones de autenticación
  login: (loginData: LoginResponse) => void;
  logout: () => void;
  
  // Utilidades
  isAdmin: () => boolean;
  isEmployee: () => boolean;
  getUserRole: () => string | null;
  getUserName: () => string | null;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Clave para localStorage
  const AUTH_STORAGE_KEY = 'pos_auth_data';

  /**
   * 🔑 Función para realizar login
   */
  const login = (loginData: LoginResponse) => {
    const userData: UsuarioAutenticado = {
      usuario: loginData.usuario,
      rolNombre: loginData.rolNombre,
      rolId: loginData.rolId,
      token: loginData.token,
      expiresIn: loginData.expiresIn
    };

    // Guardar en estado local
    setUsuario(userData);
    setIsAuthenticated(true);

    // Persistir en localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    
    console.log('✅ Usuario autenticado:', userData.usuario, 'Rol:', userData.rolNombre);
  };

  /**
   * 🚪 Función para realizar logout
   */
  const logout = () => {
    setUsuario(null);
    setIsAuthenticated(false);
    
    // Limpiar localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('authToken'); // Limpiar token legacy si existe
    
    console.log('🚪 Usuario desconectado');
  };

  /**
   * 👑 Verificar si el usuario es administrador
   */
  const isAdmin = (): boolean => {
    return usuario?.rolNombre === 'Administrador';
  };

  /**
   * 👤 Verificar si el usuario es empleado
   */
  const isEmployee = (): boolean => {
    return usuario?.rolNombre === 'Empleado';
  };

  /**
   * 🏷️ Obtener rol del usuario
   */
  const getUserRole = (): string | null => {
    return usuario?.rolNombre || null;
  };

  /**
   * 📛 Obtener nombre del usuario
   */
  const getUserName = (): string | null => {
    return usuario?.usuario || null;
  };

  /**
   * 🔄 Verificar sesión persistente al iniciar la aplicación
   */
  useEffect(() => {
    const checkPersistedAuth = () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        
        if (storedAuth) {
          const userData: UsuarioAutenticado = JSON.parse(storedAuth);
          
          // Verificar si el token no ha expirado (básico)
          // En producción, sería mejor verificar la expiración real del JWT
          if (userData.token && userData.usuario) {
            setUsuario(userData);
            setIsAuthenticated(true);
            console.log('🔄 Sesión restaurada para:', userData.usuario, 'Rol:', userData.rolNombre);
          } else {
            // Token inválido, limpiar
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('❌ Error al restaurar sesión:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    };

    checkPersistedAuth();
  }, []);

  // Valor del contexto
  const contextValue: AuthContextType = {
    isAuthenticated,
    usuario,
    login,
    logout,
    isAdmin,
    isEmployee,
    getUserRole,
    getUserName
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// Exportar tipos para uso en otros componentes
export type { UsuarioAutenticado, LoginResponse };
