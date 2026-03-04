import React, { useState, useEffect } from 'react';
import './GestionEmpleados.css';
import { empleadoService } from '@/services/empleadoService';
import { rolService } from '@/services/rolService';
import personaService from '@/services/personaService';
import { useToast } from '@/hooks/useToast';
import type { 
  Empleado, 
  Rol, 
  EstadoCargaEmpleados,
  PersonaResponse,
  EstadoCargaPersonas
} from '@/types/index';
import { TipoCategoriaPersona } from '@/types/index';
import ModalCrearEmpleado from './ModalCrearEmpleado';
import ModalCrearPersona from './ModalCrearPersona';
import SidebarNavigation from '@/components/common/SidebarNavigation';

type TabActiva = 'empleados' | 'proveedores' | 'clientes';

interface GestionEmpleadosProps {
  onNavigate?: (section: string) => void;
}

const GestionEmpleados: React.FC<GestionEmpleadosProps> = ({ onNavigate }) => {
  // Estados principales para empleados (legacy)
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaEmpleados>({
    cargando: true,
    error: null,
    creando: false,
    cambiandoEstado: false
  });

  // Estados para el nuevo sistema de personas
  const [proveedores, setProveedores] = useState<PersonaResponse[]>([]);
  const [clientes, setClientes] = useState<PersonaResponse[]>([]);
  const [estadoCargaPersonas, setEstadoCargaPersonas] = useState<EstadoCargaPersonas>({
    cargando: false,
    cargandoCategorias: false,
    error: null,
    creando: false,
    cambiandoEstado: false
  });

  // Estados para navegación y modales
  const [tabActiva, setTabActiva] = useState<TabActiva>('empleados');
  const [modalEmpleadoAbierto, setModalEmpleadoAbierto] = useState(false);
  const [modalPersonaAbierto, setModalPersonaAbierto] = useState(false);

  // Hook personalizado para toasts
  const { showSuccess, showError } = useToast();

  /**
   * 🔄 Cargar empleados desde la API (legacy)
   */
  const cargarEmpleados = async () => {
    try {
      setEstadoCarga(prev => ({ ...prev, cargando: true, error: null }));
      const empleadosData = await empleadoService.obtenerEmpleados();
      setEmpleados(empleadosData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar empleados';
      setEstadoCarga(prev => ({ ...prev, error: errorMessage }));
      showError(errorMessage);
    } finally {
      setEstadoCarga(prev => ({ ...prev, cargando: false }));
    }
  };

  /**
   * 🔄 Cargar roles desde la API (legacy)
   */
  const cargarRoles = async () => {
    try {
      const rolesData = await rolService.obtenerRoles();
      setRoles(rolesData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar roles';
      showError(errorMessage);
    }
  };

  /**
   * 🔄 Cargar proveedores desde la API
   */
  const cargarProveedores = async () => {
    try {
      setEstadoCargaPersonas(prev => ({ ...prev, cargando: true, error: null }));
      const proveedoresData = await personaService.obtenerPersonasPorCategoria(TipoCategoriaPersona.PROVEEDOR);
      setProveedores(proveedoresData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar proveedores';
      setEstadoCargaPersonas(prev => ({ ...prev, error: errorMessage }));
      showError(errorMessage);
    } finally {
      setEstadoCargaPersonas(prev => ({ ...prev, cargando: false }));
    }
  };

  /**
   * 🔄 Cargar clientes desde la API
   */
  const cargarClientes = async () => {
    try {
      setEstadoCargaPersonas(prev => ({ ...prev, cargando: true, error: null }));
      const clientesData = await personaService.obtenerPersonasPorCategoria(TipoCategoriaPersona.CLIENTE);
      setClientes(clientesData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar clientes';
      setEstadoCargaPersonas(prev => ({ ...prev, error: errorMessage }));
      showError(errorMessage);
    } finally {
      setEstadoCargaPersonas(prev => ({ ...prev, cargando: false }));
    }
  };

  /**
   * 🔄 Cargar categorías desde la API
   */
  const cargarCategorias = async () => {
    try {
      setEstadoCargaPersonas(prev => ({ ...prev, cargandoCategorias: true }));
      const categoriasData = await personaService.obtenerCategorias();
      // Las categorías están hardcodeadas en el enum TipoCategoriaPersona
      console.log('Categorías cargadas:', categoriasData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar categorías';
      showError(errorMessage);
    } finally {
      setEstadoCargaPersonas(prev => ({ ...prev, cargandoCategorias: false }));
    }
  };

  /**
   * 🔄 Cambiar estado de empleado (Activo/Inactivo) - Legacy
   */
  const cambiarEstadoEmpleado = async (empleadoId: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
    const nombreEmpleado = empleados.find(emp => emp.id === empleadoId)?.nombre || 'empleado';

    if (!window.confirm(`¿Está seguro de cambiar el estado de ${nombreEmpleado} a ${nuevoEstado}?`)) {
      return;
    }

    try {
      setEstadoCarga(prev => ({ ...prev, cambiandoEstado: true }));
      
      const empleadoActualizado = await empleadoService.cambiarEstadoEmpleado(
        empleadoId, 
        nuevoEstado
      );

      setEmpleados(prev => 
        prev.map(emp => 
          emp.id === empleadoId ? empleadoActualizado : emp
        )
      );

      showSuccess(`Estado de ${nombreEmpleado} cambiado a ${nuevoEstado}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado del empleado';
      showError(errorMessage);
    } finally {
      setEstadoCarga(prev => ({ ...prev, cambiandoEstado: false }));
    }
  };

  /**
   * 🔄 Cambiar estado de persona (proveedores/clientes)
   */
  const cambiarEstadoPersona = async (persona: PersonaResponse) => {
    const nuevoEstadoNombre = persona.nombreEstado === 'Activo' ? 'Inactivo' : 'Activo';

    if (!window.confirm(`¿Está seguro de cambiar el estado de ${persona.nombreCompleto} a ${nuevoEstadoNombre}?`)) {
      return;
    }

    try {
      setEstadoCargaPersonas(prev => ({ ...prev, cambiandoEstado: true }));
      
      const personaActualizada = await personaService.actualizarEstadoPersona(
        persona.id, 
        { estadoNombre: nuevoEstadoNombre }
      );

      // Actualizar la lista correspondiente
      if (persona.idCategoriaPersona === TipoCategoriaPersona.PROVEEDOR) {
        setProveedores(prev => 
          prev.map(p => p.id === persona.id ? personaActualizada : p)
        );
      } else if (persona.idCategoriaPersona === TipoCategoriaPersona.CLIENTE) {
        setClientes(prev => 
          prev.map(p => p.id === persona.id ? personaActualizada : p)
        );
      }

      showSuccess(`Estado de ${persona.nombreCompleto} cambiado a ${nuevoEstadoNombre}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado';
      showError(errorMessage);
    } finally {
      setEstadoCargaPersonas(prev => ({ ...prev, cambiandoEstado: false }));
    }
  };

  /**
   * ➕ Manejar creación de nuevo empleado (legacy)
   */
  const manejarEmpleadoCreado = (nuevoEmpleado: Empleado) => {
    setEmpleados(prev => [...prev, nuevoEmpleado]);
    setModalEmpleadoAbierto(false);
    showSuccess(`Empleado ${nuevoEmpleado.nombre} creado exitosamente`);
  };

  /**
   * ➕ Manejar creación de nueva persona (proveedores/clientes)
   */
  const manejarPersonaCreada = () => {
    // Recargar la lista correspondiente según la tab activa
    if (tabActiva === 'proveedores') {
      cargarProveedores();
    } else if (tabActiva === 'clientes') {
      cargarClientes();
    }
    setModalPersonaAbierto(false);
  };

  /**
   * 🔄 Cambiar de tab
   */
  const cambiarTab = (nuevaTab: TabActiva) => {
    setTabActiva(nuevaTab);
    
    // Cargar datos según la tab seleccionada
    if (nuevaTab === 'proveedores' && proveedores.length === 0) {
      cargarProveedores();
    } else if (nuevaTab === 'clientes' && clientes.length === 0) {
      cargarClientes();
    }
  };

  /**
   * 🔄 Abrir modal según el contexto
   */
  const abrirModal = () => {
    if (tabActiva === 'empleados') {
      setModalEmpleadoAbierto(true);
    } else {
      setModalPersonaAbierto(true);
    }
  };

  /**
   * 📋 Obtener datos de la tab activa
   */
  const obtenerDatosTabActiva = () => {
    switch (tabActiva) {
      case 'empleados':
        return {
          datos: empleados,
          cargando: estadoCarga.cargando,
          error: estadoCarga.error,
          cambiandoEstado: estadoCarga.cambiandoEstado
        };
      case 'proveedores':
        return {
          datos: proveedores,
          cargando: estadoCargaPersonas.cargando,
          error: estadoCargaPersonas.error,
          cambiandoEstado: estadoCargaPersonas.cambiandoEstado
        };
      case 'clientes':
        return {
          datos: clientes,
          cargando: estadoCargaPersonas.cargando,
          error: estadoCargaPersonas.error,
          cambiandoEstado: estadoCargaPersonas.cambiandoEstado
        };
      default:
        return {
          datos: [],
          cargando: false,
          error: null,
          cambiandoEstado: false
        };
    }
  };

  /**
   * 🎯 Obtener configuración de tab
   */
  const obtenerConfigTab = () => {
    switch (tabActiva) {
      case 'empleados':
        return {
          titulo: 'Gestión de Empleados',
          icono: 'people',
          btnTexto: 'Agregar Empleado',
          btnIcono: 'person_add',
          categoriaId: TipoCategoriaPersona.EMPLEADO
        };
      case 'proveedores':
        return {
          titulo: 'Gestión de Proveedores',
          icono: 'local_shipping',
          btnTexto: 'Agregar Proveedor',
          btnIcono: 'add_business',
          categoriaId: TipoCategoriaPersona.PROVEEDOR
        };
      case 'clientes':
        return {
          titulo: 'Gestión de Clientes',
          icono: 'groups',
          btnTexto: 'Agregar Cliente',
          btnIcono: 'person_add',
          categoriaId: TipoCategoriaPersona.CLIENTE
        };
      default:
        return {
          titulo: 'Gestión de Personas',
          icono: 'people',
          btnTexto: 'Agregar',
          btnIcono: 'add',
          categoriaId: "1"
        };
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarEmpleados();
    cargarRoles();
    cargarCategorias();
  }, []);

  const { datos, cargando, error, cambiandoEstado } = obtenerDatosTabActiva();
  const config = obtenerConfigTab();

  return (
    <div className="gestion-empleados-container">
      <SidebarNavigation 
        activeSection="personal"
        onNavigate={onNavigate}
      />
      <div className="gestion-empleados">
        {/* Header con tabs */}
        <div className="gestion-empleados__header">
        <div className="gestion-empleados__header-top">
          <h1 className="gestion-empleados__titulo">
            <i className="material-icons">{config.icono}</i>
            {config.titulo}
          </h1>
          <button 
            className="btn-primary gestion-empleados__btn-crear"
            onClick={abrirModal}
            disabled={cargando}
          >
            <i className="material-icons">{config.btnIcono}</i>
            {config.btnTexto}
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="gestion-empleados__tabs">
          <button
            className={`tab ${tabActiva === 'empleados' ? 'tab--activa' : ''}`}
            onClick={() => cambiarTab('empleados')}
          >
            <i className="material-icons">people</i>
            <span>Empleados</span>
            <span className="tab-badge">{empleados.length}</span>
          </button>
          <button
            className={`tab ${tabActiva === 'proveedores' ? 'tab--activa' : ''}`}
            onClick={() => cambiarTab('proveedores')}
          >
            <i className="material-icons">local_shipping</i>
            <span>Proveedores</span>
            <span className="tab-badge">{proveedores.length}</span>
          </button>
          <button
            className={`tab ${tabActiva === 'clientes' ? 'tab--activa' : ''}`}
            onClick={() => cambiarTab('clientes')}
          >
            <i className="material-icons">groups</i>
            <span>Clientes</span>
            <span className="tab-badge">{clientes.length}</span>
          </button>
        </div>
      </div>

      {/* Estados de carga y error */}
      {cargando && (
        <div className="gestion-empleados__loading">
          <div className="loading-spinner"></div>
          <p>Cargando {tabActiva}...</p>
        </div>
      )}

      {error && (
        <div className="gestion-empleados__error">
          <i className="material-icons">error</i>
          <p>{error}</p>
          <button 
            className="btn-secondary"
            onClick={() => {
              if (tabActiva === 'empleados') cargarEmpleados();
              else if (tabActiva === 'proveedores') cargarProveedores();
              else if (tabActiva === 'clientes') cargarClientes();
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla unificada */}
      {!cargando && !error && (
        <div className="gestion-empleados__tabla-container">
          <table className="gestion-empleados__tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                {tabActiva === 'empleados' ? (
                  <>
                    <th>Teléfono</th>
                    <th>Rol</th>
                  </>
                ) : (
                  <>
                    <th>RFC</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                  </>
                )}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td colSpan={tabActiva === 'empleados' ? 5 : 6} className="gestion-empleados__vacio">
                    <i className="material-icons">{config.icono}</i>
                    <p>No hay {tabActiva} registrados</p>
                  </td>
                </tr>
              ) : tabActiva === 'empleados' ? (
                // Renderizar empleados (legacy)
                (datos as Empleado[]).map((empleado) => (
                  <tr key={empleado.id} className="gestion-empleados__fila">
                    <td className="gestion-empleados__nombre">
                      <i className="material-icons">person</i>
                      {empleado.nombre}
                    </td>
                    <td className="gestion-empleados__telefono">
                      {empleado.telefono || 'No especificado'}
                    </td>
                    <td className="gestion-empleados__rol">
                      <span className="rol-badge">
                        {empleado.rolNombre}
                      </span>
                    </td>
                    <td className="gestion-empleados__estado">
                      <span 
                        className={`estado-badge ${
                          empleado.estadoNombre === 'Activo' ? 'estado-activo' : 'estado-inactivo'
                        }`}
                      >
                        <i className="material-icons">
                          {empleado.estadoNombre === 'Activo' ? 'check_circle' : 'cancel'}
                        </i>
                        {empleado.estadoNombre}
                      </span>
                    </td>
                    <td className="gestion-empleados__acciones">
                      <button
                        className={`btn-toggle ${
                          empleado.estadoNombre === 'Activo' ? 'btn-toggle--activo' : 'btn-toggle--inactivo'
                        }`}
                        onClick={() => cambiarEstadoEmpleado(empleado.id, empleado.estadoNombre)}
                        disabled={cambiandoEstado}
                        title={`Cambiar a ${empleado.estadoNombre === 'Activo' ? 'Inactivo' : 'Activo'}`}
                      >
                        {empleado.estadoNombre === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // Renderizar personas (proveedores/clientes)
                (datos as PersonaResponse[]).map((persona) => (
                  <tr key={persona.id} className="gestion-empleados__fila">
                    <td className="gestion-empleados__nombre">
                      <i className="material-icons">
                        {tabActiva === 'proveedores' ? 'local_shipping' : 'person'}
                      </i>
                      <div className="nombre-info">
                        <span className="nombre-principal">{persona.nombreCompleto}</span>
                        {persona.direccion && (
                          <span className="direccion-secundaria">{persona.direccion}</span>
                        )}
                      </div>
                    </td>
                    <td className="gestion-empleados__rfc">
                      {persona.rfc || 'No especificado'}
                    </td>
                    <td className="gestion-empleados__email">
                      {persona.email || 'No especificado'}
                    </td>
                    <td className="gestion-empleados__telefono">
                      {persona.telefono || 'No especificado'}
                    </td>
                    <td className="gestion-empleados__estado">
                      <span 
                        className={`estado-badge ${
                          persona.nombreEstado === 'Activo' ? 'estado-activo' : 'estado-inactivo'
                        }`}
                      >
                        <i className="material-icons">
                          {persona.nombreEstado === 'Activo' ? 'check_circle' : 'cancel'}
                        </i>
                        {persona.nombreEstado}
                      </span>
                    </td>
                    <td className="gestion-empleados__acciones">
                      <button
                        className={`btn-toggle ${
                          persona.nombreEstado === 'Activo' ? 'btn-toggle--activo' : 'btn-toggle--inactivo'
                        }`}
                        onClick={() => cambiarEstadoPersona(persona)}
                        disabled={cambiandoEstado}
                        title={`Cambiar a ${persona.nombreEstado === 'Activo' ? 'Inactivo' : 'Activo'}`}
                      >
                        {persona.nombreEstado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de creación de empleado (legacy) */}
      {modalEmpleadoAbierto && (
        <ModalCrearEmpleado
          roles={roles}
          onEmpleadoCreado={manejarEmpleadoCreado}
          onCerrar={() => setModalEmpleadoAbierto(false)}
          estadoCarga={estadoCarga}
          setEstadoCarga={setEstadoCarga}
        />
      )}

      {/* Modal de creación de persona (proveedores/clientes) */}
      {modalPersonaAbierto && (
        <ModalCrearPersona
          mostrar={modalPersonaAbierto}
          onCerrar={() => setModalPersonaAbierto(false)}
          onPersonaCreada={manejarPersonaCreada}
          categoriaSeleccionada={config.categoriaId}
        />
      )}
    </div>
    </div>
  );
};

export default GestionEmpleados;