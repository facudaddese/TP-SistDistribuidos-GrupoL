package com.unla.grupol.rentar.rentar_dssd.dtos.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credenciales requeridas para autenticación y obtención de token JWT")
public record LoginRequestDTO(
        @Schema(description = "Dirección de correo electrónico del usuario", example = "admin@rentar.com", format = "email", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El formato de email no es válido")
        String email,

        @Schema(description = "Contraseña en texto claro del usuario", example = "Admin123!", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "La contraseña es obligatoria")
        String password
) {
}

