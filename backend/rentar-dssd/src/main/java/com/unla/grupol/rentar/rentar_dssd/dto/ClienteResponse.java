package com.unla.grupol.rentar.rentar_dssd.dto;

import java.time.LocalDate;

public record ClienteResponse(
        Long id,
        String documento,
        String nombre,
        String apellido,
        String email,
        String telefono,
        LocalDate fechaNacimiento,
        boolean activo
) {
}
