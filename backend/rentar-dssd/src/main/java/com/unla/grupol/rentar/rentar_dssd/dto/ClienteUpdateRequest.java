package com.unla.grupol.rentar.rentar_dssd.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ClienteUpdateRequest(

        @NotBlank
        @Size(max = 20)
        String documento,

        @NotBlank
        @Size(max = 100)
        String nombre,

        @NotBlank
        @Size(max = 100)
        String apellido,

        @NotBlank
        @Email
        String email,

        @Size(max = 30)
        String telefono,

        LocalDate fechaNacimiento
) {
}
