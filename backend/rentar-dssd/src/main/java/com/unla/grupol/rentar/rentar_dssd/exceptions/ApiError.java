package com.unla.grupol.rentar.rentar_dssd.exceptions;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        Map<String, String> validationErrors
) {
}
