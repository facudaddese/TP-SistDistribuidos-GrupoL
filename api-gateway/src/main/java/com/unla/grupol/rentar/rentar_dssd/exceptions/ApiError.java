package com.unla.grupol.rentar.rentar_dssd.exceptions;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Estructura estándar de respuesta para errores y excepciones de la API")
public record ApiError(
        @Schema(description = "Marca temporal exacta en la que se produjo el error", example = "2026-10-31T15:30:00", format = "date-time")
        LocalDateTime timestamp,

        @Schema(description = "Código de estado HTTP numérico", example = "400")
        int status,

        @Schema(description = "Razón o nombre estándar asociado al código de estado HTTP", example = "Bad Request")
        String error,

        @Schema(description = "Descripción legible detallando el motivo del fallo o rechazo de la solicitud", example = "Los datos enviados no son válidos")
        String message,

        @Schema(description = "Detalle de errores de validación a nivel de campo (campo -> mensaje de error). Se incluye vacío si el error no proviene de Bean Validation.", example = "{\"email\": \"El formato de email no es válido\"}")
        Map<String, String> validationErrors
) {
}

