package com.unla.grupol.rentar.rentar_dssd.dto.graphql;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;

import java.math.BigDecimal;

public record GraphQlAlquiler(
        Long id,
        String fechaInicio,
        String fechaFin,
        Integer cantDias,
        BigDecimal importeTotal,
        EstadoReserva estado,
        GraphQlVehiculoReserva vehiculo
) {
}
