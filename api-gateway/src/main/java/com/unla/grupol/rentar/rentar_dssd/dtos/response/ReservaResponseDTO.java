package com.unla.grupol.rentar.rentar_dssd.dtos.response;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
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
public class ReservaResponseDTO {
    private Long id;
    private Long clienteId;
    private Long vehiculoId;
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private BigDecimal precioDiarioAplicado;
    private BigDecimal importeTotal;
    private EstadoReserva estado;
    private LocalDateTime fechaCreacion;
}
