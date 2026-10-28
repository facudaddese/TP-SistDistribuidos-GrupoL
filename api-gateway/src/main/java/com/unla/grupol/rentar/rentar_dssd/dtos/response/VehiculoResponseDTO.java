package com.unla.grupol.rentar.rentar_dssd.dtos.response;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoResponseDTO {
    private Long id;
    private String patente;
    private String marca;
    private String modelo;
    private Integer anio;
    private String color;
    private TipoVehiculo tipoVehiculo;
    private BigDecimal precioDiario;
    private EstadoVehiculo estado;
    private boolean activo;
}
