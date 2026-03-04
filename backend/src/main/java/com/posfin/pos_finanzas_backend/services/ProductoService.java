package com.posfin.pos_finanzas_backend.services;

import com.posfin.pos_finanzas_backend.dtos.ProductoCreacionDTO;
import com.posfin.pos_finanzas_backend.dtos.ProductosDTO;
import com.posfin.pos_finanzas_backend.models.*;
import com.posfin.pos_finanzas_backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ProductoService {

    private static final Logger log = LoggerFactory.getLogger(ProductoService.class);

    @Autowired
    private ProductosRepository productosRepository;

    @Autowired
    private CategoriasProductosRepository categoriasProductosRepository;

    @Autowired
    private PersonasRepository personasRepository;

    @Autowired
    private EstadosRepository estadosRepository;

    @Autowired
    private HistorialPreciosRepository historialPreciosRepository;

    @Autowired
    private HistorialCostosRepository historialCostosRepository;

    @Autowired
    private InventarioRepository inventarioRepository;

    @Autowired
    private MovimientosInventariosRepository movimientosInventariosRepository;

    @Autowired
    private UbicacionesRepository ubicacionesRepository;

    @Autowired
    private TIpoMovimientosRepository tipoMovimientosRepository;

    @Autowired
    private UsuariosRepository usuariosRepository;

    @Transactional
    public ProductosDTO crearProductoCompleto(ProductoCreacionDTO dto) {
        long startTime = System.currentTimeMillis();
        log.info("LATENCY_TEST_START: crearProductoCompleto");
        // 1. Validar que todas las entidades relacionadas existan
        Optional<CategoriasProductos> categoria = categoriasProductosRepository
                .findById(dto.getCategoriasProductosId());
        Optional<Personas> proveedor = personasRepository.findById(dto.getProveedorId());
        Optional<Ubicaciones> ubicacion = ubicacionesRepository.findById(dto.getUbicacionId());
        Optional<Usuarios> usuario = usuariosRepository.findById(dto.getUsuarioId());

        if (categoria.isEmpty()) {
            throw new RuntimeException("Categoría no encontrada con ID: " + dto.getCategoriasProductosId());
        }
        if (proveedor.isEmpty()) {
            throw new RuntimeException("Proveedor no encontrado con ID: " + dto.getProveedorId());
        }
        if (ubicacion.isEmpty()) {
            throw new RuntimeException("Ubicación no encontrada con ID: " + dto.getUbicacionId());
        }
        if (usuario.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado con ID: " + dto.getUsuarioId());
        }

        // Buscar el estado "Activo" - asumiendo que existe uno con ese nombre
        Optional<Estados> estadoActivo = estadosRepository.findAll().stream()
                .filter(estado -> "Activo".equalsIgnoreCase(estado.getEstado()))
                .findFirst();

        if (estadoActivo.isEmpty()) {
            throw new RuntimeException("Estado 'Activo' no encontrado en la base de datos");
        }

        // Buscar el tipo de movimiento "Creación" - asumiendo que existe uno con ese
        // nombre
        Optional<TipoMovimientos> tipoCreacion = tipoMovimientosRepository.findAll().stream()
                .filter(tipo -> "Creación".equalsIgnoreCase(tipo.getMovimiento()) ||
                        "Creacion".equalsIgnoreCase(tipo.getMovimiento()) ||
                        "Inicial".equalsIgnoreCase(tipo.getMovimiento()))
                .findFirst();

        if (tipoCreacion.isEmpty()) {
            throw new RuntimeException("Tipo de movimiento 'Creación' no encontrado en la base de datos");
        }

        // 2. Crear y guardar el producto
        Productos nuevoProducto = new Productos();
        nuevoProducto.setNombre(dto.getNombre());
        nuevoProducto.setCategoriasProductos(categoria.get());
        nuevoProducto.setProveedor(proveedor.get());
        nuevoProducto.setEstados(estadoActivo.get());

        Productos productoGuardado = productosRepository.save(nuevoProducto);

        // 3. Crear y guardar el historial de precios
        HistorialPrecios historialPrecio = new HistorialPrecios();
        historialPrecio.setProductos(productoGuardado);
        historialPrecio.setPrecio(dto.getPrecioVenta());
        historialPrecio.setFechaDeRegistro(ZonedDateTime.now());
        historialPreciosRepository.save(historialPrecio);

        // 4. Crear y guardar el historial de costos
        HistorialCostos historialCosto = new HistorialCostos();
        historialCosto.setProductos(productoGuardado);
        historialCosto.setCosto(dto.getPrecioCompra());
        historialCosto.setFechaDeRegistro(ZonedDateTime.now());
        historialCostosRepository.save(historialCosto);

        // 5. Crear y guardar el inventario inicial
        Inventarios nuevoInventario = new Inventarios();
        nuevoInventario.setProducto(productoGuardado);
        nuevoInventario.setUbicacion(ubicacion.get());

        // Asignar la cantidad según la unidad de medida
        if ("piezas".equalsIgnoreCase(dto.getUnidadMedida())) {
            nuevoInventario.setCantidadPz(dto.getStockInicial());
            nuevoInventario.setCantidadKg(0);
        } else {
            nuevoInventario.setCantidadKg(dto.getStockInicial());
            nuevoInventario.setCantidadPz(0);
        }

        nuevoInventario.setCantidadMinima(dto.getStockMinimo());
        nuevoInventario.setCantidadMaxima(dto.getStockMaximo());
        inventarioRepository.save(nuevoInventario);

        // 6. Crear y guardar el movimiento de inventario inicial
        MovimientosInventarios movimientoInicial = new MovimientosInventarios();
        movimientoInicial.setProducto(productoGuardado);
        movimientoInicial.setUbicacion(ubicacion.get());
        movimientoInicial.setTipoMovimiento(tipoCreacion.get());
        movimientoInicial.setCantidad(BigDecimal.valueOf(dto.getStockInicial()));
        movimientoInicial.setFechaMovimiento(OffsetDateTime.now());
        movimientoInicial.setUsuario(usuario.get());
        movimientoInicial.setClaveMovimiento("CREACION-" + productoGuardado.getId().substring(0, 8));
        movimientosInventariosRepository.save(movimientoInicial);

        // 7. Convertir a DTO y retornar
        ProductosDTO result = convertToDTO(productoGuardado);
        long endTime = System.currentTimeMillis();
        log.info("LATENCY_TEST_END: crearProductoCompleto took {} ms", endTime - startTime);
        return result;
    }

    @Transactional
    public ProductosDTO desactivarProducto(String productoId) {
        Optional<Productos> productoOpt = productosRepository.findById(productoId);
        if (productoOpt.isEmpty()) {
            throw new RuntimeException("Producto no encontrado con ID: " + productoId);
        }

        // Buscar el estado "Inactivo"
        Optional<Estados> estadoInactivo = estadosRepository.findAll().stream()
                .filter(estado -> "Inactivo".equalsIgnoreCase(estado.getEstado()))
                .findFirst();

        if (estadoInactivo.isEmpty()) {
            throw new RuntimeException("Estado 'Inactivo' no encontrado en la base de datos");
        }

        Productos producto = productoOpt.get();
        producto.setEstados(estadoInactivo.get());
        Productos productoActualizado = productosRepository.save(producto);

        return convertToDTO(productoActualizado);
    }

    @Transactional
    public void registrarMovimientoEdicion(String productoId, String usuarioId, String motivo) {
        // Buscar el producto
        Optional<Productos> productoOpt = productosRepository.findById(productoId);
        if (productoOpt.isEmpty()) {
            throw new RuntimeException("Producto no encontrado con ID: " + productoId);
        }

        // Buscar el usuario (por ahora usar el primero disponible si no se proporciona)
        Optional<Usuarios> usuarioOpt;
        if (usuarioId != null && !usuarioId.isEmpty()) {
            usuarioOpt = usuariosRepository.findById(usuarioId);
        } else {
            usuarioOpt = usuariosRepository.findAll().stream().findFirst();
        }

        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado");
        }

        // Buscar una ubicación (usar la primera disponible)
        Optional<Ubicaciones> ubicacionOpt = ubicacionesRepository.findAll().stream().findFirst();
        if (ubicacionOpt.isEmpty()) {
            throw new RuntimeException("No hay ubicaciones disponibles");
        }

        // Buscar o crear el tipo de movimiento "Edición"
        Optional<TipoMovimientos> tipoEdicion = tipoMovimientosRepository.findByMovimiento("Edición");
        if (tipoEdicion.isEmpty()) {
            tipoEdicion = tipoMovimientosRepository.findByMovimiento("Edicion");
        }
        if (tipoEdicion.isEmpty()) {
            tipoEdicion = tipoMovimientosRepository.findByMovimiento("Modificación");
        }
        if (tipoEdicion.isEmpty()) {
            tipoEdicion = tipoMovimientosRepository.findByMovimiento("Modificacion");
        }

        if (tipoEdicion.isEmpty()) {
            // Crear el tipo de movimiento si no existe
            TipoMovimientos nuevoTipo = new TipoMovimientos();
            nuevoTipo.setMovimiento("Edición");
            tipoEdicion = Optional.of(tipoMovimientosRepository.save(nuevoTipo));
        }

        // Crear el movimiento de inventario
        MovimientosInventarios movimientoEdicion = new MovimientosInventarios();
        movimientoEdicion.setProducto(productoOpt.get());
        movimientoEdicion.setUbicacion(ubicacionOpt.get());
        movimientoEdicion.setTipoMovimiento(tipoEdicion.get());
        movimientoEdicion.setCantidad(BigDecimal.ZERO); // Para ediciones la cantidad es 0
        movimientoEdicion.setFechaMovimiento(OffsetDateTime.now());
        movimientoEdicion.setUsuario(usuarioOpt.get());
        
        String claveMovimiento = "EDICION-" + productoOpt.get().getId().substring(0, 8);
        if (motivo != null && !motivo.isEmpty()) {
            claveMovimiento += "-" + motivo.toUpperCase().replace(" ", "_");
        }
        movimientoEdicion.setClaveMovimiento(claveMovimiento);
        
        movimientosInventariosRepository.save(movimientoEdicion);
    }

    // Método auxiliar para convertir Productos a ProductosDTO con información
    // adicional
    public ProductosDTO convertToDTO(Productos producto) {
        ProductosDTO dto = new ProductosDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());

        // Mapear relación con CategoriasProductos
        if (producto.getCategoriasProductos() != null) {
            dto.setCategoriasProductosId(producto.getCategoriasProductos().getId());
            dto.setCategoriasProductosCategoria(producto.getCategoriasProductos().getCategoria());
        }

        // Mapear relación con Proveedor (Personas)
        if (producto.getProveedor() != null) {
            dto.setProveedorId(producto.getProveedor().getId());
            dto.setProveedorNombre(producto.getProveedor().getNombre());
            dto.setProveedorApellidoPaterno(producto.getProveedor().getApellidoPaterno());
            dto.setProveedorApellidoMaterno(producto.getProveedor().getApellidoMaterno());
        }

        // Mapear relación con Estados
        if (producto.getEstados() != null) {
            dto.setEstadosId(producto.getEstados().getId());
            dto.setEstadosEstado(producto.getEstados().getEstado());
        }

        // Obtener el precio de venta más reciente
        Optional<HistorialPrecios> precioActual = historialPreciosRepository.findLatestByProducto(producto);
        if (precioActual.isPresent()) {
            dto.setPrecioVentaActual(precioActual.get().getPrecio());
        } else {
            dto.setPrecioVentaActual(BigDecimal.ZERO); // Valor por defecto
        }

        // Obtener el costo de compra más reciente
        Optional<HistorialCostos> costoActual = historialCostosRepository.findLatestByProducto(producto);
        if (costoActual.isPresent()) {
            dto.setPrecioCompraActual(costoActual.get().getCosto());
        } else {
            dto.setPrecioCompraActual(BigDecimal.ZERO); // Valor por defecto
        }

        // Obtener datos de inventario
        Optional<Inventarios> inventario = inventarioRepository.findByProducto(producto);
        if (inventario.isPresent()) {
            Inventarios inv = inventario.get();
            // Calcular stock total (piezas + kg)
            int stockTotal = (inv.getCantidadPz() != null ? inv.getCantidadPz() : 0) +
                    (inv.getCantidadKg() != null ? inv.getCantidadKg() : 0);
            dto.setCantidadInventario(stockTotal);
        } else {
            dto.setCantidadInventario(0); // Valor por defecto
        }

        return dto;
    }
}
