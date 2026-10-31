package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.grpc.vehicle.VehiculoIdRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoResponse;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlAlquiler;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlClienteReserva;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlReserva;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlVehiculo;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlVehiculoReserva;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.VehiculoResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.grpc.GrpcClientManager;
import com.unla.grupol.rentar.rentar_dssd.grpc.ReservaGrpcMapper;
import customer.Customer.ClienteResponse;
import customer.Customer.ConsultarClienteRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import rental.Rental.ConsultarHistorialRequest;
import rental.Rental.ConsultarReservasRequest;
import rental.Rental.ConsultarVehiculosOcupadosRequest;
import rental.Rental.ListaReservasResponse;
import rental.Rental.ReservaResponse;
import rental.Rental.VehiculosOcupadosResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GraphQlConsultaService {

    private static final Logger log = LoggerFactory.getLogger(GraphQlConsultaService.class);

    private final VehiculoService vehiculoService;
    private final ClienteService clienteService;
    private final GrpcClientManager grpcClientManager;
    private final ReservaGrpcMapper reservaGrpcMapper;

    public List<GraphQlVehiculo> obtenerTodosLosVehiculos() {
        return vehiculoService.getAllVehiculos(true).stream()
                .map(this::convertirAVehiculoGraphQl)
                .toList();
    }

    public List<GraphQlVehiculo> consultarDisponibilidad(
            TipoVehiculo tipo,
            String marca,
            String modelo,
            Integer precioMin,
            Integer precioMax,
            String fechaInicio,
            String fechaFin
    ) {
        LocalDateTime inicio = parsearFecha(fechaInicio, "fechaInicio");
        LocalDateTime fin = parsearFecha(fechaFin, "fechaFin");

        validarRango(inicio, fin);

        if (precioMin != null && precioMax != null && precioMin > precioMax) {
            throw new IllegalArgumentException(
                    "El precio mínimo no puede ser mayor al precio máximo"
            );
        }

        // Consultar vehículos ocupados en Rental Service con fechas ISO-8601 UTC
        String inicioIso = reservaGrpcMapper.toIsoUtcString(inicio);
        String finIso = reservaGrpcMapper.toIsoUtcString(fin);

        VehiculosOcupadosResponse ocupadosResponse;
        try {
            ocupadosResponse = grpcClientManager.getRentalStub().consultarVehiculosOcupados(
                    ConsultarVehiculosOcupadosRequest.newBuilder()
                            .setFechaInicio(inicioIso)
                            .setFechaFin(finIso)
                            .build()
            );
        } catch (Exception ex) {
            log.error("Fallo al consultar vehículos ocupados en Rental Service: {}", ex.getMessage(), ex);
            throw new IllegalStateException("Servicio temporalmente no disponible");
        }

        List<Long> idsExcluidos = ocupadosResponse.getVehiculoIdsList().stream()
                .map(Integer::longValue)
                .toList();

        String tipoStr = tipo != null ? tipo.name() : null;
        String precioMinStr = precioMin != null ? precioMin.toString() : null;
        String precioMaxStr = precioMax != null ? precioMax.toString() : null;

        List<VehiculoResponseDTO> disponibles = vehiculoService.buscarDisponibles(
                tipoStr,
                marca,
                modelo,
                precioMinStr,
                precioMaxStr,
                idsExcluidos
        );

        return disponibles.stream()
                .map(this::convertirAVehiculoGraphQl)
                .toList();
    }

    public List<GraphQlReserva> consultarReservas(
            Long clienteId,
            Long vehiculoId,
            TipoVehiculo tipo,
            EstadoReserva estado,
            String fechaInicio,
            String fechaFin
    ) {
        LocalDateTime inicio = fechaInicio == null
                ? null
                : parsearFecha(fechaInicio, "fechaInicio");

        LocalDateTime fin = fechaFin == null
                ? null
                : parsearFecha(fechaFin, "fechaFin");

        if (inicio != null && fin != null) {
            validarRango(inicio, fin);
        }

        ConsultarReservasRequest.Builder requestBuilder = ConsultarReservasRequest.newBuilder();
        if (clienteId != null) {
            requestBuilder.setClienteId(Math.toIntExact(clienteId));
        }
        if (vehiculoId != null) {
            requestBuilder.setVehiculoId(Math.toIntExact(vehiculoId));
        }
        if (estado != null) {
            requestBuilder.setEstado(estado.name());
        }

        ListaReservasResponse response = grpcClientManager.getRentalStub().consultarReservas(requestBuilder.build());

        // Caches locales por request para no repetir llamadas a servicios
        Map<Long, VehiculoResponse> vehiculoCache = new HashMap<>();
        Map<Long, ClienteResponse> clienteCache = new HashMap<>();

        return response.getReservasList().stream()
                .map(r -> {
                    long vId = (long) r.getVehiculoId();
                    long cId = (long) r.getClienteId();

                    VehiculoResponse v = vehiculoCache.computeIfAbsent(vId, id -> {
                        try {
                            return grpcClientManager.getVehicleStub().consultarVehiculo(
                                    VehiculoIdRequest.newBuilder().setId(id).build()
                            );
                        } catch (Exception e) {
                            log.warn("No se pudo obtener información del vehículo con ID {}: {}", id, e.getMessage());
                            return null;
                        }
                    });

                    ClienteResponse c = clienteCache.computeIfAbsent(cId, id -> {
                        try {
                            return grpcClientManager.getCustomerStub().consultarCliente(
                                    ConsultarClienteRequest.newBuilder().setId(Math.toIntExact(id)).build()
                            );
                        } catch (Exception e) {
                            log.warn("No se pudo obtener información del cliente con ID {}: {}", id, e.getMessage());
                            return null;
                        }
                    });

                    LocalDateTime rInicio = reservaGrpcMapper.toLocalDateTime(r.getFechaHoraInicio());
                    LocalDateTime rFin = reservaGrpcMapper.toLocalDateTime(r.getFechaHoraFin());

                    return new ReservaEnriquecida(r, v, c, rInicio, rFin);
                })
                .filter(item -> {
                    if (tipo != null) {
                        if (item.vehiculo == null || item.vehiculo.getTipoVehiculo() == null
                                || !tipo.name().equalsIgnoreCase(item.vehiculo.getTipoVehiculo())) {
                            return false;
                        }
                    }
                    if (inicio != null && item.fin != null && !item.fin.isAfter(inicio)) {
                        return false;
                    }
                    if (fin != null && item.inicio != null && !item.inicio.isBefore(fin)) {
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing((ReservaEnriquecida item) ->
                        item.inicio != null ? item.inicio : LocalDateTime.MIN).reversed())
                .map(item -> new GraphQlReserva(
                        (long) item.reserva.getId(),
                        item.reserva.getFechaHoraInicio(),
                        item.reserva.getFechaHoraFin(),
                        item.vehiculo != null && item.vehiculo.getPrecioDiario() != null && !item.vehiculo.getPrecioDiario().isBlank()
                                ? new BigDecimal(item.vehiculo.getPrecioDiario())
                                : BigDecimal.valueOf(item.reserva.getImporteTotal()),
                        BigDecimal.valueOf(item.reserva.getImporteTotal()),
                        item.reserva.getEstado() != null && !item.reserva.getEstado().isBlank()
                                ? EstadoReserva.valueOf(item.reserva.getEstado())
                                : EstadoReserva.CONFIRMADA,
                        new GraphQlClienteReserva(
                                item.cliente != null ? item.cliente.getNombre() : "",
                                item.cliente != null ? item.cliente.getApellido() : "",
                                item.cliente != null ? item.cliente.getDocumento() : ""
                        ),
                        new GraphQlVehiculoReserva(
                                item.vehiculo != null ? item.vehiculo.getMarca() : "",
                                item.vehiculo != null ? item.vehiculo.getModelo() : "",
                                item.vehiculo != null ? item.vehiculo.getAnio() : 0,
                                item.vehiculo != null ? item.vehiculo.getPatente() : "",
                                item.vehiculo != null && item.vehiculo.getTipoVehiculo() != null
                                        ? TipoVehiculo.valueOf(item.vehiculo.getTipoVehiculo().toUpperCase())
                                        : TipoVehiculo.SEDAN
                        )
                ))
                .toList();
    }

    public List<GraphQlAlquiler> historialAlquileres(String documento) {
        if (documento == null || documento.isBlank()) {
            return List.of();
        }

        com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse cliente = clienteService.buscarPorDocumento(documento);
        if (cliente == null) {
            return List.of();
        }

        ListaReservasResponse response = grpcClientManager.getRentalStub().consultarHistorial(
                ConsultarHistorialRequest.newBuilder()
                        .setClienteId(Math.toIntExact(cliente.id()))
                        .build()
        );

        LocalDateTime ahora = LocalDateTime.now();
        Map<Long, VehiculoResponse> vehiculoCache = new HashMap<>();

        return response.getReservasList().stream()
                .filter(r -> {
                    LocalDateTime rFin = reservaGrpcMapper.toLocalDateTime(r.getFechaHoraFin());
                    boolean finalizadaOCancelada = "CANCELADA".equalsIgnoreCase(r.getEstado())
                            || "FINALIZADA".equalsIgnoreCase(r.getEstado());
                    return finalizadaOCancelada || (rFin != null && rFin.isBefore(ahora));
                })
                .sorted(Comparator.comparing((ReservaResponse r) -> {
                    LocalDateTime rInicio = reservaGrpcMapper.toLocalDateTime(r.getFechaHoraInicio());
                    return rInicio != null ? rInicio : LocalDateTime.MIN;
                }).reversed())
                .map(r -> {
                    long vId = (long) r.getVehiculoId();
                    VehiculoResponse v = vehiculoCache.computeIfAbsent(vId, id -> {
                        try {
                            return grpcClientManager.getVehicleStub().consultarVehiculo(
                                    VehiculoIdRequest.newBuilder().setId(id).build()
                            );
                        } catch (Exception e) {
                            log.warn("No se pudo obtener información del vehículo {}: {}", id, e.getMessage());
                            return null;
                        }
                    });

                    LocalDateTime rInicio = reservaGrpcMapper.toLocalDateTime(r.getFechaHoraInicio());
                    LocalDateTime rFin = reservaGrpcMapper.toLocalDateTime(r.getFechaHoraFin());
                    long cantDias = (rInicio != null && rFin != null)
                            ? Math.max(1, ChronoUnit.DAYS.between(rInicio.toLocalDate(), rFin.toLocalDate()))
                            : 1;

                    return new GraphQlAlquiler(
                            (long) r.getId(),
                            r.getFechaHoraInicio(),
                            r.getFechaHoraFin(),
                            Math.toIntExact(cantDias),
                            BigDecimal.valueOf(r.getImporteTotal()),
                            r.getEstado() != null && !r.getEstado().isBlank()
                                    ? EstadoReserva.valueOf(r.getEstado())
                                    : EstadoReserva.CONFIRMADA,
                            new GraphQlVehiculoReserva(
                                    v != null ? v.getMarca() : "",
                                    v != null ? v.getModelo() : "",
                                    v != null ? v.getAnio() : 0,
                                    v != null ? v.getPatente() : "",
                                    v != null && v.getTipoVehiculo() != null
                                            ? TipoVehiculo.valueOf(v.getTipoVehiculo().toUpperCase())
                                            : TipoVehiculo.SEDAN
                            )
                    );
                })
                .toList();
    }

    private LocalDateTime parsearFecha(String valor, String nombreCampo) {
        try {
            return LocalDateTime.parse(valor);
        } catch (DateTimeParseException primeraExcepcion) {
            try {
                return OffsetDateTime.parse(valor).toLocalDateTime();
            } catch (DateTimeParseException segundaExcepcion) {
                throw new IllegalArgumentException(nombreCampo + " debe tener formato ISO-8601");
            }
        }
    }

    private void validarRango(LocalDateTime inicio, LocalDateTime fin) {
        if (!fin.isAfter(inicio)) {
            throw new IllegalArgumentException("fechaFin debe ser posterior a fechaInicio");
        }
    }

    private GraphQlVehiculo convertirAVehiculoGraphQl(VehiculoResponseDTO vehiculo) {
        return new GraphQlVehiculo(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio(),
                vehiculo.getPatente(),
                vehiculo.getColor(),
                vehiculo.getTipoVehiculo(),
                vehiculo.getPrecioDiario()
        );
    }

    private record ReservaEnriquecida(
            ReservaResponse reserva,
            VehiculoResponse vehiculo,
            ClienteResponse cliente,
            LocalDateTime inicio,
            LocalDateTime fin
    ) {}
}
