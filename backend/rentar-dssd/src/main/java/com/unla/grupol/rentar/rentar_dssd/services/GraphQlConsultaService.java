package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlVehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.Reserva;
import com.unla.grupol.rentar.rentar_dssd.entities.Vehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.repositories.VehiculoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

@Service
public class GraphQlConsultaService {

    private final VehiculoRepository vehiculoRepository;

    public GraphQlConsultaService(VehiculoRepository vehiculoRepository) {
        this.vehiculoRepository = vehiculoRepository;
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
}
