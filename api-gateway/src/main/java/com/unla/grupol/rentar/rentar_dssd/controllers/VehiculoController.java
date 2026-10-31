package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.config.OpenApiConfig;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoUpdateRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.VehiculoResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.exceptions.ApiError;
import com.unla.grupol.rentar.rentar_dssd.services.VehiculoService;
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
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
@Tag(name = "Vehículos", description = "Catálogo de vehículos y operaciones de flota. Las consultas son públicas para clientes y visitantes; las operaciones de alta, modificación y baja requieren rol ADMINISTRADOR.")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    @Operation(
            summary = "Registrar un nuevo vehículo",
            description = "Incorpora un nuevo vehículo al catálogo de Vehicle Service con estado inicial DISPONIBLE y activo = true. Exclusivo para rol ADMINISTRADOR. Valida que la patente no esté registrada previamente.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Vehículo creado exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = VehiculoResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos de entrada inválidos (campos obligatorios ausentes o precio diario no positivo).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado o token JWT ausente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Acceso denegado: se requiere rol ADMINISTRADOR.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Conflicto: ya existe un vehículo registrado con la misma patente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Vehicle Service no disponible temporalmente vía gRPC.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @PostMapping
    public ResponseEntity<VehiculoResponseDTO> createVehiculo(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos técnicos y comerciales del nuevo vehículo a registrar",
                    required = true
            )
            @Valid @RequestBody VehiculoRequestDTO request
    ) {
        VehiculoResponseDTO response = vehiculoService.createVehiculo(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @Operation(
            summary = "Actualizar datos de un vehículo",
            description = "Modifica los atributos de un vehículo existente (marca, modelo, año, color, tipo y precio diario). La patente es inmutable y no se modifica. Exclusivo para rol ADMINISTRADOR.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Vehículo modificado exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = VehiculoResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos de entrada inválidos o precio diario no positivo.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado o token JWT ausente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Acceso denegado: se requiere rol ADMINISTRADOR.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Vehículo no encontrado con el ID indicado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Vehicle Service no disponible.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @PutMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> updateVehiculo(
            @Parameter(description = "Identificador único numérico del vehículo a modificar", required = true, example = "1")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos actualizados del vehículo",
                    required = true
            )
            @Valid @RequestBody VehiculoUpdateRequestDTO request
    ) {
        VehiculoResponseDTO response = vehiculoService.updateVehiculo(id, request);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Dar de baja lógica a un vehículo",
            description = "Realiza la baja lógica (activo = false) de un vehículo en Vehicle Service. Exclusivo para rol ADMINISTRADOR. El vehículo no podrá ser alquilado nuevamente pero conservará su historial.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Vehículo dado de baja exitosamente (sin contenido en la respuesta)."
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado o token JWT ausente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Acceso denegado: se requiere rol ADMINISTRADOR.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Vehículo no encontrado con el ID indicado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Vehicle Service no disponible.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehiculo(
            @Parameter(description = "Identificador único numérico del vehículo a dar de baja", required = true, example = "1")
            @PathVariable Long id
    ) {
        vehiculoService.deleteVehiculo(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Obtener vehículo por ID",
            description = "Recupera la ficha técnica y estado de un vehículo específico por su identificador numérico. Endpoint público accesible sin autenticación para clientes y visitantes.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Vehículo encontrado exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = VehiculoResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Vehículo no encontrado con el ID especificado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Vehicle Service no disponible temporalmente vía gRPC.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> getVehiculoById(
            @Parameter(description = "Identificador único numérico del vehículo", required = true, example = "1")
            @PathVariable Long id
    ) {
        VehiculoResponseDTO response = vehiculoService.getVehiculoById(id);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Listar vehículos de la flota",
            description = "Recupera la lista de todos los vehículos registrados en el catálogo de Vehicle Service. Endpoint público accesible sin autenticación para consulta de flota.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de vehículos recuperada exitosamente.",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = VehiculoResponseDTO.class)))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Vehicle Service no disponible temporalmente vía gRPC.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @GetMapping
    public ResponseEntity<List<VehiculoResponseDTO>> getAllVehiculos() {
        List<VehiculoResponseDTO> response = vehiculoService.getAllVehiculos();
        return ResponseEntity.ok(response);
    }
}

