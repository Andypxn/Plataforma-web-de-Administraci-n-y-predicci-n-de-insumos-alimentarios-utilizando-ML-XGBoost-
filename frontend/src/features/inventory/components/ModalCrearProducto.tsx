import React, { useState, useEffect } from 'react';
import { inventarioService } from '@/features/inventory/services/inventarioService';
import type { ProductoCreacionRequest, CategoriaDTO, ProveedorDTO, UbicacionDTO } from '@/features/inventory/services/inventarioService';
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

interface ModalCrearProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCrearProducto: React.FC<ModalCrearProductoProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<ProductoCreacionRequest>({
    nombre: '',
    categoriasProductosId: '',
    proveedorId: '',
    precioVenta: 0,
    precioCompra: 0,
    unidadMedida: 'piezas',
    stockInicial: 0,
    ubicacionId: '',
    stockMinimo: 0,
    stockMaximo: 0,
    usuarioId: '' // Will be populated when loading dropdown data
  });

  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    try {
      const [categoriasData, proveedoresData, ubicacionesData, usuarioId] = await Promise.all([
        inventarioService.getAllCategorias(),
        inventarioService.getAllProveedores(),
        inventarioService.getAllUbicaciones(),
        inventarioService.getFirstAvailableUser()
      ]);
      
      setCategorias(categoriasData);
      setProveedores(proveedoresData);
      setUbicaciones(ubicacionesData);
      
      // Set the user ID from the first available user
      setFormData(prev => ({
        ...prev,
        usuarioId: usuarioId
      }));
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      setError('Error al cargar los datos del formulario');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | number>) => {
    const target = e.target as HTMLInputElement; // Asumir estructura de input para simplicidad
    const { name, value } = target;
    
    setFormData(prev => ({
      ...prev,
      [name as string]: ['precioVenta', 'precioCompra', 'stockInicial', 'stockMinimo', 'stockMaximo'].includes(name as string)
        ? parseFloat(value as string) || 0
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate required fields
    if (!formData.nombre.trim()) {
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

    if (!formData.ubicacionId) {
      setError('Debe seleccionar una ubicación');
      setLoading(false);
      return;
    }

    if (formData.precioVenta <= 0) {
      setError('El precio de venta debe ser mayor a 0');
      setLoading(false);
      return;
    }

    if (formData.precioCompra <= 0) {
      setError('El precio de compra debe ser mayor a 0');
      setLoading(false);
      return;
    }

    try {
      await inventarioService.createProductoCompleto(formData);
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Error al crear el producto. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoriasProductosId: '',
      proveedorId: '',
      precioVenta: 0,
      precioCompra: 0,
      unidadMedida: 'piezas',
      stockInicial: 0,
      ubicacionId: '',
      stockMinimo: 0,
      stockMaximo: 0,
      usuarioId: '' // Will be populated when modal opens again
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear Nuevo Producto</DialogTitle>
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
          value={formData.nombre}
          onChange={handleInputChange}
          required
          disabled={loading}
        />
        <FormControl fullWidth margin="dense" required disabled={loading}>
          <InputLabel>Categoría</InputLabel>
          <Select
            name="categoriasProductosId"
            value={formData.categoriasProductosId}
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
            value={formData.proveedorId}
            label="Proveedor"
            onChange={handleInputChange}
          >
            {proveedores.map((proveedor) => (
              <MenuItem key={proveedor.id} value={proveedor.id}>
                {proveedor.nombreCompleto || `${proveedor.nombre} ${proveedor.apellidoPaterno || ''}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          name="precioCompra"
          label="Precio de Compra"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.precioCompra}
          onChange={handleInputChange}
          required
          disabled={loading}
        />
        <TextField
          margin="dense"
          name="precioVenta"
          label="Precio de Venta"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.precioVenta}
          onChange={handleInputChange}
          required
          disabled={loading}
        />
        <FormControl fullWidth margin="dense" required disabled={loading}>
          <InputLabel>Unidad de Medida</InputLabel>
          <Select
            name="unidadMedida"
            value={formData.unidadMedida}
            label="Unidad de Medida"
            onChange={handleInputChange}
          >
            <MenuItem value="piezas">Piezas</MenuItem>
            <MenuItem value="kilogramos">Kilogramos</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense" required disabled={loading}>
          <InputLabel>Ubicación</InputLabel>
          <Select
            name="ubicacionId"
            value={formData.ubicacionId}
            label="Ubicación"
            onChange={handleInputChange}
          >
            {ubicaciones.map((ubicacion) => (
              <MenuItem key={ubicacion.id} value={ubicacion.id}>
                {ubicacion.ubicacion}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          name="stockInicial"
          label="Stock Inicial"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.stockInicial}
          onChange={handleInputChange}
          disabled={loading}
        />
        <TextField
          margin="dense"
          name="stockMinimo"
          label="Stock Mínimo"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.stockMinimo}
          onChange={handleInputChange}
          disabled={loading}
        />
        <TextField
          margin="dense"
          name="stockMaximo"
          label="Stock Máximo"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.stockMaximo}
          onChange={handleInputChange}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Crear Producto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalCrearProducto;
