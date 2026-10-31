package com.unla.grupol.rentar.rentar_dssd.dtos.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de autenticación exitosa con token Bearer JWT y perfil básico")
public record LoginResponseDTO(
        @Schema(description = "Token de acceso JWT para autorizar peticiones protegidas", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        String token,

        @Schema(description = "Esquema o tipo de autorización HTTP", example = "Bearer")
        String tipo,

        @Schema(description = "Identificador único del usuario", example = "1")
        Long id,

        @Schema(description = "Correo electrónico del usuario autenticado", example = "admin@rentar.com")
        String email,

        @Schema(description = "Rol de seguridad asignado al usuario", allowableValues = {"ADMINISTRADOR", "CLIENTE"}, example = "ADMINISTRADOR")
        String rol,

        @Schema(description = "Nombre completo del usuario", example = "Administrador General")
        String nombreCompleto
) {
}

