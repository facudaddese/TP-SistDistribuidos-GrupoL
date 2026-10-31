package com.unla.grupol.rentar.rentar_dssd.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "Datos completos de la entidad Cliente registrados en Customer Service")
public record ClienteResponse(
        @Schema(description = "Identificador único numérico del cliente", example = "1")
        Long id,

        @Schema(description = "Número o código de documento de identidad", example = "38999111")
        String documento,

        @Schema(description = "Nombre de pila del cliente", example = "Martín")
        String nombre,

        @Schema(description = "Apellido del cliente", example = "González")
        String apellido,

        @Schema(description = "Correo electrónico de contacto y usuario", example = "martin.gonzalez@example.com")
        String email,

        @Schema(description = "Número de teléfono de contacto", example = "+54 11 5555-1234")
        String telefono,

        @Schema(description = "Fecha de nacimiento en formato ISO (YYYY-MM-DD)", example = "1995-04-12", format = "date")
        LocalDate fechaNacimiento,

        @Schema(description = "Indica si el cliente se encuentra activo en el sistema (false = dado de baja)", example = "true")
        boolean activo
) {
}

