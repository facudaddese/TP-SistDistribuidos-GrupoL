package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.SolicitudExternaResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.services.VehiculoExternoService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Hidden
@RestController
@RequestMapping("/api/vehiculos-externos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class VehiculoExternoController {

    private final VehiculoExternoService vehiculoExternoService;

    @PostMapping
    public ResponseEntity<SolicitudExternaResponseDTO> crear(
            @Valid @RequestBody VehiculoRequestDTO request,
            Authentication authentication
    ) {
        var solicitud = vehiculoExternoService.crear(
                request,
                authentication
        );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(solicitud);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolicitudExternaResponseDTO> consultar(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                vehiculoExternoService.consultar(id, authentication)
        );
    }

    @GetMapping
    public ResponseEntity<List<SolicitudExternaResponseDTO>> listar(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                vehiculoExternoService.listar(authentication)
        );
    }
}
