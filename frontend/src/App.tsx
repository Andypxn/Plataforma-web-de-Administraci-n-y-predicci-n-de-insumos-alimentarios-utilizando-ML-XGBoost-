import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/store/contexts/AuthContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import LoginScreen from '@/features/auth/components/LoginScreen';
import MainMenu from '@/components/common/MainMenu';
import WorkspaceScreen from '@/features/pos/components/WorkspaceScreen';
import Inventario from '@/features/inventory/components/Inventario';
import PuntoDeVenta from '@/features/pos/components/PuntoDeVenta';
import GestionPersonas from '@/features/employees/components/GestionPersonas';
import SeleccionProveedores from '@/features/purchases/components/SeleccionProveedores';
import PuntoDeCompras from '@/features/purchases/components/PuntoDeCompras';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import type { Proveedor } from '@/types';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

type AppState = 'login' | 'main-menu' | 'workspaces' | 'inventario' | 'punto-de-venta' | 'empleados' | 'seleccion-proveedores' | 'compras';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [openPredictions, setOpenPredictions] = useState(false);
  
  // Usar el hook de autenticación
  const { logout: authLogout, isAuthenticated } = useAuth();

  // Listener para eventos de logout automático (token expirado)
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      console.log('🚪 [App] Logout automático detectado:', event.detail);
      handleLogout();
    };

    // Agregar listener para evento personalizado
    window.addEventListener('auth:logout', handleAuthLogout as EventListener);

    // Cleanup listener al desmontar
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
    };
  }, []);

  const handleLoginSuccess = () => {
    // Solo cambiar al menú principal - AuthContext ya tiene la información del usuario
    setAppState('main-menu');
  };

  const handleLogout = () => {
    // Limpiar el contexto de autenticación
    authLogout();
    // Volver al login
    setAppState('login');
  };

  const handlePuntoDeVentaClick = () => {
    setAppState('workspaces');
  };

  const handleInventarioClick = () => {
    setAppState('inventario');
  };

  const handleEmpleadosClick = () => {
    setAppState('empleados');
  };

  const handleBackToMainMenu = () => {
    setAppState('main-menu');
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    // Guardar el workspace seleccionado y navegar al punto de venta
    setSelectedWorkspaceId(workspaceId);
    setAppState('punto-de-venta');
  };

  const handleBackToWorkspaces = () => {
    setAppState('workspaces');
  };

  const handleNavigateToCompras = () => {
    setAppState('seleccion-proveedores');
  };

  const handleProveedorSelect = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setAppState('compras');
  };

  const handleBackToInventario = () => {
    setAppState('inventario');
  };

  const handleBackToProveedores = () => {
    setAppState('seleccion-proveedores');
  };

  // Navegación universal para SidebarNavigation
  const handleSidebarNavigate = (section: string) => {
    // Resetear el flag de predicciones al navegar
    setOpenPredictions(false);
    
    // Verificar si viene con parámetro de predicciones
    if (section.includes('?openPredictions=true')) {
      setOpenPredictions(true);
      section = section.split('?')[0]; // Extraer solo la sección
    }
    
    switch (section) {
      case 'home':
        setAppState('main-menu');
        break;
      case 'workspaces':
        setAppState('workspaces');
        break;
      case 'inventario':
        setAppState('inventario');
        break;
      case 'personal':
        setAppState('empleados');
        break;
      default:
        console.log('Sección no reconocida:', section);
    }
  };

  switch (appState) {
    case 'login':
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    
    case 'main-menu':
      if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      return (
        <MainMenu 
          onPuntoDeVentaClick={handlePuntoDeVentaClick}
          onInventarioClick={handleInventarioClick}
          onEmpleadosClick={handleEmpleadosClick}
          onLogout={handleLogout}
          onNavigate={handleSidebarNavigate}
        />
      );
    
    case 'workspaces':
      if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      return (
        <WorkspaceScreen 
          onWorkspaceSelect={handleWorkspaceSelect}
          onBackToMainMenu={handleBackToMainMenu}
          onNavigate={handleSidebarNavigate}
        />
      );
    
    case 'punto-de-venta':
      if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      return (
        <PuntoDeVenta
          workspaceId={selectedWorkspaceId}
          onBackToWorkspaces={handleBackToWorkspaces}
          onNavigate={handleSidebarNavigate}
        />
      );
    
    case 'inventario':
      return (
        <ProtectedRoute adminOnly={true}>
          <Inventario 
            onNavigateToCompras={handleNavigateToCompras} 
            onNavigate={handleSidebarNavigate}
            openPredictions={openPredictions}
          />
        </ProtectedRoute>
      );
    
    case 'empleados':
      if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      return (
        <ProtectedRoute adminOnly={true}>
          <GestionPersonas onNavigate={handleSidebarNavigate} />
        </ProtectedRoute>
      );
    
    case 'seleccion-proveedores':
      return (
        <ProtectedRoute adminOnly={true}>
          <SeleccionProveedores 
            onProveedorSelect={handleProveedorSelect}
            onBackToInventario={handleBackToInventario}
          />
        </ProtectedRoute>
      );
    
    case 'compras':
      if (!selectedProveedor) {
        // Si no hay proveedor seleccionado, volver a la selección
        setAppState('seleccion-proveedores');
        return null;
      }
      return (
        <ProtectedRoute adminOnly={true}>
          <PuntoDeCompras 
            proveedor={selectedProveedor}
            onBackToProveedores={handleBackToProveedores}
          />
        </ProtectedRoute>
      );
    
    default:
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
}

function AppWithToast() {
  return (
    <AuthProvider>
      <App />
      <ToastContainer 
        position="top-right"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 99999 }}
        toastStyle={{
          fontSize: '16px',
          fontWeight: '500',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          minHeight: '80px',
        }}
      />
    </AuthProvider>
  );
}

export default AppWithToast;
