package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.config.OpenApiConfig;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteRequest;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteUpdateRequest;
import com.unla.grupol.rentar.rentar_dssd.exceptions.ApiError;
import com.unla.grupol.rentar.rentar_dssd.services.ClienteService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@Tag(name = "Clientes", description = "Gestión integral de clientes y usuarios asociados (exclusivo para rol ADMINISTRADOR). Resuelto mediante llamadas gRPC a Customer Service (puerto 50051).")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @Operation(
            summary = "Listar clientes activos",
            description = "Recupera la lista completa de clientes activos registrados en el sistema. Exclusivo para rol ADMINISTRADOR. Consulta delegada vía gRPC a Customer Service (con filtro soloActivos=true). Devuelve una lista vacía si no hay clientes registrados.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de clientes activos obtenida exitosamente.",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ClienteResponse.class)))
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
                    responseCode = "503",
                    description = "Customer Service no se encuentra disponible vía gRPC.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @GetMapping
    public List<ClienteResponse> listar() {
        return clienteService.listar();
    }

    @Operation(
            summary = "Buscar cliente por ID",
            description = "Recupera el detalle y estado de un cliente específico según su identificador numérico. Exclusivo para rol ADMINISTRADOR. Consulta delegada vía gRPC a Customer Service.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Cliente encontrado exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ClienteResponse.class))
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
                    description = "Cliente no encontrado con el ID especificado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Customer Service no disponible.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @GetMapping("/{id}")
    public ClienteResponse buscarPorId(
            @Parameter(description = "Identificador único numérico del cliente", required = true, example = "1")
            @PathVariable Long id
    ) {
        return clienteService.buscarPorId(id);
    }

    @Operation(
            summary = "Registrar un nuevo cliente",
            description = "Crea un nuevo registro de cliente y su cuenta de usuario en el sistema. Exclusivo para rol ADMINISTRADOR. Valida unicidad de documento y correo electrónico en Customer Service. La contraseña viaja protegida hacia Customer Service donde se hashea con BCrypt.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Cliente creado y registrado exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ClienteResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos de entrada inválidos según Bean Validation (campos obligatorios en blanco, email inválido o password menor a 6 caracteres).",
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
                    description = "Conflicto: ya existe un cliente registrado con el mismo documento o correo electrónico.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Customer Service no disponible.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @PostMapping
    public ResponseEntity<ClienteResponse> crear(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos del nuevo cliente a registrar",
                    required = true
            )
            @Valid @RequestBody ClienteRequest request
    ) {
        ClienteResponse creado = clienteService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    @Operation(
            summary = "Actualizar un cliente existente",
            description = "Modifica los datos personales y de contacto de un cliente existente. Exclusivo para rol ADMINISTRADOR. No modifica la contraseña ni el historial de reservas.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Cliente actualizado exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ClienteResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos de entrada inválidos o formato incorrecto.",
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
                    description = "Cliente no encontrado con el ID indicado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Conflicto: el nuevo documento o correo electrónico ya pertenece a otro cliente registrado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Customer Service no disponible.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @PutMapping("/{id}")
    public ClienteResponse actualizar(
            @Parameter(description = "Identificador único numérico del cliente a modificar", required = true, example = "1")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos actualizados del cliente",
                    required = true
            )
            @Valid @RequestBody ClienteUpdateRequest request
    ) {
        return clienteService.actualizar(id, request);
    }

    @Operation(
            summary = "Dar de baja lógica a un cliente",
            description = "Realiza la baja lógica (activo = false) de un cliente en Customer Service. Exclusivo para rol ADMINISTRADOR. Preserva el registro histórico y las reservas asociadas.",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Cliente dado de baja exitosamente (sin contenido en la respuesta)."
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
                    description = "Cliente no encontrado con el ID indicado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Customer Service no disponible.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> darDeBaja(
            @Parameter(description = "Identificador único numérico del cliente a dar de baja", required = true, example = "1")
            @PathVariable Long id
    ) {
        clienteService.darDeBaja(id);
        return ResponseEntity.noContent().build();
    }
}

