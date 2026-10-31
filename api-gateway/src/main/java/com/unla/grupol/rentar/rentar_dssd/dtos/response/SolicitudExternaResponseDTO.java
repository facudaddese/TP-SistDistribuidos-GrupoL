package com.unla.grupol.rentar.rentar_dssd.dtos.response;

public record SolicitudExternaResponseDTO(
        Long vehiculoExternoId,
        Long clienteId,
        String patente,
        String marca,
        String modelo,
        Integer anio,
        String color,
        String tipoVehiculo,
        String precioDiario,
        String estado,
        String resultadoPatente,
        String resultadoTitularidad,
        Long vehiculoId
) {
}
