package com.unla.grupol.rentar.rentar_dssd.dtos.request;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Datos actualizables de un vehículo de la flota (la patente no es modificable)")
public class VehiculoUpdateRequestDTO {

    @Schema(description = "Marca del fabricante del vehículo", example = "Toyota", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "La marca es obligatoria")
    private String marca;

    @Schema(description = "Modelo comercial del vehículo", example = "Corolla", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "El modelo es obligatorio")
    private String modelo;

    @Schema(description = "Año de fabricación del vehículo", example = "2024", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "El año es obligatorio")
    private Integer anio;

    @Schema(description = "Color predominante de la carrocería", example = "Negro", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String color;

    @Schema(description = "Categoría o tipo de carrocería del vehículo", allowableValues = {"SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"}, example = "SEDAN", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "El tipo de vehículo es obligatorio")
    private TipoVehiculo tipoVehiculo;

    @Schema(description = "Tarifa diaria de alquiler (mayor a 0)", example = "28000.00", minimum = "0.01", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "El precio diario es obligatorio")
    @Positive(message = "El precio diario debe ser mayor a 0")
    private BigDecimal precioDiario;
}

