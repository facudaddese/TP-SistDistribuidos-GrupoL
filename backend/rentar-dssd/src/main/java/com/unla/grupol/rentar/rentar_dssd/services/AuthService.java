package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.rentar_dssd.dtos.auth.LoginRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.auth.LoginResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.auth.UsuarioResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.entities.Usuario;
import com.unla.grupol.rentar.rentar_dssd.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioService usuarioService;

    public LoginResponseDTO login(LoginRequestDTO request) {
        // Valida credenciales y estado activo con Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim(), request.password())
        );

        Usuario usuario = (Usuario) authentication.getPrincipal();
        String token = jwtService.generateToken(usuario);

        return new LoginResponseDTO(
                token,
                "Bearer",
                usuario.getId(),
                usuario.getEmail(),
                usuario.getRol().name(),
                usuarioService.obtenerNombreCompleto(usuario)
        );
    }

    public UsuarioResponseDTO getUsuarioActual(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            throw new IllegalArgumentException("No hay usuario autenticado en la sesión actual");
        }
        return usuarioService.convertirAResponse(usuario);
    }
}
