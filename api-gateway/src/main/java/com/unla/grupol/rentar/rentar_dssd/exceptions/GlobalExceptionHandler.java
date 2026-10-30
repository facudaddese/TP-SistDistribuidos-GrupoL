package com.unla.grupol.rentar.rentar_dssd.exceptions;

import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(StatusRuntimeException.class)
    public ResponseEntity<ApiError> manejarStatusRuntimeException(
            StatusRuntimeException exception
    ) {
        Status status = exception.getStatus();
        Status.Code code = status.getCode();
        String description = status.getDescription();

        // El detalle completo va solo al log (sin exponer contraseñas ni datos sensibles). Nunca devolver stack traces al cliente.
        log.error("Excepción gRPC capturada: código={}, descripción={}", code, description);

        HttpStatus httpStatus;
        String mensajeRespuesta;

        switch (code) {
            case NOT_FOUND -> {
                httpStatus = HttpStatus.NOT_FOUND;
                mensajeRespuesta = (description != null && !description.isBlank())
                        ? description
                        : "Recurso no encontrado";
            }
            case INVALID_ARGUMENT -> {
                httpStatus = HttpStatus.BAD_REQUEST;
                mensajeRespuesta = (description != null && !description.isBlank())
                        ? description
                        : "Los datos enviados no son válidos";
            }
            case ALREADY_EXISTS -> {
                httpStatus = HttpStatus.CONFLICT;
                mensajeRespuesta = (description != null && !description.isBlank())
                        ? description
                        : "El recurso ya existe";
            }
            case FAILED_PRECONDITION -> {
                httpStatus = HttpStatus.CONFLICT;
                mensajeRespuesta = (description != null && !description.isBlank())
                        ? description
                        : "No se cumplen las precondiciones para la operación";
            }
            case UNAVAILABLE, DEADLINE_EXCEEDED -> {
                httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
                mensajeRespuesta = "Servicio temporalmente no disponible";
            }
            default -> {
                httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
                mensajeRespuesta = "Error interno del servidor";
            }
        }

        ApiError error = crearError(
                httpStatus,
                mensajeRespuesta,
                Map.of()
        );

        return ResponseEntity.status(httpStatus).body(error);
    }

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

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ApiError> manejarArgumentoInvalido(
            RuntimeException exception
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
