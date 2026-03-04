import React, { useState } from 'react';
import { authService } from '@/services/apiService';
import axios from 'axios';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  Store, 
  User, 
  Lock, 
  LogIn, 
  AlertCircle,
  ChevronRight,
  Menu
} from 'lucide-react';
import './LoginScreen.css';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    nombre: '',
    contrasena: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar el hook de autenticación
  const { login: authLogin } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.nombre || !credentials.contrasena) {
      setError('Por favor, ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Llamar al servicio de login (nueva respuesta con rol)
      const loginResponse = await authService.login(credentials);
      
      // Actualizar el contexto de autenticación con los nuevos datos
      authLogin(loginResponse);
      
      // Notificar que el login fue exitoso
      onLoginSuccess();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data) {
        setError(typeof error.response.data === 'string' ? error.response.data : 'Error de autenticación');
      } else {
        setError('Error de conexión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modern-login">
      {/* Background con gradient animado */}
      <div className="modern-login__background">
        <div className="modern-login__gradient"></div>
        <div className="modern-login__pattern"></div>
      </div>

      {/* Contenido principal */}
      <div className="modern-login__container">
        
        {/* Panel izquierdo - Branding */}
        <div className="modern-login__branding">
          <div className="modern-login__brand-content">
            {/* Logo */}
            <div className="modern-login__logo">
              <div className="modern-login__logo-icon">
                <Menu className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            </div>
            
            {/* Título principal */}
            <div className="modern-login__brand-text">
              <h1 className="modern-login__title">Sistema POS</h1>
              <p className="modern-login__subtitle">Punto de Venta Moderno</p>
            </div>
            
            {/* Características destacadas */}
            <div className="modern-login__features">
              <div className="modern-login__feature">
                <div className="modern-login__feature-icon">
                  <Store className="w-5 h-5" />
                </div>
                <span>Gestión completa de ventas</span>
              </div>
              <div className="modern-login__feature">
                <div className="modern-login__feature-icon">
                  <ChevronRight className="w-5 h-5" />
                </div>
                <span>Inventario inteligente</span>
              </div>
              <div className="modern-login__feature">
                <div className="modern-login__feature-icon">
                  <User className="w-5 h-5" />
                </div>
                <span>Control de empleados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario de login */}
        <div className="modern-login__form-panel">
          <div className="modern-login__form-container">
            
            {/* Header del formulario */}
            <div className="modern-login__form-header">
              <h2 className="modern-login__form-title">Bienvenido de nuevo</h2>
              <p className="modern-login__form-subtitle">Ingresa tus credenciales para acceder al sistema</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="modern-login__form" noValidate>
              
              {/* Campo Usuario */}
              <div className="modern-login__field">
                <label htmlFor="nombre" className="modern-login__label">
                  Usuario
                </label>
                <div className="modern-login__input-wrapper">
                  <div className="modern-login__input-icon">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={credentials.nombre}
                    onChange={handleInputChange}
                    className="modern-login__input modern-login__input--with-icon pl-12"
                    placeholder="Ingresa tu usuario"
                    disabled={isLoading}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="modern-login__field">
                <label htmlFor="contrasena" className="modern-login__label">
                  Contraseña
                </label>
                <div className="modern-login__input-wrapper">
                  <div className="modern-login__input-icon">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    id="contrasena"
                    name="contrasena"
                    value={credentials.contrasena}
                    onChange={handleInputChange}
                    className="modern-login__input modern-login__input--with-icon pl-12"
                    placeholder="Ingresa tu contraseña"
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="modern-login__error" role="alert">
                  <AlertCircle className="modern-login__error-icon w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isLoading}
                className="modern-login__submit-btn"
              >
                {isLoading ? (
                  <>
                    <div className="modern-login__loading-spinner"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
