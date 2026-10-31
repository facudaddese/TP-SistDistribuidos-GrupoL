package com.unla.grupol.rentar.rentar_dssd.dtos.response;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Datos completos de un vehículo registrado en el catálogo de Vehicle Service")
public class VehiculoResponseDTO {

    @Schema(description = "Identificador único numérico del vehículo", example = "1")
    private Long id;

    @Schema(description = "Patente o matrícula registral única e inmutable", example = "AA123BB")
    private String patente;

    @Schema(description = "Marca del fabricante", example = "Toyota")
    private String marca;

    @Schema(description = "Modelo comercial", example = "Corolla")
    private String modelo;

    @Schema(description = "Año de fabricación", example = "2024")
    private Integer anio;

    @Schema(description = "Color de la carrocería", example = "Gris Plata")
    private String color;

    @Schema(description = "Tipo o categoría de carrocería", allowableValues = {"SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"}, example = "SEDAN")
    private TipoVehiculo tipoVehiculo;

    @Schema(description = "Tarifa diaria de alquiler", example = "25000.00")
    private BigDecimal precioDiario;

    @Schema(description = "Estado operativo actual del vehículo en la flota", allowableValues = {"DISPONIBLE", "RESERVADO", "EN_ALQUILER"}, example = "DISPONIBLE")
    private EstadoVehiculo estado;

    @Schema(description = "Indica si el vehículo está activo en el catálogo (false = dado de baja)", example = "true")
    private boolean activo;
}

