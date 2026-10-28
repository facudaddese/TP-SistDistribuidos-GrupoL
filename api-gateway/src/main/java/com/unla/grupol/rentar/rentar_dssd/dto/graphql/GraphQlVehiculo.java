package com.unla.grupol.rentar.rentar_dssd.dto.graphql;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;

import java.math.BigDecimal;

public record GraphQlVehiculo(
        Long id,
        String marca,
        String modelo,
        Integer anio,
        String patente,
        String color,
        TipoVehiculo tipo,
        BigDecimal precioDiario
) {
}
