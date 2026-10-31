package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.config.OpenApiConfig;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.ReservaRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.ReservaResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.exceptions.ApiError;
import com.unla.grupol.rentar.rentar_dssd.services.ReservaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
@Tag(name = "Reservas", description = "Gestión del ciclo de vida de alquileres y reservas de vehículos. Orquesta llamadas gRPC entre Rental Service (50053), Customer Service (50051) y Vehicle Service (50052).")
public class ReservaController {

    private final ReservaService reservaService;

    @Operation(
            summary = "Crear y confirmar una nueva reserva de alquiler",
            description = """
                    Orquesta la creación de una reserva. Exclusivo para rol CLIENTE.
                    
                    **Formatos de fecha aceptados en el cuerpo**: estándar ISO-8601 (ej. `2026-11-01T10:00:00` o `2026-11-01T10:00:00Z`).
                    La `fechaHoraInicio` debe ser estrictamente futura y la `fechaHoraFin` debe ser posterior a `fechaHoraInicio`.
                    
                    **Flujo de negocio y orquestación**:
                    1. Verifica cliente en Customer Service (404 si no existe, 409 si el cliente está inactivo).
                    2. Verifica vehículo en Vehicle Service (404 si no existe, 409 si el vehículo está inactivo).
                    3. Calcula el importe total: días enteros de alquiler computados (mínimo 1) x tarifa diaria del vehículo.
                    4. Registra la reserva en Rental Service en estado CONFIRMADA. Si el vehículo posee otra reserva confirmada superpuesta en el intervalo solicitado (`inicioA < finB && finA > inicioB`), Rental Service rechaza con conflicto (409).
                    5. Actualiza el estado del vehículo a RESERVADO en Vehicle Service (con compensación automática en caso de error).
                    """,
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Reserva creada y confirmada exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ReservaResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos de entrada inválidos (fechas nulas, fechaInicio no futura o fechaFin anterior a inicio).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado o token JWT ausente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Acceso denegado: se requiere rol CLIENTE.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Cliente o vehículo no encontrado con el identificador provisto.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Conflicto de negocio: cliente inactivo, vehículo inactivo, o vehículo ya reservado en un período superpuesto.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Fallo de comunicación con servicios internos gRPC (Rental, Customer o Vehicle Service).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @PostMapping
    public ResponseEntity<ReservaResponseDTO> crearReserva(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos para la solicitud de reserva (clienteId, vehiculoId y rango de fechas ISO-8601)",
                    required = true
            )
            @Valid @RequestBody ReservaRequestDTO request
    ) {
        ReservaResponseDTO response = reservaService.crearReserva(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Consultar y filtrar reservas",
            description = "Obtiene la lista de reservas registradas en Rental Service aplicando filtros opcionales (clienteId, vehiculoId, estado). Accesible para roles CLIENTE y ADMINISTRADOR. Cada reserva se enriquece con la tarifa del vehículo consultando a Vehicle Service con caché por petición. Si se omiten los parámetros, retorna todas las reservas registradas.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de reservas recuperada exitosamente.",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ReservaResponseDTO.class)))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado o token JWT ausente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Acceso denegado: se requiere rol CLIENTE o ADMINISTRADOR.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Rental Service o Vehicle Service no disponible temporalmente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @GetMapping
    public ResponseEntity<List<ReservaResponseDTO>> obtenerTodas(
            @Parameter(description = "Filtro opcional por identificador de cliente", example = "1")
            @RequestParam(required = false) Long clienteId,
            @Parameter(description = "Filtro opcional por identificador de vehículo", example = "2")
            @RequestParam(required = false) Long vehiculoId,
            @Parameter(description = "Filtro opcional por estado operativo de la reserva", schema = @Schema(allowableValues = {"CONFIRMADA", "CANCELADA", "FINALIZADA"}), example = "CONFIRMADA")
            @RequestParam(required = false) String estado
    ) {
        if (clienteId != null || vehiculoId != null || (estado != null && !estado.isBlank())) {
            return ResponseEntity.ok(reservaService.obtenerConFiltros(clienteId, vehiculoId, estado));
        }
        return ResponseEntity.ok(reservaService.obtenerTodas());
    }

    @Operation(
            summary = "Cancelar una reserva confirmada",
            description = """
                    Cancela una reserva previamente confirmada. Accesible para roles CLIENTE y ADMINISTRADOR.
                    
                    **Reglas de negocio**:
                    1. Valida que la reserva exista en Rental Service (404 si no existe).
                    2. Valida que el período de alquiler aún no haya comenzado (rechaza con 400 Bad Request si la `fechaHoraInicio` es anterior o igual al momento actual).
                    3. Modifica el estado a CANCELADA en Rental Service.
                    4. Restablece el estado del vehículo a DISPONIBLE en Vehicle Service.
                    """,
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Reserva cancelada exitosamente y vehículo restablecido a estado DISPONIBLE.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ReservaResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "ID nulo o el período de alquiler ya comenzó y no puede cancelarse.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado o token JWT ausente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Acceso denegado: se requiere rol CLIENTE o ADMINISTRADOR.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Reserva no encontrada con el ID indicado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Rental Service o Vehicle Service no disponible.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelarReserva(
            @Parameter(description = "Identificador único de la reserva a cancelar", required = true, example = "101")
            @PathVariable Long id
    ) {
        ReservaResponseDTO response = reservaService.cancelarReserva(id);
        return ResponseEntity.ok(response);
    }
}

