package com.unla.grupol.rentar.rentar_dssd.services.impl;

import com.unla.grupol.rentar.rentar_dssd.dtos.request.ReservaRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.ReservaResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.entities.Cliente;
import com.unla.grupol.rentar.rentar_dssd.entities.Reserva;
import com.unla.grupol.rentar.rentar_dssd.entities.Vehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.exceptions.BadRequestException;
import com.unla.grupol.rentar.rentar_dssd.exceptions.ResourceNotFoundException;
import com.unla.grupol.rentar.rentar_dssd.repositories.ClienteRepository;
import com.unla.grupol.rentar.rentar_dssd.repositories.ReservaRepository;
import com.unla.grupol.rentar.rentar_dssd.repositories.VehiculoRepository;
import com.unla.grupol.rentar.rentar_dssd.services.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaServiceImpl implements ReservaService {

    private final ReservaRepository reservaRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;

    @Override
    @Transactional
    public ReservaResponseDTO crearReserva(ReservaRequestDTO request) {
        if (!request.getFechaHoraInicio().isBefore(request.getFechaHoraFin())) {
            throw new BadRequestException("La fecha de finalización debe ser posterior a la fecha de inicio");
        }

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + request.getClienteId()));

        if (!cliente.isActivo()) {
            throw new BadRequestException("El cliente no se encuentra activo");
        }

        Vehiculo vehiculo = vehiculoRepository.findById(request.getVehiculoId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado con ID: " + request.getVehiculoId()));

        if (!vehiculo.isActivo()) {
            throw new BadRequestException("El vehículo no se encuentra activo");
        }

        boolean existeSuperposicion = reservaRepository.existsOverlappingReserva(
                vehiculo.getId(),
                EstadoReserva.CONFIRMADA,
                request.getFechaHoraInicio(),
                request.getFechaHoraFin()
        );

        if (existeSuperposicion) {
            throw new BadRequestException("El vehículo no se encuentra disponible en el período solicitado");
        }

        long diasAlquiler = ChronoUnit.DAYS.between(request.getFechaHoraInicio().toLocalDate(), request.getFechaHoraFin().toLocalDate());
        if (diasAlquiler == 0) {
            diasAlquiler = 1;
        } else if (request.getFechaHoraFin().toLocalTime().isAfter(request.getFechaHoraInicio().toLocalTime())) {
            // Si la hora de fin es mayor que la hora de inicio, cobramos un día extra. (Opción conservadora, o lo dejamos como ChronoUnit.DAYS y ya).
            // Para ser simple, dejaremos diasAlquiler como mínimo 1, pero usaremos Math.max(1, diasAlquiler).
            // Sin embargo, si ChronoUnit.DAYS cuenta 1 dia entre 2023-01-01 y 2023-01-02, está bien.
        }
        
        diasAlquiler = Math.max(1, diasAlquiler);

        BigDecimal importeTotal = vehiculo.getPrecioDiario().multiply(BigDecimal.valueOf(diasAlquiler));

        Reserva reserva = Reserva.builder()
                .cliente(cliente)
                .vehiculo(vehiculo)
                .fechaHoraInicio(request.getFechaHoraInicio())
                .fechaHoraFin(request.getFechaHoraFin())
                .precioDiarioAplicado(vehiculo.getPrecioDiario())
                .importeTotal(importeTotal)
                .estado(EstadoReserva.CONFIRMADA)
                .build();

        Reserva reservaGuardada = reservaRepository.save(reserva);

        vehiculo.setEstado(EstadoVehiculo.RESERVADO);
        vehiculoRepository.save(vehiculo);

        return ReservaResponseDTO.builder()
                .id(reservaGuardada.getId())
                .clienteId(reservaGuardada.getCliente().getId())
                .vehiculoId(reservaGuardada.getVehiculo().getId())
                .fechaHoraInicio(reservaGuardada.getFechaHoraInicio())
                .fechaHoraFin(reservaGuardada.getFechaHoraFin())
                .precioDiarioAplicado(reservaGuardada.getPrecioDiarioAplicado())
                .importeTotal(reservaGuardada.getImporteTotal())
                .estado(reservaGuardada.getEstado())
                .fechaCreacion(reservaGuardada.getFechaCreacion())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservaResponseDTO> obtenerTodas() {
        return reservaRepository.findAll().stream().map(reserva -> ReservaResponseDTO.builder()
                .id(reserva.getId())
                .clienteId(reserva.getCliente().getId())
                .vehiculoId(reserva.getVehiculo().getId())
                .fechaHoraInicio(reserva.getFechaHoraInicio())
                .fechaHoraFin(reserva.getFechaHoraFin())
                .precioDiarioAplicado(reserva.getPrecioDiarioAplicado())
                .importeTotal(reserva.getImporteTotal())
                .estado(reserva.getEstado())
                .fechaCreacion(reserva.getFechaCreacion())
                .build()).toList();
    }

}
