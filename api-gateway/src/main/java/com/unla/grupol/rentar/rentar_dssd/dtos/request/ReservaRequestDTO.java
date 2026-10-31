package com.unla.grupol.rentar.rentar_dssd.dtos.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud de creación de reserva. Requiere cliente y vehículo activos, sin solapamiento con reservas confirmadas previas.")
public class ReservaRequestDTO {

    @Schema(description = "Identificador numérico del cliente titular en Customer Service. Debe existir y estar activo (o provocará 404/409).", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "El clienteId no puede ser nulo")
    private Long clienteId;

    @Schema(description = "Identificador numérico del vehículo en Vehicle Service. Debe existir y estar activo (o provocará 404/409).", example = "2", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "El vehiculoId no puede ser nulo")
    private Long vehiculoId;

    @Schema(description = "Fecha y hora de inicio de la reserva. Debe ser futura y enviarse en formato estándar ISO-8601 (ej. '2026-11-01T10:00:00' o '2026-11-01T10:00:00Z').", example = "2026-11-01T10:00:00", format = "date-time", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "La fechaHoraInicio no puede ser nula")
    @Future(message = "La fecha de inicio debe ser futura")
    private LocalDateTime fechaHoraInicio;

    @Schema(description = "Fecha y hora de finalización de la reserva. Debe ser posterior a la fecha de inicio en formato ISO-8601 (ej. '2026-11-05T18:00:00' o '2026-11-05T18:00:00Z').", example = "2026-11-05T18:00:00", format = "date-time", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "La fechaHoraFin no puede ser nula")
    private LocalDateTime fechaHoraFin;
}

