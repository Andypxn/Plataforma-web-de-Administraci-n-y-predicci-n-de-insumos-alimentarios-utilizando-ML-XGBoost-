import React from 'react';
import type { UsuarioDTO } from '@/types';

interface EmployeeMainScreenProps {
  usuario: UsuarioDTO;
  onPuntoDeVentaClick: () => void;
  onLogout: () => void;
}

const EmployeeMainScreen: React.FC<EmployeeMainScreenProps> = ({ 
  usuario, 
  onPuntoDeVentaClick, 
  onLogout 
}) => {
  return (
    <>
      <style>
        {`
          /* --- Global Styles & Fonts --- */
          @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
          :root {
            --background-color: #f5f5f5; /* Cambiado a fondo claro */
            --text-light: #1a1a1a; /* Cambiado a texto oscuro */
            --font-family-main: 'Roboto Mono', monospace;
            --color-logout: #CC7A53;
            --color-punto-venta: #4E9A91;
          }

          .employee-main-page {
            box-sizing: border-box;
            min-height: 100vh;
            background-color: var(--background-color);
            font-family: var(--font-family-main);
            padding: 2rem 3rem;
            display: flex;
            flex-direction: column;
          }

          .main-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4rem;
          }

          .welcome-text {
            color: var(--text-light);
            font-size: 1.5rem;
            font-weight: 500;
          }

          .logout-btn {
            border: none;
            border-radius: 12px;
            padding: 0.8rem 1.5rem;
            font-family: var(--font-family-main);
            font-size: 1rem;
            font-weight: 500;
            color: #3a3a3a;
            cursor: pointer;
            transition: transform 0.2s ease, opacity 0.2s ease;
            background-color: var(--color-logout);
          }

          .logout-btn:hover {
            transform: translateY(-2px);
            opacity: 0.9;
          }

          .main-content {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .punto-venta-btn {
            border: none;
            border-radius: 24px;
            padding: 3rem 4rem;
            font-family: var(--font-family-main);
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff; /* Color blanco para contraste con fondo verde */
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            background-color: var(--color-punto-venta);
            min-width: 300px;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .punto-venta-btn:hover {
            transform: scale(1.05);
            box-shadow: 0px 15px 30px rgba(0, 0, 0, 0.3);
          }
        `}
      </style>
      <div className="employee-main-page">
        <header className="main-header">
          <div className="welcome-text">
            Bienvenido, {usuario.nombre}
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </header>

        <div className="main-content">
          <button className="punto-venta-btn" onClick={onPuntoDeVentaClick}>
            Punto de Venta
          </button>
        </div>
      </div>
    </>
  );
};

export default EmployeeMainScreen;
