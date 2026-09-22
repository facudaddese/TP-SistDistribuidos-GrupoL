package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoUpdateRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.VehiculoResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.services.VehiculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class VehiculoController {

    private final VehiculoService vehiculoService;

    @PostMapping
    public ResponseEntity<VehiculoResponseDTO> createVehiculo(@Valid @RequestBody VehiculoRequestDTO request) {
        VehiculoResponseDTO response = vehiculoService.createVehiculo(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> updateVehiculo(@PathVariable Long id, @Valid @RequestBody VehiculoUpdateRequestDTO request) {
        VehiculoResponseDTO response = vehiculoService.updateVehiculo(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehiculo(@PathVariable Long id) {
        vehiculoService.deleteVehiculo(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> getVehiculoById(@PathVariable Long id) {
        VehiculoResponseDTO response = vehiculoService.getVehiculoById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<VehiculoResponseDTO>> getAllVehiculos() {
        List<VehiculoResponseDTO> response = vehiculoService.getAllVehiculos();
        return ResponseEntity.ok(response);
    }
}
