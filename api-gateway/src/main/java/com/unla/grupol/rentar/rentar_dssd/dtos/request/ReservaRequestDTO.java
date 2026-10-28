package com.unla.grupol.rentar.rentar_dssd.dtos.request;

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
public class ReservaRequestDTO {

    @NotNull(message = "El clienteId no puede ser nulo")
    private Long clienteId;

    @NotNull(message = "El vehiculoId no puede ser nulo")
    private Long vehiculoId;

    @NotNull(message = "La fechaHoraInicio no puede ser nula")
    @Future(message = "La fecha de inicio debe ser futura")
    private LocalDateTime fechaHoraInicio;

    @NotNull(message = "La fechaHoraFin no puede ser nula")
    private LocalDateTime fechaHoraFin;
}
