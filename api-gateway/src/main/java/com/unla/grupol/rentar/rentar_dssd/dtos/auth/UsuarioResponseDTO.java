package com.unla.grupol.rentar.rentar_dssd.dtos.auth;

public record UsuarioResponseDTO(
        Long id,
        String email,
        String rol,
        String nombreCompleto,
        boolean activo
) {
}
