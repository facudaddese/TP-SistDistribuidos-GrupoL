package com.unla.grupol.rentar.rentar_dssd.grpc;

import com.unla.grupol.rentar.rentar_dssd.dtos.response.ReservaResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import org.springframework.stereotype.Component;
import rental.Rental.ReservaResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

/**
 * Mapper para conversiones gRPC de Reservas.
 *
 * Convención de normalización de fechas:
 * Se utiliza el formato estándar ISO-8601 en UTC con sufijo 'Z' (DateTimeFormatter.ISO_INSTANT),
 * por ejemplo "2026-11-01T15:30:00Z". Esto garantiza compatibilidad universal y determinismo
 * con Rental Service (Node.js/Date.parse), Instant.parse() y clientes web.
 */
@Component
public class ReservaGrpcMapper {

    private static final DateTimeFormatter ISO_UTC_FORMATTER = DateTimeFormatter.ISO_INSTANT;

    public String toIsoUtcString(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.atOffset(ZoneOffset.UTC).format(ISO_UTC_FORMATTER);
    }

    public LocalDateTime toLocalDateTime(String isoString) {
        if (isoString == null || isoString.isBlank()) {
            return null;
        }
        String trimmed = isoString.trim();
        try {
            return OffsetDateTime.parse(trimmed).toLocalDateTime();
        } catch (DateTimeParseException ex) {
            try {
                return LocalDateTime.parse(trimmed);
            } catch (DateTimeParseException ex2) {
                return null;
            }
        }
    }

    public ReservaResponseDTO toDTO(ReservaResponse response, BigDecimal precioDiario) {
        LocalDateTime inicio = toLocalDateTime(response.getFechaHoraInicio());
        LocalDateTime fin = toLocalDateTime(response.getFechaHoraFin());

        BigDecimal importeTotal = BigDecimal.valueOf(response.getImporteTotal())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal precioDiarioAplicado = precioDiario;
        if (precioDiarioAplicado == null && inicio != null && fin != null) {
            long dias = Math.max(1, ChronoUnit.DAYS.between(inicio.toLocalDate(), fin.toLocalDate()));
            precioDiarioAplicado = importeTotal.divide(BigDecimal.valueOf(dias), 2, RoundingMode.HALF_UP);
        }

        EstadoReserva estado = null;
        if (response.getEstado() != null && !response.getEstado().isBlank()) {
            try {
                estado = EstadoReserva.valueOf(response.getEstado().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        return ReservaResponseDTO.builder()
                .id((long) response.getId())
                .clienteId((long) response.getClienteId())
                .vehiculoId((long) response.getVehiculoId())
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .precioDiarioAplicado(precioDiarioAplicado)
                .importeTotal(importeTotal)
                .estado(estado)
                // TODO: Rental Service almacena las reservas en memoria y no persiste el dato de fechaCreacion.
                // Cada consulta muestra la hora actual porque el servicio Rental no provee este dato.
                .fechaCreacion(LocalDateTime.now())
                .build();
    }
}
