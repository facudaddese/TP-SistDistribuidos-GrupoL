package com.unla.grupol.rentar.rentar_dssd.dtos.auth;

public record LoginResponseDTO(
        String token,
        String tipo,
        Long id,
        String email,
        String rol,
        String nombreCompleto
) {
}
