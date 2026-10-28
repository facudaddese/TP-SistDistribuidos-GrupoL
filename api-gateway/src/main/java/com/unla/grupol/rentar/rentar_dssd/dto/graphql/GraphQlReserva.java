package com.unla.grupol.rentar.rentar_dssd.dto.graphql;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;

import java.math.BigDecimal;

public record GraphQlReserva(
        Long id,
        String fechaInicio,
        String fechaFin,
        BigDecimal precioDiario,
        BigDecimal importeTotal,
        EstadoReserva estado,
        GraphQlClienteReserva cliente,
        GraphQlVehiculoReserva vehiculo
) {
}
