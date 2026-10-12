package com.unla.grupol.rentar.rentar_dssd.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
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

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> manejarBadCredentials(
            BadCredentialsException exception
    ) {
        ApiError error = crearError(
                HttpStatus.UNAUTHORIZED,
                "Email o contraseña incorrectos",
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> manejarDisabled(
            DisabledException exception
    ) {
        ApiError error = crearError(
                HttpStatus.UNAUTHORIZED,
                "La cuenta de usuario se encuentra inactiva o deshabilitada",
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiError> manejarLocked(
            LockedException exception
    ) {
        ApiError error = crearError(
                HttpStatus.UNAUTHORIZED,
                "La cuenta de usuario se encuentra bloqueada",
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> manejarAccessDenied(
            AccessDeniedException exception
    ) {
        ApiError error = crearError(
                HttpStatus.FORBIDDEN,
                "Acceso denegado: no cuenta con los permisos necesarios para realizar esta acción",
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> manejarAuthentication(
            AuthenticationException exception
    ) {
        ApiError error = crearError(
                HttpStatus.UNAUTHORIZED,
                "Error de autenticación: " + exception.getMessage(),
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
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
