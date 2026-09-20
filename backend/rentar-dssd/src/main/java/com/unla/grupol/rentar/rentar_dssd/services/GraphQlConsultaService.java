package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlVehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.Reserva;
import com.unla.grupol.rentar.rentar_dssd.entities.Vehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.repositories.VehiculoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlClienteReserva;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlReserva;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlVehiculoReserva;
import com.unla.grupol.rentar.rentar_dssd.entities.Reserva;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import com.unla.grupol.rentar.rentar_dssd.repositories.ReservaRepository;
import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlAlquiler;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

@Service
public class GraphQlConsultaService {

    private final VehiculoRepository vehiculoRepository;

    private final ReservaRepository reservaRepository;

    public GraphQlConsultaService(
            VehiculoRepository vehiculoRepository,
            ReservaRepository reservaRepository
    ) {
        this.vehiculoRepository = vehiculoRepository;
        this.reservaRepository = reservaRepository;
    }

    @Transactional(readOnly = true)
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

        return vehiculoRepository.findAll()
                .stream()
                .filter(Vehiculo::isActivo)
                .filter(vehiculo ->
                        tipo == null || vehiculo.getTipoVehiculo() == tipo
                )
                .filter(vehiculo ->
                        contieneTexto(vehiculo.getMarca(), marca)
                )
                .filter(vehiculo ->
                        contieneTexto(vehiculo.getModelo(), modelo)
                )
                .filter(vehiculo ->
                        precioMin == null
                                || vehiculo.getPrecioDiario().compareTo(
                                BigDecimal.valueOf(precioMin)
                        ) >= 0
                )
                .filter(vehiculo ->
                        precioMax == null
                                || vehiculo.getPrecioDiario().compareTo(
                                BigDecimal.valueOf(precioMax)
                        ) <= 0
                )
                .filter(vehiculo ->
                        estaDisponible(vehiculo, inicio, fin)
                )
                .map(this::convertirAVehiculoGraphQl)
                .toList();
    }

    @Transactional(readOnly = true)
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

        return reservaRepository.findAll()
                .stream()
                .filter(reserva ->
                        clienteId == null
                                || reserva.getCliente().getId().equals(clienteId)
                )
                .filter(reserva ->
                        vehiculoId == null
                                || reserva.getVehiculo().getId().equals(vehiculoId)
                )
                .filter(reserva ->
                        tipo == null
                                || reserva.getVehiculo().getTipoVehiculo() == tipo
                )
                .filter(reserva ->
                        estado == null
                                || reserva.getEstado() == estado
                )
                /*
                 * Una reserva pertenece al rango cuando se superpone
                 * con las fechas solicitadas.
                 */
                .filter(reserva ->
                        inicio == null
                                || reserva.getFechaHoraFin().isAfter(inicio)
                )
                .filter(reserva ->
                        fin == null
                                || reserva.getFechaHoraInicio().isBefore(fin)
                )
                .sorted(
                        Comparator.comparing(Reserva::getFechaHoraInicio)
                                .reversed()
                )
                .map(this::convertirAReservaGraphQl)
                .toList();
    }
    @Transactional(readOnly = true)
    public List<GraphQlAlquiler> historialAlquileres(String documento) {
        LocalDateTime ahora = LocalDateTime.now();

        return reservaRepository.findAll()
                .stream()
                .filter(reserva ->
                        reserva.getCliente()
                                .getDocumento()
                                .equals(documento)
                )
                /*
                 * El historial incluye:
                 * - reservas cuyo período ya finalizó;
                 * - reservas canceladas;
                 * - reservas marcadas explícitamente como finalizadas.
                 *
                 * Las reservas confirmadas futuras siguen apareciendo
                 * en consultarReservas, no en el historial.
                 */
                .filter(reserva ->
                        reserva.getFechaHoraFin().isBefore(ahora)
                                || reserva.getEstado() == EstadoReserva.CANCELADA
                                || reserva.getEstado() == EstadoReserva.FINALIZADA
                )
                .sorted(
                        Comparator.comparing(Reserva::getFechaHoraInicio)
                                .reversed()
                )
                .map(this::convertirAAlquilerGraphQl)
                .toList();
    }

    private boolean estaDisponible(
            Vehiculo vehiculo,
            LocalDateTime inicio,
            LocalDateTime fin
    ) {
        return vehiculo.getReservas()
                .stream()
                .filter(reserva ->
                        reserva.getEstado() == EstadoReserva.CONFIRMADA
                )
                .noneMatch(reserva ->
                        existeSuperposicion(inicio, fin, reserva)
                );
    }

    private boolean existeSuperposicion(
            LocalDateTime inicio,
            LocalDateTime fin,
            Reserva reserva
    ) {
        return inicio.isBefore(reserva.getFechaHoraFin())
                && fin.isAfter(reserva.getFechaHoraInicio());
    }

    private boolean contieneTexto(String valor, String filtro) {
        if (filtro == null || filtro.isBlank()) {
            return true;
        }

        return valor.toLowerCase(Locale.ROOT)
                .contains(filtro.trim().toLowerCase(Locale.ROOT));
    }

    private LocalDateTime parsearFecha(
            String valor,
            String nombreCampo
    ) {
        try {
            return LocalDateTime.parse(valor);
        } catch (DateTimeParseException primeraExcepcion) {
            try {
                /*
                 * El frontend utiliza toISOString(), por lo que puede enviar
                 * valores como 2026-09-20T15:00:00.000Z.
                 */
                return OffsetDateTime.parse(valor).toLocalDateTime();
            } catch (DateTimeParseException segundaExcepcion) {
                throw new IllegalArgumentException(
                        nombreCampo + " debe tener formato ISO-8601"
                );
            }
        }
    }

    private void validarRango(
            LocalDateTime inicio,
            LocalDateTime fin
    ) {
        if (!fin.isAfter(inicio)) {
            throw new IllegalArgumentException(
                    "fechaFin debe ser posterior a fechaInicio"
            );
        }
    }

    private GraphQlVehiculo convertirAVehiculoGraphQl(
            Vehiculo vehiculo
    ) {
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

    private GraphQlReserva convertirAReservaGraphQl(Reserva reserva) {
        return new GraphQlReserva(
                reserva.getId(),
                reserva.getFechaHoraInicio().toString(),
                reserva.getFechaHoraFin().toString(),
                reserva.getPrecioDiarioAplicado(),
                reserva.getImporteTotal(),
                reserva.getEstado(),
                new GraphQlClienteReserva(
                        reserva.getCliente().getNombre(),
                        reserva.getCliente().getApellido(),
                        reserva.getCliente().getDocumento()
                ),
                convertirAVehiculoReservaGraphQl(reserva)
        );
    }

    private GraphQlVehiculoReserva convertirAVehiculoReservaGraphQl(
            Reserva reserva
    ) {
        return new GraphQlVehiculoReserva(
                reserva.getVehiculo().getMarca(),
                reserva.getVehiculo().getModelo(),
                reserva.getVehiculo().getAnio(),
                reserva.getVehiculo().getPatente(),
                reserva.getVehiculo().getTipoVehiculo()
        );
    }

    private GraphQlAlquiler convertirAAlquilerGraphQl(Reserva reserva) {
        long cantidadDias = ChronoUnit.DAYS.between(
                reserva.getFechaHoraInicio().toLocalDate(),
                reserva.getFechaHoraFin().toLocalDate()
        );

        cantidadDias = Math.max(1, cantidadDias);

        return new GraphQlAlquiler(
                reserva.getId(),
                reserva.getFechaHoraInicio().toString(),
                reserva.getFechaHoraFin().toString(),
                Math.toIntExact(cantidadDias),
                reserva.getImporteTotal(),
                reserva.getEstado(),
                convertirAVehiculoReservaGraphQl(reserva)
        );
    }
}
