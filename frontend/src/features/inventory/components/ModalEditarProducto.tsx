import React, { useState, useEffect } from 'react';
import { inventarioService } from '@/features/inventory/services/inventarioService';
import type { ProductoDTO, CategoriaDTO, ProveedorDTO } from '@/features/inventory/services/inventarioService';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  type SelectChangeEvent,
} from '@mui/material';

interface ModalEditarProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: ProductoDTO | null;
}

const ModalEditarProducto: React.FC<ModalEditarProductoProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  producto 
}) => {
  const [formData, setFormData] = useState<Partial<ProductoDTO>>({});
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load form data when modal opens or producto changes
  useEffect(() => {
    if (isOpen && producto) {
      setFormData({
        id: producto.id,
        nombre: producto.nombre,
        categoriasProductosId: producto.categoriasProductosId || '',
        proveedorId: producto.proveedorId || '',
        precioVentaActual: producto.precioVentaActual || 0,
        precioCompraActual: producto.precioCompraActual || 0,
      });
      loadDropdownData();
    }
  }, [isOpen, producto]);

  const loadDropdownData = async () => {
    try {
      const [categoriasData, proveedoresData] = await Promise.all([
        inventarioService.getAllCategorias(),
        inventarioService.getAllProveedores()
      ]);
      
      setCategorias(categoriasData);
      setProveedores(proveedoresData);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      setError('Error al cargar los datos del formulario');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name as string]: ['precioVentaActual', 'precioCompraActual'].includes(name as string)
        ? parseFloat(value as string) || 0
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!producto) return;
    
    setError(null);
    setLoading(true);

    // Validate required fields
    if (!formData.nombre?.trim()) {
      setError('El nombre del producto es requerido');
      setLoading(false);
      return;
    }

    if (!formData.categoriasProductosId) {
      setError('Debe seleccionar una categoría');
      setLoading(false);
      return;
    }

    if (!formData.proveedorId) {
      setError('Debe seleccionar un proveedor');
      setLoading(false);
      return;
    }

    try {
      await inventarioService.updateProducto(producto.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Error al actualizar el producto. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError(null);
    onClose();
  };

  if (!isOpen || !producto) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Producto</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          name="nombre"
          label="Nombre del Producto"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.nombre || ''}
          onChange={handleInputChange}
          required
          disabled={loading}
        />
        <FormControl fullWidth margin="dense" required disabled={loading}>
          <InputLabel>Categoría</InputLabel>
          <Select
            name="categoriasProductosId"
            value={formData.categoriasProductosId || ''}
            label="Categoría"
            onChange={handleInputChange}
          >
            {categorias.map((categoria) => (
              <MenuItem key={categoria.id} value={categoria.id}>
                {categoria.categoria}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense" required disabled={loading}>
          <InputLabel>Proveedor</InputLabel>
          <Select
            name="proveedorId"
            value={formData.proveedorId || ''}
            label="Proveedor"
            onChange={handleInputChange}
          >
            {proveedores.map((proveedor) => (
              <MenuItem key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre} {proveedor.apellidoPaterno || ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          name="precioCompraActual"
          label="Precio de Compra Actual"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.precioCompraActual || 0}
          onChange={handleInputChange}
          disabled={loading}
        />
        <TextField
          margin="dense"
          name="precioVentaActual"
          label="Precio de Venta Actual"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.precioVentaActual || 0}
          onChange={handleInputChange}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Actualizar Producto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalEditarProducto;
