package com.unla.grupol.rentar.rentar_dssd.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Datos modificables para la actualización de un cliente existente")
public record ClienteUpdateRequest(

        @Schema(description = "Número o código único de documento de identidad del cliente", example = "38999111", maxLength = 20, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Size(max = 20)
        String documento,

        @Schema(description = "Nombre de pila del cliente", example = "Martín", maxLength = 100, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Size(max = 100)
        String nombre,

        @Schema(description = "Apellido del cliente", example = "González", maxLength = 100, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Size(max = 100)
        String apellido,

        @Schema(description = "Correo electrónico para contacto y notificaciones", example = "martin.gonzalez@example.com", format = "email", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Email
        String email,

        @Schema(description = "Número de teléfono de contacto (opcional)", example = "+54 11 5555-1234", maxLength = 30, requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        @Size(max = 30)
        String telefono,

        @Schema(description = "Fecha de nacimiento del cliente en formato ISO (YYYY-MM-DD)", example = "1995-04-12", format = "date", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        LocalDate fechaNacimiento
) {
}

