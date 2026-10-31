package com.unla.grupol.rentar.rentar_dssd.dtos.response;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Detalle completo de una reserva confirmada o gestionada a través de Rental Service")
public class ReservaResponseDTO {

    @Schema(description = "Identificador único de la reserva en Rental Service", example = "101")
    private Long id;

    @Schema(description = "Identificador del cliente titular de la reserva", example = "1")
    private Long clienteId;

    @Schema(description = "Identificador del vehículo reservado", example = "2")
    private Long vehiculoId;

    @Schema(description = "Fecha y hora de inicio de la reserva en formato ISO-8601", example = "2026-11-01T10:00:00", format = "date-time")
    private LocalDateTime fechaHoraInicio;

    @Schema(description = "Fecha y hora de finalización de la reserva en formato ISO-8601", example = "2026-11-05T18:00:00", format = "date-time")
    private LocalDateTime fechaHoraFin;

    @Schema(description = "Tarifa diaria del vehículo aplicada al momento de generar la reserva", example = "25000.00")
    private BigDecimal precioDiarioAplicado;

    @Schema(description = "Importe total del alquiler (días completos x tarifa diaria, mínimo 1 día)", example = "100000.00")
    private BigDecimal importeTotal;

    @Schema(description = "Estado operativo actual de la reserva", allowableValues = {"CONFIRMADA", "CANCELADA", "FINALIZADA"}, example = "CONFIRMADA")
    private EstadoReserva estado;

    @Schema(description = "Fecha y hora de respuesta generada en el Gateway (Rental Service no persiste fecha de creación)", example = "2026-10-31T15:30:00", format = "date-time")
    private LocalDateTime fechaCreacion;
}

