import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Briefcase,
  Truck,
  UserCircle,
  Plus,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  BadgeCheck
} from 'lucide-react';
import SidebarNavigation from '@/components/common/SidebarNavigation';

// --- IMPORTS DE LÓGICA EXISTENTE ---
import { empleadoService } from '@/services/empleadoService';
import { personaService } from '@/services/personaService';
import { TipoCategoriaPersona } from '@/types';
import { useToast } from '@/hooks/useToast';
import './GestionPersonas.css';

// --- TIPOS DEL BACKEND ---
interface Empleado {
  id: string;
  nombre: string;
  telefono: string;
  rolNombre: string;
  estadoNombre: string;
}

interface PersonaResponse {
  id: string;
  nombreCompleto: string;
  rfc?: string;
  email?: string;
  telefono?: string;
  nombreEstado: string;
}

// Tipo Unión para la tabla
type TableItem = Empleado | PersonaResponse;

// --- COMPONENTES VISUALES AUXILIARES ---

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status?.toLowerCase() === 'activo';
  return (
    <span className={`gp-status-badge ${isActive ? 'gp-status-badge--active' : 'gp-status-badge--inactive'}`}>
      {isActive ? (
        <CheckCircle2 className="gp-status-badge__icon" />
      ) : (
        <XCircle className="gp-status-badge__icon" />
      )}
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
};

const ActionToggle = ({
  status,
  onToggle,
  loading = false
}: {
  status: string;
  onToggle: () => void;
  loading?: boolean;
}) => {
  const isActive = status?.toLowerCase() === 'activo';
  return (
    <div 
      className={`gp-toggle ${loading ? 'gp-toggle--loading' : ''}`} 
      onClick={loading ? undefined : onToggle}
    >
      <span className={`gp-toggle__label ${isActive ? 'gp-toggle__label--off' : 'gp-toggle__label--off-active'}`}>
        Off
      </span>
      <button
        disabled={loading}
        className="gp-toggle__button"
      >
        {isActive ? (
          <ToggleRight className="gp-toggle__icon gp-toggle__icon--active" />
        ) : (
          <ToggleLeft className="gp-toggle__icon gp-toggle__icon--inactive" />
        )}
      </button>
      <span className={`gp-toggle__label ${isActive ? 'gp-toggle__label--on-active' : 'gp-toggle__label--on'}`}>
        On
      </span>
    </div>
  );
};

// --- COMPONENTE DE TABLA PRINCIPAL ---
interface ManagementTableProps {
  title: string;
  subtitle: string;
  data: TableItem[];
  columns: any[];
  type: string;
  icon: any;
  currentTab: string;
  onTabChange: (id: string) => void;
  loading: boolean;
}

const ManagementTable = ({
  title,
  subtitle,
  data,
  columns,
  type,
  icon: Icon,
  currentTab,
  onTabChange,
  loading
}: ManagementTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((item: any) => {
    const name = (item.nombre || item.nombreCompleto || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const tabs = [
    { id: 'employees', label: 'Empleados', icon: Briefcase },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'customers', label: 'Clientes', icon: Users },
  ];

  return (
    <div className="gp-table-container">

      {/* 1. Encabezado */}
      <div className="gp-header">
        <div className="gp-header__title-section">
          <div className="gp-header__title-wrapper">
            <div className="gp-header__icon">
              <Icon className="gp-btn__icon" />
            </div>
            <h2 className="gp-header__title">{title}</h2>
          </div>
          <p className="gp-header__subtitle">{subtitle}</p>

          {/* TABS */}
          <div className="gp-tabs">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`gp-tab ${isActive ? 'gp-tab--active' : ''}`}
                >
                  <TabIcon className="gp-tab__icon" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="gp-actions">
          <button className="gp-btn gp-btn--primary">
            <Plus className="gp-btn__icon" />
            <span>Nuevo {type}</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda */}
      <div className="gp-search">
        <div className="gp-search__wrapper">
          <Search className="gp-search__icon" />
          <input
            type="text"
            placeholder={`Buscar ${title.toLowerCase()}...`}
            className="gp-search__input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 3. La Tabla */}
      <div className="gp-table-card">
        <div className="gp-table-wrapper">
          <table className="gp-table">
            <thead className="gp-table__head">
              <tr className="gp-table__head-row">
                {columns.map((col: any, idx: number) => (
                  <th 
                    key={idx} 
                    className={`gp-table__th ${col.align === 'text-center' ? 'gp-table__th--center' : ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="gp-table__body gp-table__body-divider">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="gp-table__td">
                    <div className="gp-loading">
                      <div className="gp-loading__content">
                        <div className="gp-loading__spinner"></div>
                        <span className="gp-loading__text">Cargando datos...</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item: any, index: number) => (
                  <tr key={item.id || index} className="gp-table__row">
                    {columns.map((col: any, colIdx: number) => (
                      <td key={colIdx} className={`gp-table__td ${col.className || ''}`}>
                        {col.render ? col.render(item) : (
                          <span className="gp-role__name">{item[col.key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="gp-table__td">
                    <div className="gp-empty">
                      <div className="gp-empty__content">
                        <div className="gp-empty__icon-wrapper">
                          <Search className="gp-empty__icon" />
                        </div>
                        <p className="gp-empty__text">No se encontraron resultados para "{searchTerm}"</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const GestionPersonas = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const [activeTab, setActiveTab] = useState('employees');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [proveedores, setProveedores] = useState<PersonaResponse[]>([]);
  const [clientes, setClientes] = useState<PersonaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();

  const cargarDatos = async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'employees':
          const empleadosData = await empleadoService.obtenerEmpleados();
          setEmpleados(empleadosData);
          break;
        case 'suppliers':
          const proveedoresData = await personaService.obtenerPersonasPorCategoria(TipoCategoriaPersona.PROVEEDOR);
          setProveedores(proveedoresData);
          break;
        case 'customers':
          const clientesData = await personaService.obtenerPersonasPorCategoria(TipoCategoriaPersona.CLIENTE);
          setClientes(clientesData);
          break;
      }
    } catch (err) {
      console.error(err);
      showError(`Error al cargar datos`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string, type: string) => {
    setToggleLoading(id);
    try {
      const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';

      if (type === 'empleado') {
        await empleadoService.cambiarEstadoEmpleado(id, newStatus);
        await cargarDatos('employees');
        showSuccess(`Estado actualizado correctamente`);
      } else {
        if (newStatus === 'Activo') {
          await personaService.activarPersona(id);
        } else {
          await personaService.desactivarPersona(id);
        }
        if (type === 'proveedor') await cargarDatos('suppliers');
        else await cargarDatos('customers');

        showSuccess(`Estado actualizado correctamente`);
      }
    } catch (err) {
      console.error(err);
      showError(`Error al cambiar estado`);
    } finally {
      setToggleLoading(null);
    }
  };

  useEffect(() => {
    cargarDatos(activeTab);
  }, [activeTab]);

  const employeeColumns = [
    {
      header: 'Nombre del Empleado',
      key: 'nombre',
      render: (item: Empleado) => (
        <div className="gp-employee">
          <div className="gp-employee__avatar">
            {(item.nombre || '?').charAt(0)}
          </div>
          <div className="gp-employee__info">
            <span className="gp-employee__name">{item.nombre}</span>
            <span className="gp-employee__id">ID: ...{(item.id || '').slice(-4)}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Teléfono',
      key: 'telefono',
      render: (item: Empleado) => (
        <div className="gp-contact">
          <Phone className="gp-contact__icon" />
          {item.telefono || 'Sin teléfono'}
        </div>
      )
    },
    {
      header: 'Rol / Puesto',
      key: 'rolNombre',
      render: (item: Empleado) => (
        <div className="gp-role">
          <BadgeCheck className="gp-role__icon" />
          <span className="gp-role__name">{item.rolNombre}</span>
        </div>
      )
    },
    {
      header: 'Estado Actual',
      key: 'estadoNombre',
      render: (item: Empleado) => <StatusBadge status={item.estadoNombre} />
    },
    {
      header: 'Acciones',
      key: 'actions',
      align: 'text-center',
      render: (item: Empleado) => (
        <ActionToggle
          status={item.estadoNombre}
          loading={toggleLoading === item.id}
          onToggle={() => handleToggleStatus(item.id, item.estadoNombre, 'empleado')}
        />
      )
    }
  ];

  const supplierColumns = [
    {
      header: 'Nombre / Empresa',
      key: 'nombreCompleto',
      render: (item: PersonaResponse) => (
        <div className="gp-supplier">
          <div className="gp-supplier__icon">
            <Truck className="gp-btn__icon" />
          </div>
          <div className="gp-supplier__info">
            <span className="gp-supplier__name">{item.nombreCompleto}</span>
            <span className="gp-supplier__type">Proveedor</span>
          </div>
        </div>
      )
    },
    {
      header: 'RFC',
      key: 'rfc',
      render: (item: PersonaResponse) => (
        <span className="gp-rfc">
          {item.rfc || 'N/A'}
        </span>
      )
    },
    {
      header: 'Email',
      key: 'email',
      render: (item: PersonaResponse) => (
        <div className="gp-contact gp-contact--email">
          <Mail className="gp-contact__icon" />
          {item.email || 'Sin email'}
        </div>
      )
    },
    {
      header: 'Estado',
      key: 'nombreEstado',
      render: (item: PersonaResponse) => <StatusBadge status={item.nombreEstado} />
    },
    {
      header: 'Acciones',
      align: 'text-center',
      render: (item: PersonaResponse) => (
        <ActionToggle
          status={item.nombreEstado}
          loading={toggleLoading === item.id}
          onToggle={() => handleToggleStatus(item.id, item.nombreEstado, 'proveedor')}
        />
      )
    }
  ];

  const customerColumns = [
    {
      header: 'Cliente',
      key: 'nombreCompleto',
      render: (item: PersonaResponse) => (
        <div className="gp-customer">
          <div className="gp-customer__icon">
            <UserCircle className="gp-btn__icon" />
          </div>
          <div className="gp-customer__info">
            <span className="gp-customer__name">{item.nombreCompleto}</span>
            <span className="gp-customer__type">Cliente</span>
          </div>
        </div>
      )
    },
    {
      header: 'RFC',
      key: 'rfc',
      render: (item: PersonaResponse) => (
        <span className="gp-rfc">
          {item.rfc || 'N/A'}
        </span>
      )
    },
    {
      header: 'Email',
      key: 'email',
      render: (item: PersonaResponse) => (
        <div className="gp-contact gp-contact--email">
          <Mail className="gp-contact__icon" />
          {item.email || 'Sin email'}
        </div>
      )
    },
    {
      header: 'Estado',
      key: 'nombreEstado',
      render: (item: PersonaResponse) => <StatusBadge status={item.nombreEstado} />
    },
    {
      header: 'Acciones',
      align: 'text-center',
      render: (item: PersonaResponse) => (
        <ActionToggle
          status={item.nombreEstado}
          loading={toggleLoading === item.id}
          onToggle={() => handleToggleStatus(item.id, item.nombreEstado, 'cliente')}
        />
      )
    }
  ];

  return (
    <div className="gestion-personas-container">
      <SidebarNavigation activeSection="personal" onNavigate={onNavigate} />

      <main className="gestion-personas-main">
        {activeTab === 'employees' && (
          <ManagementTable
            title="Lista de Empleados"
            subtitle="Administra el acceso y roles de tu personal."
            type="Empleado"
            icon={Briefcase}
            data={empleados}
            columns={employeeColumns}
            currentTab={activeTab}
            onTabChange={setActiveTab}
            loading={loading}
          />
        )}

        {activeTab === 'suppliers' && (
          <ManagementTable
            title="Lista de Proveedores"
            subtitle="Gestiona la información de tus socios comerciales."
            type="Proveedor"
            icon={Truck}
            data={proveedores}
            columns={supplierColumns}
            currentTab={activeTab}
            onTabChange={setActiveTab}
            loading={loading}
          />
        )}

        {activeTab === 'customers' && (
          <ManagementTable
            title="Lista de Clientes"
            subtitle="Base de datos de tus clientes facturables."
            type="Cliente"
            icon={Users}
            data={clientes}
            columns={customerColumns}
            currentTab={activeTab}
            onTabChange={setActiveTab}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};

export default GestionPersonas;
