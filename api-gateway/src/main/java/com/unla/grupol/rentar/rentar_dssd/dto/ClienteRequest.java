package com.unla.grupol.rentar.rentar_dssd.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Datos para el registro o creación de un nuevo cliente y su cuenta asociada")
public record ClienteRequest(

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

        @Schema(description = "Correo electrónico único para contacto e inicio de sesión", example = "martin.gonzalez@example.com", format = "email", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Email
        String email,

        @Schema(description = "Contraseña inicial de la cuenta de usuario (mínimo 6 caracteres). Se hashea con BCrypt en Customer Service.", example = "Segura123!", minLength = 6, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Size(min = 6)
        String password,

        @Schema(description = "Número de teléfono de contacto (opcional)", example = "+54 11 5555-1234", maxLength = 30, requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        @Size(max = 30)
        String telefono,

        @Schema(description = "Fecha de nacimiento del cliente en formato ISO (YYYY-MM-DD)", example = "1995-04-12", format = "date", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        LocalDate fechaNacimiento
) {
}

