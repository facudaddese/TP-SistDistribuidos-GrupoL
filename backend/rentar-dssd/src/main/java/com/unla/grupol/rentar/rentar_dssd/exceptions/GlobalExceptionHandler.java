package com.unla.grupol.rentar.rentar_dssd.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ApiError> manejarRecursoNoEncontrado(
            RecursoNoEncontradoException exception
    ) {
        ApiError error = crearError(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> manejarResourceNotFound(
            ResourceNotFoundException exception
    ) {
        ApiError error = crearError(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> manejarBadRequest(
            BadRequestException exception
    ) {
        ApiError error = crearError(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> manejarArgumentoInvalido(
            IllegalArgumentException exception
    ) {
        ApiError error = crearError(
                HttpStatus.CONFLICT,
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> manejarValidaciones(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> errores = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errores.put(error.getField(), error.getDefaultMessage())
                );

        ApiError error = crearError(
                HttpStatus.BAD_REQUEST,
                "Los datos enviados no son válidos",
                errores
        );

        return ResponseEntity.badRequest().body(error);
    }

    private ApiError crearError(
            HttpStatus status,
            String mensaje,
            Map<String, String> erroresValidacion
    ) {
        return new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                mensaje,
                erroresValidacion
        );
    }
}