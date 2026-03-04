import React, { useState, useEffect } from 'react';
import { workspaceService } from '@/services/apiService';
import TicketVenta from './TicketVenta';
import SidebarNavigation from '@/components/common/SidebarNavigation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  ChevronRight,
  Receipt,
  Clock,
  Users,
  DollarSign,
  Plus
} from 'lucide-react';
import type { WorkspaceStatus, TicketVenta as TicketVentaData, VentaFinalizada } from '@/types';
import './WorkspaceScreen.css';

interface WorkspaceScreenProps {
  onWorkspaceSelect: (workspaceId: string) => void;
  onBackToMainMenu?: () => void;
  onNavigate?: (section: string) => void;
}

const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({ 
  onWorkspaceSelect,
  onNavigate
}) => {
  const toast = useToast();
  const { logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceStatus[]>([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<WorkspaceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'occupied' | 'payment'>('all');
  
  // Estados para el flujo de ticket de venta
  const [ticketActual, setTicketActual] = useState<TicketVentaData | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      const data = await workspaceService.getAllWithStatus();
      setWorkspaces(data);
      setFilteredWorkspaces(data);
      setError(null);
    } catch (error) {
      setError('Error al cargar los workspaces');
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Efecto para filtrar workspaces cuando cambia el filtro activo
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredWorkspaces(workspaces);
    } else {
      const statusMap = {
        'available': 'disponible',
        'occupied': 'ocupado', 
        'payment': 'cuenta'
      };
      const filtered = workspaces.filter(ws => ws.estado === statusMap[activeFilter]);
      setFilteredWorkspaces(filtered);
    }
  }, [activeFilter, workspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWorkspaceName.trim()) {
      return;
    }

    setIsCreating(true);
    
    try {
      await workspaceService.create({
        nombre: newWorkspaceName.trim(),
        permanente: isPermanent
      });
      
      // Recargar la lista de workspaces
      await loadWorkspaces();
      
      // Resetear el modal
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setIsPermanent(false);
    } catch (error) {
      setError('Error al crear el workspace');
      console.error('Error creating workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Navegación del sidebar
  const handleSidebarNavigate = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    } else {
      console.warn('No hay función de navegación disponible para la sección:', section);
    }
  };

  // Obtener información de estado para el sistema de colores moderno
  const getWorkspaceCardStyle = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'workspace-card--available';
      case 'ocupado':
        return 'workspace-card--occupied';
      case 'cuenta':
        return 'workspace-card--payment';
      default:
        return 'workspace-card--available';
    }
  };

  // Obtener contadores para filtros
  const getFilterCounts = () => {
    const available = workspaces.filter(ws => ws.estado === 'disponible').length;
    const occupied = workspaces.filter(ws => ws.estado === 'ocupado').length;
    const payment = workspaces.filter(ws => ws.estado === 'cuenta').length;
    
    return {
      all: workspaces.length,
      available,
      occupied,
      payment
    };
  };

  const filterCounts = getFilterCounts();







  // Función para generar ticket de venta
  const handleGenerarTicket = async (workspaceId: string) => {
    try {
      const ticket = await workspaceService.generarTicket(workspaceId);
      setTicketActual(ticket);
      setShowTicketModal(true);
    } catch (error) {
      toast.showError(`Error al generar el ticket. Por favor, intente nuevamente.

👆 HAZ CLIC AQUÍ PARA CERRAR`);
      console.error('Error generating ticket:', error);
    }
  };

  // Función para manejar venta finalizada
  const handleVentaFinalizada = (venta: VentaFinalizada) => {
    setShowTicketModal(false);
    setTicketActual(null);
    
    toast.showSuccess(`🎉 VENTA PROCESADA EXITOSAMENTE

💳 ID: ${venta.ventaId}
💰 Total: $${venta.totalVenta.toFixed(2)}
🔄 Método: ${venta.metodoPagoNombre}

La transacción se ha completado correctamente.

👆 HAZ CLIC AQUÍ PARA CERRAR`);
    
    // ✅ ESPERAR 4 segundos antes de recargar para que el toast sea visible
    setTimeout(() => {
      loadWorkspaces();
    }, 4000);
  };

  // Función para cerrar modal de ticket
  const handleCerrarTicket = () => {
    setShowTicketModal(false);
    setTicketActual(null);
  };

  if (isLoading) {
    return (
      <div className="modern-workspaces">
        <SidebarNavigation 
          activeSection="workspaces"
          onNavigate={handleSidebarNavigate}
          onLogout={logout}
        />
        <div className="modern-workspaces__loading">
          <div className="modern-workspaces__loading-spinner">
            <div className="modern-workspaces__loading-icon"></div>
          </div>
          <h2 className="modern-workspaces__loading-text">Cargando workspaces...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-workspaces">
      {/* Sidebar Navigation */}
      <SidebarNavigation 
        activeSection="workspaces"
        onNavigate={handleSidebarNavigate}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="modern-workspaces__main">
        {/* Header */}
        <header className="modern-workspaces__header">
          <div className="modern-workspaces__header-content">
            <div className="modern-workspaces__title-section">
              <h1 className="modern-workspaces__title">Gestión de Mesas</h1>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="modern-workspaces__error" role="alert">
            <div className="modern-workspaces__error-content">
              <span>{error}</span>
              <button onClick={loadWorkspaces} className="modern-workspaces__retry-btn">
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="workspace-categories-carousel">
          {[
            { key: 'all', label: 'Todas', count: filterCounts.all },
            { key: 'occupied', label: 'Ocupadas', count: filterCounts.occupied },
            { key: 'payment', label: 'Pidiendo Cuenta', count: filterCounts.payment },
            { key: 'available', label: 'Disponibles', count: filterCounts.available }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`workspace-category-chip ${
                activeFilter === filter.key ? 'workspace-category-chip--active' : ''
              } workspace-category-chip--${filter.key}`}
            >
              <span className="modern-workspaces__filter-dot"></span>
              {filter.label}
              <span className="modern-workspaces__filter-count">({filter.count})</span>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredWorkspaces.length === 0 && !error && (
          <div className="modern-workspaces__empty">
            <div className="modern-workspaces__empty-icon">
              <Receipt className="w-16 h-16" />
            </div>
            <h2 className="modern-workspaces__empty-title">
              {activeFilter === 'all' ? 'No hay mesas disponibles' : `No hay mesas ${activeFilter === 'occupied' ? 'ocupadas' : activeFilter === 'payment' ? 'pidiendo cuenta' : 'disponibles'}`}
            </h2>
            <p className="modern-workspaces__empty-subtitle">
              {activeFilter === 'all' ? 'Crea tu primera mesa para comenzar' : 'Cambia el filtro para ver otras mesas'}
            </p>
            {activeFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="modern-workspaces__empty-btn"
              >
                Crear Mesa
              </button>
            )}
          </div>
        )}

        {/* Workspaces Grid */}
        {filteredWorkspaces.length > 0 && (
          <div className="modern-workspaces__grid">
            {filteredWorkspaces.map((workspace) => {
              const esCuenta = workspace.estado === 'cuenta';
              const cardStyle = getWorkspaceCardStyle(workspace.estado);
              
              if (esCuenta) {
                // Tarjeta especial para workspaces que piden cuenta
                return (
                  <div
                    key={workspace.id}
                    className={`modern-workspaces__card ${cardStyle}`}
                  >
                    <div className="modern-workspaces__card-header">
                      <div className="modern-workspaces__card-status">
                        <Receipt className="w-4 h-4" />
                        <span>Cuenta Solicitada</span>
                      </div>
                      {workspace.ultimaActividad && (
                        <div className="modern-workspaces__card-time">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(workspace.ultimaActividad).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="modern-workspaces__card-content">
                      <h3 className="modern-workspaces__card-title">{workspace.nombre}</h3>
                      <div className="modern-workspaces__card-meta">
                        <div className="modern-workspaces__card-stat">
                          <Users className="w-4 h-4" />
                          <span>{workspace.cantidadOrdenes} productos</span>
                        </div>
                        <div className="modern-workspaces__card-stat">
                          <DollarSign className="w-4 h-4" />
                          <span>${(workspace.cantidadOrdenes * 150).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modern-workspaces__card-actions">
                      <button
                        onClick={() => handleGenerarTicket(workspace.id)}
                        className="modern-workspaces__ticket-btn"
                      >
                        <Receipt className="w-4 h-4" />
                        Generar Ticket
                      </button>
                    </div>
                  </div>
                );
              }
              
              // Tarjetas normales para workspaces disponibles u ocupados
              return (
                <button
                  key={workspace.id}
                  onClick={() => onWorkspaceSelect(workspace.id)}
                  className={`modern-workspaces__card ${cardStyle}`}
                >
                  <div className="modern-workspaces__card-header">
                    <div className="modern-workspaces__card-status">
                      {workspace.estado === 'ocupado' && (
                        <>
                          <Users className="w-4 h-4" />
                          <span>Ocupado</span>
                        </>
                      )}
                      {workspace.estado === 'disponible' && (
                        <>
                          <div className="modern-workspaces__available-indicator"></div>
                          <span>Disponible</span>
                        </>
                      )}
                    </div>
                    {workspace.ultimaActividad && workspace.estado === 'ocupado' && (
                      <div className="modern-workspaces__card-time">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(workspace.ultimaActividad).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="modern-workspaces__card-content">
                    <h3 className="modern-workspaces__card-title">{workspace.nombre}</h3>
                    {workspace.estado === 'disponible' ? (
                      <div className="modern-workspaces__card-meta">
                        <div className="modern-workspaces__card-stat">
                          <span className="modern-workspaces__ready-text">Lista para usar</span>
                        </div>
                      </div>
                    ) : (
                      <div className="modern-workspaces__card-meta">
                        <div className="modern-workspaces__card-stat">
                          <Users className="w-4 h-4" />
                          <span>{workspace.cantidadOrdenes} productos</span>
                        </div>
                        <div className="modern-workspaces__card-stat">
                          <DollarSign className="w-4 h-4" />
                          <span>${(workspace.cantidadOrdenes * 150).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="modern-workspaces__card-footer">
                    <div className="modern-workspaces__card-type">
                      {workspace.permanente ? 'Permanente' : 'Temporal'}
                    </div>
                    <ChevronRight className="modern-workspaces__card-arrow w-5 h-5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Botón flotante para crear nueva mesa */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="modern-workspaces__fab"
          title="Crear Nueva Mesa"
        >
          <Plus className="w-6 h-6" />
        </button>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modern-workspaces__modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modern-workspaces__modal" onClick={(e) => e.stopPropagation()}>
            <div className="modern-workspaces__modal-header">
              <h2 className="modern-workspaces__modal-title">Crear Nueva Mesa</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modern-workspaces__modal-close"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateWorkspace} className="modern-workspaces__modal-form">
              <div className="modern-workspaces__modal-field">
                <label htmlFor="workspaceName" className="modern-workspaces__modal-label">
                  Nombre de la Mesa *
                </label>
                <input
                  type="text"
                  id="workspaceName"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="modern-workspaces__modal-input"
                  placeholder="Ej: Mesa 1, Terraza A, Barra 2"
                  required
                  disabled={isCreating}
                />
              </div>
              
              <div className="modern-workspaces__modal-checkbox">
                <label className="modern-workspaces__checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="modern-workspaces__checkbox"
                    disabled={isCreating}
                  />
                  <span className="modern-workspaces__checkbox-indicator"></span>
                  <div className="modern-workspaces__checkbox-text">
                    <span>Mesa Permanente</span>
                    <span>Esta mesa no se eliminará automáticamente</span>
                  </div>
                </label>
              </div>
              
              <div className="modern-workspaces__modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="modern-workspaces__modal-cancel"
                  disabled={isCreating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modern-workspaces__modal-submit"
                  disabled={isCreating || !newWorkspaceName.trim()}
                >
                  {isCreating ? (
                    <>
                      <div className="modern-workspaces__loading-icon"></div>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Crear Mesa</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ticket de Venta */}
      {showTicketModal && ticketActual && (
        <TicketVenta
          ticket={ticketActual}
          onVentaFinalizada={handleVentaFinalizada}
          onCerrar={handleCerrarTicket}
        />
      )}
    </div>
  );
};

export default WorkspaceScreen;
