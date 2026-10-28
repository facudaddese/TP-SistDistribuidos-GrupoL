package com.unla.grupol.rentar.rentar_dssd.dto.graphql;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;

public record GraphQlVehiculoReserva(
        String marca,
        String modelo,
        Integer anio,
        String patente,
        TipoVehiculo tipo
) {
}
