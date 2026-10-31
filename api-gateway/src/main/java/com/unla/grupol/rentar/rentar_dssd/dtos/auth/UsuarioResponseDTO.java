package com.unla.grupol.rentar.rentar_dssd.dtos.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Perfil y estado de la cuenta del usuario autenticado")
public record UsuarioResponseDTO(
        @Schema(description = "Identificador único del usuario", example = "1")
        Long id,

        @Schema(description = "Correo electrónico del usuario", example = "cliente@rentar.com")
        String email,

        @Schema(description = "Rol asignado en el sistema", allowableValues = {"ADMINISTRADOR", "CLIENTE"}, example = "CLIENTE")
        String rol,

        @Schema(description = "Nombre completo del usuario", example = "Carlos García")
        String nombreCompleto,

        @Schema(description = "Estado de habilitación de la cuenta de usuario", example = "true")
        boolean activo
) {
}

