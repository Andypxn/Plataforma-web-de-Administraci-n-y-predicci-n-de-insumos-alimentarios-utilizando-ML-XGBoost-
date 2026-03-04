import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Clock, 
  Target,
  RefreshCw,
  Brain,
  Activity,
  X
} from 'lucide-react';
import { mlService, useMLPredictions } from '@/features/inventory/services/mlService';
import './ModalPredicciones.css';

interface ModalPrediccionesProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePurchaseOrder?: (productos: any[]) => void;
}

const ModalPredicciones: React.FC<ModalPrediccionesProps> = ({
  isOpen,
  onClose,
  onCreatePurchaseOrder
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'prioridad' | 'cantidad' | 'confianza'>('prioridad');
  const [formattedPredictions, setFormattedPredictions] = useState<Array<{
    id: string;
    nombre: string;
    categoria: string;
    cantidadSugerida: number;
    prioridad: 'Alta' | 'Media' | 'Baja';
    prioridadScore: number;
    stockActual: number;
    diasStock: number | null;
    confianza: string;
    recomendacion: string;
  }>>([]);
  
  const {
    predictions,
    loading,
    error,
    isMLAvailable,
    loadPredictions
  } = useMLPredictions();

  // Cargar predicciones cuando se abre el modal
  useEffect(() => {
    if (isOpen && isMLAvailable) {
      loadPredictions();
    }
  }, [isOpen, isMLAvailable]);

  // Formatear predicciones cuando cambian
  useEffect(() => {
    const formatPredictions = async () => {
      if (predictions.length > 0) {
        const formatted = await mlService.formatPredictionsForDisplay({
          predicciones: predictions,
          timestamp: new Date().toISOString(),
          modelo_version: '1.0.0'
        });
        setFormattedPredictions(formatted);
      } else {
        setFormattedPredictions([]);
      }
    };

    formatPredictions();
  }, [predictions]);

  if (!isOpen) return null;

  // Filtrar y ordenar predicciones
  const filteredAndSorted = formattedPredictions
    .filter(pred => !filterCategory || pred.categoria.includes(filterCategory))
    .sort((a, b) => {
      switch (sortBy) {
        case 'prioridad':
          return b.prioridadScore - a.prioridadScore;
        case 'cantidad':
          return b.cantidadSugerida - a.cantidadSugerida;
        case 'confianza':
          return parseFloat(b.confianza) - parseFloat(a.confianza);
        default:
          return 0;
      }
    });

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'filterCategory') {
      setFilterCategory(value);
    } else if (name === 'sortBy') {
      setSortBy(value as 'prioridad' | 'cantidad' | 'confianza');
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredAndSorted.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredAndSorted.map(p => p.id)));
    }
  };

  const handleCreatePurchaseOrder = () => {
    const selectedPredictions = filteredAndSorted.filter(p => selectedProducts.has(p.id));
    if (onCreatePurchaseOrder) {
      onCreatePurchaseOrder(selectedPredictions);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedProducts(new Set());
    setFilterCategory('');
    setSortBy('prioridad');
    onClose();
  };

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta': return <AlertTriangle size={16} />;
      case 'Media': return <Clock size={16} />;
      case 'Baja': return <Target size={16} />;
      default: return <Package size={16} />;
    }
  };

  return (
    <>
      {isOpen && (
        <div className="modal-predicciones-overlay" onClick={handleClose}>
          <div className="modal-predicciones" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-predicciones__header">
              <div className="modal-predicciones__header-content">
                <div className="modal-predicciones__icon">
                  <Brain size={24} />
                </div>
                <div className="modal-predicciones__title-group">
                  <h2 className="modal-predicciones__title">Predicciones de Compra ML</h2>
                  <p className="modal-predicciones__subtitle">Sistema inteligente de recomendaciones de abastecimiento</p>
                </div>
              </div>
              <button className="modal-predicciones__close-btn" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Alert - ML Service Status */}
            {!isMLAvailable && (
              <div className="modal-predicciones__alert">
                <Activity size={20} className="modal-predicciones__alert-icon" />
                El servicio de Machine Learning no está disponible. Las predicciones podrían estar limitadas.
              </div>
            )}

            {/* Controls */}
            <div className="modal-predicciones__controls">
              <div className="modal-predicciones__filters">
                <div className="modal-predicciones__filter">
                  <label className="modal-predicciones__filter-label">Filtrar por categoría</label>
                  <select
                    className="modal-predicciones__select"
                    name="filterCategory"
                    value={filterCategory}
                    onChange={handleSelectChange}
                  >
                    <option value="">Todas las categorías</option>
                    {Array.from(new Set(formattedPredictions.map(p => p.categoria))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-predicciones__filter">
                  <label className="modal-predicciones__filter-label">Ordenar por</label>
                  <select
                    className="modal-predicciones__select"
                    name="sortBy"
                    value={sortBy}
                    onChange={handleSelectChange}
                    style={{ minWidth: '150px' }}
                  >
                    <option value="prioridad">Prioridad</option>
                    <option value="cantidad">Cantidad sugerida</option>
                    <option value="confianza">Confianza</option>
                  </select>
                </div>
              </div>

              <div className="modal-predicciones__actions">
                <button
                  className="modal-predicciones__btn modal-predicciones__btn--refresh"
                  onClick={() => loadPredictions()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="modal-predicciones__loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Actualizar
                    </>
                  )}
                </button>

                <button
                  className="modal-predicciones__btn modal-predicciones__btn--select"
                  onClick={handleSelectAll}
                >
                  {selectedProducts.size === filteredAndSorted.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="modal-predicciones__content">
              {loading ? (
                <div className="modal-predicciones__loading">
                  <div className="modal-predicciones__loading-spinner" />
                  <p className="modal-predicciones__loading-text">Generando predicciones...</p>
                </div>
              ) : error ? (
                <div className="modal-predicciones__error">
                  <div className="modal-predicciones__error-title">
                    <AlertTriangle size={20} />
                    Error al obtener predicciones
                  </div>
                  <p className="modal-predicciones__error-message">{error}</p>
                  <button className="modal-predicciones__error-btn" onClick={() => loadPredictions()}>
                    Reintentar
                  </button>
                </div>
              ) : filteredAndSorted.length === 0 ? (
                <div className="modal-predicciones__empty">
                  <Package size={48} className="modal-predicciones__empty-icon" />
                  <p className="modal-predicciones__empty-text">No se encontraron predicciones para mostrar</p>
                </div>
              ) : (
                <div className="modal-predicciones__table-wrapper">
                  <table className="modal-predicciones__table">
                    <thead className="modal-predicciones__table-head">
                      <tr>
                        <th className="modal-predicciones__table-th modal-predicciones__table-th--checkbox">
                          <input
                            type="checkbox"
                            className="modal-predicciones__checkbox"
                            checked={selectedProducts.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="modal-predicciones__table-th">Producto</th>
                        <th className="modal-predicciones__table-th modal-predicciones__table-th--center">Cantidad Sugerida</th>
                        <th className="modal-predicciones__table-th modal-predicciones__table-th--center">Prioridad</th>
                        <th className="modal-predicciones__table-th modal-predicciones__table-th--center">Stock Actual</th>
                        <th className="modal-predicciones__table-th modal-predicciones__table-th--center">Confianza</th>
                        <th className="modal-predicciones__table-th">Recomendación</th>
                      </tr>
                    </thead>
                    <tbody className="modal-predicciones__table-body">
                      {filteredAndSorted.map((prediccion) => (
                        <tr key={prediccion.id} className="modal-predicciones__table-row">
                          <td className="modal-predicciones__table-td">
                            <input
                              type="checkbox"
                              className="modal-predicciones__checkbox"
                              checked={selectedProducts.has(prediccion.id)}
                              onChange={() => handleSelectProduct(prediccion.id)}
                            />
                          </td>
                          <td className="modal-predicciones__table-td">
                            <div className="modal-predicciones__product">
                              <span className="modal-predicciones__product-name">{prediccion.nombre}</span>
                              <span className="modal-predicciones__product-category">{prediccion.categoria}</span>
                            </div>
                          </td>
                          <td className="modal-predicciones__table-td modal-predicciones__table-td--center">
                            <div className="modal-predicciones__quantity">
                              <TrendingUp size={16} color="#3B82F6" />
                              <span className="modal-predicciones__quantity-value">{prediccion.cantidadSugerida}</span>
                            </div>
                          </td>
                          <td className="modal-predicciones__table-td modal-predicciones__table-td--center">
                            <span className={`modal-predicciones__priority-badge modal-predicciones__priority-badge--${prediccion.prioridad.toLowerCase()}`}>
                              {getPriorityIcon(prediccion.prioridad)}
                              {prediccion.prioridad}
                            </span>
                          </td>
                          <td className="modal-predicciones__table-td modal-predicciones__table-td--center">
                            <span className={prediccion.stockActual === 0 ? 'modal-predicciones__stock modal-predicciones__stock--zero' : 'modal-predicciones__stock'}>
                              {prediccion.stockActual} pz
                            </span>
                          </td>
                          <td className="modal-predicciones__table-td modal-predicciones__table-td--center">
                            <span className="modal-predicciones__confidence">{prediccion.confianza}</span>
                          </td>
                          <td className="modal-predicciones__table-td">
                            <span className="modal-predicciones__recommendation">{prediccion.recomendacion}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-predicciones__footer">
              <div className="modal-predicciones__selection-info">
                {selectedProducts.size > 0 && (
                  <>
                    <span className="modal-predicciones__selection-badge"></span>
                    {selectedProducts.size} productos seleccionados
                  </>
                )}
              </div>
              <div className="modal-predicciones__footer-actions">
                <button className="modal-predicciones__btn modal-predicciones__btn--close" onClick={handleClose}>
                  Cerrar
                </button>
                {selectedProducts.size > 0 && onCreatePurchaseOrder && (
                  <button
                    className="modal-predicciones__btn modal-predicciones__btn--create"
                    onClick={handleCreatePurchaseOrder}
                  >
                    Crear Orden de Compra ({selectedProducts.size})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalPredicciones;