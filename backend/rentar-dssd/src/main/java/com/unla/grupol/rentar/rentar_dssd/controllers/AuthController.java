package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.dtos.auth.LoginRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.auth.LoginResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.auth.UsuarioResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> getUsuarioActual(Authentication authentication) {
        UsuarioResponseDTO response = authService.getUsuarioActual(authentication);
        return ResponseEntity.ok(response);
    }
}
