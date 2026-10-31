package com.unla.grupol.rentar.rentar_dssd.services.impl;

import com.unla.grupol.rentar.grpc.vehicle.ActualizarEstadoRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoIdRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoResponse;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.ReservaRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.ReservaResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.exceptions.BadRequestException;
import com.unla.grupol.rentar.rentar_dssd.exceptions.ResourceNotFoundException;
import com.unla.grupol.rentar.rentar_dssd.grpc.GrpcClientManager;
import com.unla.grupol.rentar.rentar_dssd.grpc.ReservaGrpcMapper;
import com.unla.grupol.rentar.rentar_dssd.services.ReservaService;
import customer.Customer.ActivoResponse;
import customer.Customer.VerificarClienteRequest;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import rental.Rental.CancelarReservaRequest;
import rental.Rental.ConsultarReservasRequest;
import rental.Rental.CrearReservaRequest;
import rental.Rental.ListaReservasResponse;
import rental.Rental.ReservaResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReservaServiceImpl implements ReservaService {

    private static final Logger log = LoggerFactory.getLogger(ReservaServiceImpl.class);

    private final GrpcClientManager grpcClientManager;
    private final ReservaGrpcMapper reservaGrpcMapper;

    @Override
    public ReservaResponseDTO crearReserva(ReservaRequestDTO request) {
        // 1. Validaciones de entrada
        if (request.getFechaHoraInicio() == null || request.getFechaHoraFin() == null) {
            throw new BadRequestException("Las fechas de inicio y fin son obligatorias");
        }
        if (!request.getFechaHoraInicio().isBefore(request.getFechaHoraFin())) {
            throw new BadRequestException("La fecha de finalización debe ser posterior a la fecha de inicio");
        }

        // 2. Customer Service: VerificarActivo por ID (no existe -> 404, inactivo -> 409)
        ActivoResponse activoResponse;
        try {
            activoResponse = grpcClientManager.getCustomerStub().verificarActivo(
                    VerificarClienteRequest.newBuilder()
                            .setId(Math.toIntExact(request.getClienteId()))
                            .build()
            );
        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
                throw new ResourceNotFoundException("Cliente no encontrado con ID: " + request.getClienteId());
            }
            throw e;
        }

        if (!activoResponse.getExiste()) {
            throw new ResourceNotFoundException("Cliente no encontrado con ID: " + request.getClienteId());
        }
        if (!activoResponse.getActivo()) {
            throw new IllegalArgumentException("El cliente no se encuentra activo");
        }

        // 3. Vehicle Service: ConsultarVehiculo (existe y activo)
        VehiculoResponse vehiculo;
        try {
            vehiculo = grpcClientManager.getVehicleStub().consultarVehiculo(
                    VehiculoIdRequest.newBuilder()
                            .setId(request.getVehiculoId())
                            .build()
            );
        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
                throw new ResourceNotFoundException("Vehículo no encontrado con ID: " + request.getVehiculoId());
            }
            throw e;
        }

        if (!vehiculo.getActivo()) {
            throw new IllegalArgumentException("El vehículo no se encuentra activo");
        }

        // 4. Calcular importe como en el Hito 1: días enteros de alquiler (mínimo 1) x precio diario
        long diasAlquiler = ChronoUnit.DAYS.between(
                request.getFechaHoraInicio().toLocalDate(),
                request.getFechaHoraFin().toLocalDate()
        );
        if (diasAlquiler == 0) {
            diasAlquiler = 1;
        }
        diasAlquiler = Math.max(1, diasAlquiler);

        BigDecimal precioDiario = new BigDecimal(vehiculo.getPrecioDiario());
        BigDecimal importeTotal = precioDiario.multiply(BigDecimal.valueOf(diasAlquiler));

        // 5. Normalizar fechas a ISO-8601 UTC ("Z") y crear reserva en Rental Service
        String fechaInicioIso = reservaGrpcMapper.toIsoUtcString(request.getFechaHoraInicio());
        String fechaFinIso = reservaGrpcMapper.toIsoUtcString(request.getFechaHoraFin());

        CrearReservaRequest rentalRequest = CrearReservaRequest.newBuilder()
                .setClienteId(Math.toIntExact(request.getClienteId()))
                .setVehiculoId(Math.toIntExact(request.getVehiculoId()))
                .setFechaHoraInicio(fechaInicioIso)
                .setFechaHoraFin(fechaFinIso)
                .setImporteTotal(importeTotal.doubleValue())
                .build();

        // Rental Service rechaza superposición con FAILED_PRECONDITION -> traducido a 409 por GlobalExceptionHandler
        ReservaResponse rentalResponse = grpcClientManager.getRentalStub().crearReserva(rentalRequest);

        // 6. Vehicle Service: ActualizarEstado a RESERVADO con compensación en caso de falla
        try {
            grpcClientManager.getVehicleStub().actualizarEstado(
                    ActualizarEstadoRequest.newBuilder()
                            .setId(vehiculo.getId())
                            .setEstado("RESERVADO")
                            .build()
            );
        } catch (Exception ex) {
            log.error("Fallo al actualizar el vehículo {} a RESERVADO tras crear reserva {}. Compensando con cancelación en Rental Service...",
                    vehiculo.getId(), rentalResponse.getId(), ex);
            try {
                grpcClientManager.getRentalStub().cancelarReserva(
                        CancelarReservaRequest.newBuilder()
                                .setId(rentalResponse.getId())
                                .build()
                );
            } catch (Exception compEx) {
                log.error("Error crítico durante la compensación al cancelar reserva {}: {}", rentalResponse.getId(), compEx.getMessage(), compEx);
            }
            throw ex;
        }

        return reservaGrpcMapper.toDTO(rentalResponse, precioDiario);
    }

    @Override
    public List<ReservaResponseDTO> obtenerTodas() {
        return obtenerConFiltros(null, null, null);
    }

    @Override
    public List<ReservaResponseDTO> obtenerConFiltros(Long clienteId, Long vehiculoId, String estado) {
        ConsultarReservasRequest.Builder requestBuilder = ConsultarReservasRequest.newBuilder();
        if (clienteId != null) {
            requestBuilder.setClienteId(Math.toIntExact(clienteId));
        }
        if (vehiculoId != null) {
            requestBuilder.setVehiculoId(Math.toIntExact(vehiculoId));
        }
        if (estado != null && !estado.isBlank()) {
            requestBuilder.setEstado(estado.trim());
        }

        ListaReservasResponse response = grpcClientManager.getRentalStub().consultarReservas(requestBuilder.build());

        // Cache local para consultar vehículos sin llamadas repetidas
        Map<Long, VehiculoResponse> vehiculoCache = new HashMap<>();

        return response.getReservasList().stream().map(r -> {
            long vId = (long) r.getVehiculoId();
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

            BigDecimal precioDiario = (v != null && v.getPrecioDiario() != null && !v.getPrecioDiario().isBlank())
                    ? new BigDecimal(v.getPrecioDiario())
                    : null;

            return reservaGrpcMapper.toDTO(r, precioDiario);
        }).toList();
    }

    @Override
    public ReservaResponseDTO cancelarReserva(Long id) {
        if (id == null) {
            throw new BadRequestException("El ID de la reserva no puede ser nulo");
        }

        // 1. Consultar reserva existente para verificar existencia y fecha de inicio
        ListaReservasResponse lista = grpcClientManager.getRentalStub().consultarReservas(
                ConsultarReservasRequest.newBuilder().build()
        );

        ReservaResponse reservaExistente = lista.getReservasList().stream()
                .filter(r -> r.getId() == Math.toIntExact(id))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));

        LocalDateTime fechaInicio = reservaGrpcMapper.toLocalDateTime(reservaExistente.getFechaHoraInicio());
        if (fechaInicio != null && !LocalDateTime.now().isBefore(fechaInicio)) {
            throw new BadRequestException("No se puede cancelar una reserva cuyo período de alquiler ya ha comenzado");
        }

        // 2. Cancelar en Rental Service
        ReservaResponse reservaCancelada = grpcClientManager.getRentalStub().cancelarReserva(
                CancelarReservaRequest.newBuilder().setId(Math.toIntExact(id)).build()
        );

        // 3. Devolver vehículo a estado DISPONIBLE
        // Nota: Pasar el vehículo a DISPONIBLE al cancelar es una mejora respecto del Hito 1
        // (donde quedaba en RESERVADO). Actualmente no verifica si existen otras reservas
        // confirmadas para este mismo vehículo en períodos solapados o contiguos.
        try {
            grpcClientManager.getVehicleStub().actualizarEstado(
                    ActualizarEstadoRequest.newBuilder()
                            .setId((long) reservaExistente.getVehiculoId())
                            .setEstado("DISPONIBLE")
                            .build()
            );
        } catch (Exception ex) {
            log.error("Advertencia: no se pudo actualizar el estado del vehículo {} a DISPONIBLE tras cancelar reserva {}: {}",
                    reservaExistente.getVehiculoId(), id, ex.getMessage(), ex);
        }

        // Obtener precio diario para completar el DTO
        BigDecimal precioDiario = null;
        try {
            VehiculoResponse v = grpcClientManager.getVehicleStub().consultarVehiculo(
                    VehiculoIdRequest.newBuilder().setId((long) reservaExistente.getVehiculoId()).build()
            );
            if (v != null && v.getPrecioDiario() != null && !v.getPrecioDiario().isBlank()) {
                precioDiario = new BigDecimal(v.getPrecioDiario());
            }
        } catch (Exception ignored) {
        }

        return reservaGrpcMapper.toDTO(reservaCancelada, precioDiario);
    }
}
