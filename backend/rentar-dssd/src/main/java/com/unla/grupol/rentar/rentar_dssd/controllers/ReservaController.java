package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.dtos.request.ReservaRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.ReservaResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.services.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    @PostMapping
    public ResponseEntity<ReservaResponseDTO> crearReserva(@Valid @RequestBody ReservaRequestDTO request) {
        ReservaResponseDTO response = reservaService.crearReserva(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ReservaResponseDTO>> obtenerTodas() {
        return ResponseEntity.ok(reservaService.obtenerTodas());
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelarReserva(@PathVariable Long id) {
        ReservaResponseDTO response = reservaService.cancelarReserva(id);
        return ResponseEntity.ok(response);
    }
}
