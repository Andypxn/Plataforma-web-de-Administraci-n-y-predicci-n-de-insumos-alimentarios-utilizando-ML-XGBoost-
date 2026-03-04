import React, { useState } from 'react';
import { empleadoService } from '@/services/empleadoService';
import type { 
  Empleado, 
  EmpleadoCreate, 
  Rol, 
  FormularioEmpleado,
  EstadoCargaEmpleados 
} from '@/types/index';

interface ModalCrearEmpleadoProps {
  roles: Rol[];
  onEmpleadoCreado: (empleado: Empleado) => void;
  onCerrar: () => void;
  estadoCarga: EstadoCargaEmpleados;
  setEstadoCarga: React.Dispatch<React.SetStateAction<EstadoCargaEmpleados>>;
}

const ModalCrearEmpleado: React.FC<ModalCrearEmpleadoProps> = ({
  roles,
  onEmpleadoCreado,
  onCerrar,
  estadoCarga,
  setEstadoCarga
}) => {
  // Estado del formulario
  const [formulario, setFormulario] = useState<FormularioEmpleado>({
    nombre: '',
    contrasena: '',
    telefono: '',
    rolId: '',
    errores: {}
  });

  /**
   * 📝 Validar formulario
   */
  const validarFormulario = (): boolean => {
    const errores: FormularioEmpleado['errores'] = {};

    // Validar nombre
    if (!formulario.nombre.trim()) {
      errores.nombre = 'El nombre es requerido';
    } else if (formulario.nombre.trim().length < 2) {
      errores.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar contraseña
    if (!formulario.contrasena) {
      errores.contrasena = 'La contraseña es requerida';
    } else if (formulario.contrasena.length < 4) {
      errores.contrasena = 'La contraseña debe tener al menos 4 caracteres';
    }

    // Validar teléfono (opcional pero si se proporciona debe tener formato válido)
    if (formulario.telefono && !/^\d{10}$/.test(formulario.telefono.replace(/\s/g, ''))) {
      errores.telefono = 'El teléfono debe tener 10 dígitos';
    }

    // Validar rol
    if (!formulario.rolId) {
      errores.rolId = 'Debe seleccionar un rol';
    }

    setFormulario(prev => ({ ...prev, errores }));
    return Object.keys(errores).length === 0;
  };

  /**
   * 📝 Manejar cambios en inputs
   */
  const manejarCambio = (campo: keyof FormularioEmpleado, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor,
      errores: {
        ...prev.errores,
        [campo]: undefined // Limpiar error al escribir
      }
    }));
  };

  /**
   * 📤 Manejar envío del formulario
   */
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setEstadoCarga(prev => ({ ...prev, creando: true }));

      const empleadoData: EmpleadoCreate = {
        nombre: formulario.nombre.trim(),
        contrasena: formulario.contrasena,
        telefono: formulario.telefono.trim() || '',
        rolId: formulario.rolId
      };

      const nuevoEmpleado = await empleadoService.crearEmpleado(empleadoData);
      onEmpleadoCreado(nuevoEmpleado);
    } catch (error: unknown) {
      // Mostrar error específico del servidor
      const errorMessage = error instanceof Error ? error.message : 'Error al crear empleado';
      
      // Si es un error de validación específico, mostrarlo en el campo correspondiente
      if (errorMessage.toLowerCase().includes('nombre')) {
        setFormulario(prev => ({
          ...prev,
          errores: { ...prev.errores, nombre: errorMessage }
        }));
      } else if (errorMessage.toLowerCase().includes('rol')) {
        setFormulario(prev => ({
          ...prev,
          errores: { ...prev.errores, rolId: errorMessage }
        }));
      } else {
        // Error general
        alert(errorMessage);
      }
    } finally {
      setEstadoCarga(prev => ({ ...prev, creando: false }));
    }
  };

  /**
   * 🔄 Resetear formulario
   */
  const resetearFormulario = () => {
    setFormulario({
      nombre: '',
      contrasena: '',
      telefono: '',
      rolId: '',
      errores: {}
    });
  };

  /**
   * ❌ Cerrar modal
   */
  const cerrarModal = () => {
    resetearFormulario();
    onCerrar();
  };

  return (
    <div className="modal-overlay-empleado" onClick={cerrarModal}>
      <div className="modal-empleado" onClick={(e) => e.stopPropagation()}>
        {/* Header con Material Design */}
        <div className="modal-empleado__header">
          <div className="modal-empleado__header-content">
            <div className="modal-empleado__icon-wrapper">
              <span className="material-icons">person_add</span>
            </div>
            <div className="modal-empleado__title-section">
              <h2 className="modal-empleado__title">Crear Nuevo Empleado</h2>
              <p className="modal-empleado__subtitle">Complete la información del empleado</p>
            </div>
          </div>
          <button 
            className="modal-empleado__close"
            onClick={cerrarModal}
            disabled={estadoCarga.creando}
            aria-label="Cerrar modal"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Formulario con Material Design */}
        <form onSubmit={manejarEnvio} className="modal-empleado__form">
          <div className="modal-empleado__form-grid">
            {/* Campo Nombre */}
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="text"
                  id="nombre"
                  value={formulario.nombre}
                  onChange={(e) => manejarCambio('nombre', e.target.value)}
                  className={`input-field ${formulario.errores.nombre ? 'input-field--error' : ''} ${formulario.nombre ? 'input-field--filled' : ''}`}
                  placeholder=" "
                  disabled={estadoCarga.creando}
                  maxLength={100}
                />
                <label htmlFor="nombre" className="input-label">
                  <span className="material-icons">person</span>
                  Nombre Completo *
                </label>
                <div className="input-underline"></div>
              </div>
              {formulario.errores.nombre && (
                <div className="input-error">
                  <span className="material-icons">error</span>
                  {formulario.errores.nombre}
                </div>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="password"
                  id="contrasena"
                  value={formulario.contrasena}
                  onChange={(e) => manejarCambio('contrasena', e.target.value)}
                  className={`input-field ${formulario.errores.contrasena ? 'input-field--error' : ''} ${formulario.contrasena ? 'input-field--filled' : ''}`}
                  placeholder=" "
                  disabled={estadoCarga.creando}
                  maxLength={50}
                />
                <label htmlFor="contrasena" className="input-label">
                  <span className="material-icons">lock</span>
                  Contraseña *
                </label>
                <div className="input-underline"></div>
              </div>
              {formulario.errores.contrasena && (
                <div className="input-error">
                  <span className="material-icons">error</span>
                  {formulario.errores.contrasena}
                </div>
              )}
            </div>

            {/* Campo Teléfono */}
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="tel"
                  id="telefono"
                  value={formulario.telefono}
                  onChange={(e) => manejarCambio('telefono', e.target.value)}
                  className={`input-field ${formulario.errores.telefono ? 'input-field--error' : ''} ${formulario.telefono ? 'input-field--filled' : ''}`}
                  placeholder=" "
                  disabled={estadoCarga.creando}
                  maxLength={15}
                />
                <label htmlFor="telefono" className="input-label">
                  <span className="material-icons">phone</span>
                  Teléfono
                </label>
                <div className="input-underline"></div>
              </div>
              {formulario.errores.telefono && (
                <div className="input-error">
                  <span className="material-icons">error</span>
                  {formulario.errores.telefono}
                </div>
              )}
            </div>

            {/* Campo Rol */}
            <div className="input-group">
              <div className="select-wrapper">
                <select
                  id="rolId"
                  value={formulario.rolId}
                  onChange={(e) => manejarCambio('rolId', e.target.value)}
                  className={`select-field ${formulario.errores.rolId ? 'select-field--error' : ''} ${formulario.rolId ? 'select-field--filled' : ''}`}
                  disabled={estadoCarga.creando}
                >
                  <option value=""></option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
                <label htmlFor="rolId" className="select-label">
                  <span className="material-icons">work</span>
                  Rol *
                </label>
                <div className="select-underline"></div>
                <span className="material-icons select-arrow">expand_more</span>
              </div>
              {formulario.errores.rolId && (
                <div className="input-error">
                  <span className="material-icons">error</span>
                  {formulario.errores.rolId}
                </div>
              )}
            </div>
          </div>

          {/* Información adicional con Material Design */}
          <div className="info-card">
            <div className="info-card__icon">
              <span className="material-icons">info</span>
            </div>
            <div className="info-card__content">
              <h4>Información importante</h4>
              <ul>
                <li>El empleado será creado con estado <strong>Activo</strong></li>
                <li>La contraseña será encriptada de forma segura</li>
                <li>El teléfono es opcional pero recomendado</li>
              </ul>
            </div>
          </div>

          {/* Botones con Material Design */}
          <div className="modal-empleado__actions">
            <button
              type="button"
              className="btn-material btn-material--outline"
              onClick={cerrarModal}
              disabled={estadoCarga.creando}
            >
              <span className="material-icons">close</span>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-material btn-material--primary"
              disabled={estadoCarga.creando}
            >
              {estadoCarga.creando ? (
                <>
                  <div className="btn-spinner"></div>
                  Creando...
                </>
              ) : (
                <>
                  <span className="material-icons">add</span>
                  Crear Empleado
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCrearEmpleado;
