import React, { useState, useEffect } from 'react';
import type { 
  PersonaCreateRequest, 
  FormularioPersona, 
  CategoriaPersona
} from '@/types';
import { TipoCategoriaPersona } from '@/types';
import personaService from '@/services/personaService';
import axios from 'axios';
import './ModalCrearPersona.css';

interface Props {
  mostrar: boolean;
  onCerrar: () => void;
  onPersonaCreada: () => void;
  categoriaSeleccionada?: string;
}

const ModalCrearPersona: React.FC<Props> = ({ 
  mostrar, 
  onCerrar, 
  onPersonaCreada,
  categoriaSeleccionada 
}) => {
  const [formulario, setFormulario] = useState<FormularioPersona>({
    nombre: '',
    apellidos: '',
    rfc: '',
    email: '',
    telefono: '',
    direccion: '',
    idCategoriaPersona: categoriaSeleccionada || '',
    errores: {}
  });

  const [categorias, setCategorias] = useState<CategoriaPersona[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    if (mostrar) {
      cargarCategorias();
    }
  }, [mostrar]);

  // Actualizar categoría seleccionada cuando cambie la prop
  useEffect(() => {
    if (categoriaSeleccionada && categoriaSeleccionada !== formulario.idCategoriaPersona) {
      setFormulario(prev => ({
        ...prev,
        idCategoriaPersona: categoriaSeleccionada
      }));
    }
  }, [categoriaSeleccionada]);

  const cargarCategorias = async () => {
    try {
      setCargandoCategorias(true);
      const categoriasData = await personaService.obtenerCategorias();
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setCargandoCategorias(false);
    }
  };

  const validarFormulario = (): boolean => {
    const errores: FormularioPersona['errores'] = {};

    // Validaciones obligatorias
    if (!formulario.nombre.trim()) {
      errores.nombre = 'El nombre es obligatorio';
    } else if (formulario.nombre.trim().length < 2) {
      errores.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (formulario.nombre.trim().length > 100) {
      errores.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (!formulario.apellidos.trim()) {
      errores.apellidos = 'Los apellidos son obligatorios';
    } else if (formulario.apellidos.trim().length < 2) {
      errores.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
    } else if (formulario.apellidos.trim().length > 100) {
      errores.apellidos = 'Los apellidos no pueden exceder 100 caracteres';
    }

    if (!formulario.idCategoriaPersona || formulario.idCategoriaPersona === '') {
      errores.idCategoriaPersona = 'Debe seleccionar una categoría';
    }

    // Validaciones opcionales
    if (formulario.rfc.trim() && !/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(formulario.rfc.trim())) {
      errores.rfc = 'El RFC debe tener el formato correcto (ej: XAXX010101000)';
    }

    if (formulario.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email.trim())) {
      errores.email = 'El email debe tener un formato válido';
    }

    if (formulario.telefono.trim() && !/^[0-9]{10}$/.test(formulario.telefono.trim())) {
      errores.telefono = 'El teléfono debe contener exactamente 10 dígitos';
    }

    if (formulario.direccion.trim().length > 255) {
      errores.direccion = 'La dirección no puede exceder 255 caracteres';
    }

    setFormulario(prev => ({ ...prev, errores }));
    return Object.keys(errores).length === 0;
  };

  const handleChange = (campo: keyof FormularioPersona, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor,
      errores: {
        ...prev.errores,
        [campo]: undefined
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setCargando(true);

      const personaData: PersonaCreateRequest = {
        nombre: formulario.nombre.trim(),
        apellidos: formulario.apellidos.trim(),
        rfc: formulario.rfc.trim() || undefined,
        email: formulario.email.trim() || undefined,
        telefono: formulario.telefono.trim() || undefined,
        direccion: formulario.direccion.trim() || undefined,
        idCategoriaPersona: formulario.idCategoriaPersona
      };

      await personaService.crearPersona(personaData);
      
      // Limpiar formulario
      setFormulario({
        nombre: '',
        apellidos: '',
        rfc: '',
        email: '',
        telefono: '',
        direccion: '',
        idCategoriaPersona: categoriaSeleccionada || '',
        errores: {}
      });

      onPersonaCreada();
      onCerrar();
    } catch (error: unknown) {
      console.error('Error al crear persona:', error);
      
      // Manejar errores específicos del backend
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const mensajeError = error.response.data?.message || 'Error de validación';
        if (mensajeError.includes('RFC')) {
          setFormulario(prev => ({
            ...prev,
            errores: { ...prev.errores, rfc: mensajeError }
          }));
        } else if (mensajeError.includes('email')) {
          setFormulario(prev => ({
            ...prev,
            errores: { ...prev.errores, email: mensajeError }
          }));
        }
      }
    } finally {
      setCargando(false);
    }
  };

  const obtenerTituloCategoria = () => {
    const categoria = categorias.find(cat => cat.id === formulario.idCategoriaPersona);
    return categoria ? categoria.nombre : 'Persona';
  };

  const obtenerPlaceholderRFC = () => {
    switch (formulario.idCategoriaPersona) {
      case TipoCategoriaPersona.PROVEEDOR:
        return 'RFC del proveedor (opcional)';
      case TipoCategoriaPersona.CLIENTE:
        return 'RFC del cliente (opcional)';
      default:
        return 'RFC (opcional)';
    }
  };

  if (!mostrar) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-crear-persona">
        <div className="modal-header">
          <h2>Crear Nuevo {obtenerTituloCategoria()}</h2>
          <button 
            className="btn-cerrar"
            onClick={onCerrar}
            disabled={cargando}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* Información básica */}
            <div className="form-section">
              <h3>Información Básica</h3>
              
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  value={formulario.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className={formulario.errores.nombre ? 'error' : ''}
                  placeholder="Nombre de la persona"
                  disabled={cargando}
                />
                {formulario.errores.nombre && (
                  <span className="error-message">{formulario.errores.nombre}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="apellidos">Apellidos *</label>
                <input
                  type="text"
                  id="apellidos"
                  value={formulario.apellidos}
                  onChange={(e) => handleChange('apellidos', e.target.value)}
                  className={formulario.errores.apellidos ? 'error' : ''}
                  placeholder="Apellidos de la persona"
                  disabled={cargando}
                />
                {formulario.errores.apellidos && (
                  <span className="error-message">{formulario.errores.apellidos}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="categoria">Categoría *</label>
                <select
                  id="categoria"
                  value={formulario.idCategoriaPersona}
                  onChange={(e) => handleChange('idCategoriaPersona', e.target.value)}
                  className={formulario.errores.idCategoriaPersona ? 'error' : ''}
                  disabled={cargando || cargandoCategorias}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias
                    .filter(categoria => categoria.nombre !== 'Empleado')
                    .map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
                {formulario.errores.idCategoriaPersona && (
                  <span className="error-message">{formulario.errores.idCategoriaPersona}</span>
                )}
              </div>
            </div>

            {/* Información de contacto */}
            <div className="form-section">
              <h3>Información de Contacto</h3>
              
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  value={formulario.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value.replace(/\D/g, ''))}
                  className={formulario.errores.telefono ? 'error' : ''}
                  placeholder="10 dígitos (ej: 5551234567)"
                  maxLength={10}
                  disabled={cargando}
                />
                {formulario.errores.telefono && (
                  <span className="error-message">{formulario.errores.telefono}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formulario.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={formulario.errores.email ? 'error' : ''}
                  placeholder="correo@ejemplo.com"
                  disabled={cargando}
                />
                {formulario.errores.email && (
                  <span className="error-message">{formulario.errores.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="rfc">RFC</label>
                <input
                  type="text"
                  id="rfc"
                  value={formulario.rfc}
                  onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
                  className={formulario.errores.rfc ? 'error' : ''}
                  placeholder={obtenerPlaceholderRFC()}
                  maxLength={13}
                  disabled={cargando}
                />
                {formulario.errores.rfc && (
                  <span className="error-message">{formulario.errores.rfc}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <textarea
                  id="direccion"
                  value={formulario.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  className={formulario.errores.direccion ? 'error' : ''}
                  placeholder="Dirección completa (opcional)"
                  rows={3}
                  maxLength={255}
                  disabled={cargando}
                />
                {formulario.errores.direccion && (
                  <span className="error-message">{formulario.errores.direccion}</span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secundario"
              onClick={onCerrar}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario"
              disabled={cargando || cargandoCategorias}
            >
              {cargando ? 'Creando...' : `Crear ${obtenerTituloCategoria()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCrearPersona;