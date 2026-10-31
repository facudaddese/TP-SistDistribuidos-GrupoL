package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.config.OpenApiConfig;
import com.unla.grupol.rentar.rentar_dssd.dtos.auth.LoginRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.auth.LoginResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.auth.UsuarioResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.exceptions.ApiError;
import com.unla.grupol.rentar.rentar_dssd.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints para inicio de sesión, emisión de tokens JWT y consulta del perfil del usuario autenticado.")
public class AuthController {

    private final AuthService authService;

    @Operation(
            summary = "Iniciar sesión y obtener token JWT",
            description = "Autentica las credenciales de un usuario (email y contraseña). Si son válidas y la cuenta se encuentra activa, emite y devuelve un token Bearer JWT para autorizar peticiones protegidas. Endpoint público que no requiere autenticación previa.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Autenticación exitosa. Devuelve el token JWT y los datos del usuario.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = LoginResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Solicitud inválida: formato de email no válido o campos obligatorios en blanco.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Credenciales incorrectas (email o contraseña incorrectos) o cuenta deshabilitada/bloqueada.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Credenciales del usuario (email y contraseña)",
                    required = true
            )
            @Valid @RequestBody LoginRequestDTO request
    ) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Obtener perfil del usuario autenticado",
            description = "Retorna el perfil y los roles del usuario autenticado a partir del token Bearer JWT enviado en la cabecera 'Authorization: Bearer <token>'. Requiere autenticación con cualquier rol válido (ADMINISTRADOR o CLIENTE).",
            security = @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Perfil del usuario autenticado obtenido correctamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UsuarioResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado o token JWT ausente, expirado o inválido.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
            )
    })
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> getUsuarioActual(Authentication authentication) {
        UsuarioResponseDTO response = authService.getUsuarioActual(authentication);
        return ResponseEntity.ok(response);
    }
}

