package com.posfin.pos_finanzas_backend.services;

import com.posfin.pos_finanzas_backend.models.OrdenesWorkspace;
import com.posfin.pos_finanzas_backend.models.OrdenesDeVentas;
import com.posfin.pos_finanzas_backend.models.DetallesOrdenesDeVentas;
import com.posfin.pos_finanzas_backend.models.Inventarios;
import com.posfin.pos_finanzas_backend.models.MovimientosInventarios;
import com.posfin.pos_finanzas_backend.models.Personas;
import com.posfin.pos_finanzas_backend.models.Usuarios;
import com.posfin.pos_finanzas_backend.models.MetodosPago;
import com.posfin.pos_finanzas_backend.models.TipoMovimientos;
import com.posfin.pos_finanzas_backend.models.Ubicaciones;
import com.posfin.pos_finanzas_backend.dtos.OrdenesDeVentasDTO;
import com.posfin.pos_finanzas_backend.repositories.OrdenesWorkspaceRepository;
import com.posfin.pos_finanzas_backend.repositories.OrdenesDeVentasRepository;
import com.posfin.pos_finanzas_backend.repositories.DetallesOrdenesDeVentasRepository;
import com.posfin.pos_finanzas_backend.repositories.InventarioRepository;
import com.posfin.pos_finanzas_backend.repositories.MovimientosInventariosRepository;
import com.posfin.pos_finanzas_backend.repositories.PersonasRepository;
import com.posfin.pos_finanzas_backend.repositories.UsuariosRepository;
import com.posfin.pos_finanzas_backend.repositories.MetodosPagoRepository;
import com.posfin.pos_finanzas_backend.repositories.TIpoMovimientosRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Servicio para procesar ventas completas desde el carrito temporal
 * (ordenes_workspace)
 * hacia las órdenes de venta finales y actualización de inventario.
 */
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class VentaService {

    private static final Logger log = LoggerFactory.getLogger(VentaService.class);

    @Autowired
    private OrdenesWorkspaceRepository ordenesWorkspaceRepository;

    @Autowired
    private OrdenesDeVentasRepository ordenesDeVentasRepository;

    @Autowired
    private DetallesOrdenesDeVentasRepository detallesOrdenesDeVentasRepository;

    @Autowired
    private InventarioRepository inventarioRepository;

    @Autowired
    private MovimientosInventariosRepository movimientosInventariosRepository;

    @Autowired
    private PersonasRepository personasRepository;

    @Autowired
    private UsuariosRepository usuariosRepository;

    @Autowired
    private MetodosPagoRepository metodosPagoRepository;

    @Autowired
    private TIpoMovimientosRepository tipoMovimientosRepository;

    /**
     * Procesa una venta completa desde las órdenes de workspace.
     * Realiza todas las operaciones en una transacción para garantizar
     * consistencia.
     */
    public OrdenesDeVentasDTO procesarVentaDesdeWorkspace(String workspaceId, String clienteId,
            String usuarioId, String metodoPagoId) {
        long startTime = System.currentTimeMillis();
        log.info("LATENCY_TEST_START: procesarVentaDesdeWorkspace for workspaceId {}", workspaceId);

        // 1. Obtener todas las órdenes del workspace
        List<OrdenesWorkspace> ordenesWorkspace = ordenesWorkspaceRepository.findByWorkspaceId(workspaceId);

        if (ordenesWorkspace.isEmpty()) {
            throw new IllegalStateException("No hay productos en el carrito para procesar la venta");
        }

        // 2. Validar entidades requeridas
        Personas cliente = validarCliente(clienteId);
        Usuarios usuario = validarUsuario(usuarioId);
        MetodosPago metodoPago = validarMetodoPago(metodoPagoId);

        // 3. Calcular total de la venta
        BigDecimal totalVenta = calcularTotalVenta(ordenesWorkspace);

        // 4. Crear la orden de venta principal
        OrdenesDeVentas ordenVenta = crearOrdenVenta(cliente, usuario, metodoPago, totalVenta);

        // 5. Crear los detalles de la venta
        for (OrdenesWorkspace ordenWorkspace : ordenesWorkspace) {
            crearDetalleVenta(ordenVenta, ordenWorkspace);
            actualizarInventario(ordenWorkspace);
            crearMovimientoInventario(ordenWorkspace, usuario);
        }

        // 6. Limpiar órdenes del workspace
        ordenesWorkspaceRepository.deleteAll(ordenesWorkspace);

        // 7. Convertir a DTO y retornar
        OrdenesDeVentasDTO result = convertirADTO(ordenVenta);
        long endTime = System.currentTimeMillis();
        log.info("LATENCY_TEST_END: procesarVentaDesdeWorkspace for workspaceId {} took {} ms", workspaceId, endTime - startTime);
        return result;
    }

    /**
     * Obtiene un cliente por defecto si no se especifica uno.
     */
    public String obtenerClientePorDefecto() {
        // Buscar un cliente genérico o el primer cliente disponible
        List<Personas> clientes = personasRepository.findAll();
        if (clientes.isEmpty()) {
            throw new IllegalStateException("No hay clientes registrados en el sistema");
        }
        return clientes.get(0).getId(); // Retorna el primer cliente como predeterminado
    }

    // Métodos privados de utilidad

    private Personas validarCliente(String clienteId) {
        if (clienteId == null || clienteId.trim().isEmpty()) {
            // Si no se proporciona cliente, usar el cliente por defecto
            String clienteDefecto = obtenerClientePorDefecto();
            return personasRepository.findById(clienteDefecto)
                    .orElseThrow(() -> new IllegalArgumentException("Cliente por defecto no encontrado"));
        }
        return personasRepository.findById(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + clienteId));
    }

    private Usuarios validarUsuario(String usuarioId) {
        return usuariosRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + usuarioId));
    }

    private MetodosPago validarMetodoPago(String metodoPagoId) {
        return metodosPagoRepository.findById(metodoPagoId)
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado: " + metodoPagoId));
    }

    private BigDecimal calcularTotalVenta(List<OrdenesWorkspace> ordenesWorkspace) {
        return ordenesWorkspace.stream()
                .map(orden -> {
                    BigDecimal precio = orden.getHistorialPrecio().getPrecio();
                    BigDecimal cantidadTotal = BigDecimal.ZERO;

                    if (orden.getCantidadPz() != null) {
                        cantidadTotal = cantidadTotal.add(orden.getCantidadPz());
                    }
                    if (orden.getCantidadKg() != null) {
                        cantidadTotal = cantidadTotal.add(orden.getCantidadKg());
                    }

                    return precio.multiply(cantidadTotal);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private OrdenesDeVentas crearOrdenVenta(Personas cliente, Usuarios usuario, MetodosPago metodoPago,
            BigDecimal totalVenta) {
        OrdenesDeVentas ordenVenta = new OrdenesDeVentas();
        ordenVenta.setPersona(cliente);
        ordenVenta.setUsuario(usuario);
        ordenVenta.setMetodoPago(metodoPago);
        ordenVenta.setTotalVenta(totalVenta);
        ordenVenta.setFechaOrden(OffsetDateTime.now());

        return ordenesDeVentasRepository.save(ordenVenta);
    }

    private void crearDetalleVenta(OrdenesDeVentas ordenVenta, OrdenesWorkspace ordenWorkspace) {
        DetallesOrdenesDeVentas detalle = new DetallesOrdenesDeVentas();
        detalle.setOrdenDeVenta(ordenVenta);
        detalle.setProducto(ordenWorkspace.getProducto());
        detalle.setHistorialPrecio(ordenWorkspace.getHistorialPrecio());
        detalle.setCantidadPz(ordenWorkspace.getCantidadPz());
        detalle.setCantidadKg(ordenWorkspace.getCantidadKg());

        detallesOrdenesDeVentasRepository.save(detalle);
    }

    private void actualizarInventario(OrdenesWorkspace ordenWorkspace) {
        Optional<Inventarios> inventarioOpt = inventarioRepository.findByProducto(ordenWorkspace.getProducto());

        if (inventarioOpt.isEmpty()) {
            throw new IllegalStateException("No se encontró inventario para el producto: " +
                    ordenWorkspace.getProducto().getNombre());
        }

        Inventarios inventario = inventarioOpt.get();

        // Restar cantidades vendidas
        if (ordenWorkspace.getCantidadPz() != null && ordenWorkspace.getCantidadPz().compareTo(BigDecimal.ZERO) > 0) {
            int cantidadActualPz = inventario.getCantidadPz() != null ? inventario.getCantidadPz() : 0;
            int nuevaCantidadPz = cantidadActualPz - ordenWorkspace.getCantidadPz().intValue();
            inventario.setCantidadPz(Math.max(0, nuevaCantidadPz)); // No permitir valores negativos
        }

        if (ordenWorkspace.getCantidadKg() != null && ordenWorkspace.getCantidadKg().compareTo(BigDecimal.ZERO) > 0) {
            int cantidadActualKg = inventario.getCantidadKg() != null ? inventario.getCantidadKg() : 0;
            int nuevaCantidadKg = cantidadActualKg - ordenWorkspace.getCantidadKg().intValue();
            inventario.setCantidadKg(Math.max(0, nuevaCantidadKg)); // No permitir valores negativos
        }

        inventarioRepository.save(inventario);
    }

    private void crearMovimientoInventario(OrdenesWorkspace ordenWorkspace, Usuarios usuario) {
        // Buscar el tipo de movimiento "VENTA"
        Optional<TipoMovimientos> tipoVentaOpt = tipoMovimientosRepository.findByMovimiento("VENTA");
        if (tipoVentaOpt.isEmpty()) {
            throw new IllegalStateException("Tipo de movimiento 'VENTA' no encontrado en el sistema");
        }

        // Obtener la ubicación del inventario
        Optional<Inventarios> inventarioOpt = inventarioRepository.findByProducto(ordenWorkspace.getProducto());
        if (inventarioOpt.isEmpty()) {
            throw new IllegalStateException("No se encontró inventario para crear el movimiento");
        }

        Ubicaciones ubicacion = inventarioOpt.get().getUbicacion();

        // Calcular cantidad total para el movimiento
        BigDecimal cantidadTotal = BigDecimal.ZERO;
        if (ordenWorkspace.getCantidadPz() != null) {
            cantidadTotal = cantidadTotal.add(ordenWorkspace.getCantidadPz());
        }
        if (ordenWorkspace.getCantidadKg() != null) {
            cantidadTotal = cantidadTotal.add(ordenWorkspace.getCantidadKg());
        }

        // Crear el movimiento de inventario
        MovimientosInventarios movimiento = new MovimientosInventarios();
        movimiento.setProducto(ordenWorkspace.getProducto());
        movimiento.setUbicacion(ubicacion);
        movimiento.setTipoMovimiento(tipoVentaOpt.get());
        movimiento.setCantidad(cantidadTotal);
        movimiento.setFechaMovimiento(OffsetDateTime.now());
        movimiento.setUsuario(usuario);
        movimiento.setClaveMovimiento("VENTA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        movimientosInventariosRepository.save(movimiento);
    }

    private OrdenesDeVentasDTO convertirADTO(OrdenesDeVentas ordenVenta) {
        OrdenesDeVentasDTO dto = new OrdenesDeVentasDTO();
        dto.setId(ordenVenta.getId());
        dto.setFechaOrden(ordenVenta.getFechaOrden());
        dto.setTotalVenta(ordenVenta.getTotalVenta());

        // Mapear persona
        dto.setPersonaId(ordenVenta.getPersona().getId());
        dto.setPersonaNombre(ordenVenta.getPersona().getNombre());
        dto.setPersonaApellidoPaterno(ordenVenta.getPersona().getApellidoPaterno());
        dto.setPersonaApellidoMaterno(ordenVenta.getPersona().getApellidoMaterno());

        // Mapear usuario
        dto.setUsuarioId(ordenVenta.getUsuario().getId());
        dto.setUsuarioNombre(ordenVenta.getUsuario().getNombre());

        // Mapear método de pago
        dto.setMetodoPagoId(ordenVenta.getMetodoPago().getId());
        dto.setMetodoPagoNombre(ordenVenta.getMetodoPago().getMetodoPago());

        return dto;
    }
}
