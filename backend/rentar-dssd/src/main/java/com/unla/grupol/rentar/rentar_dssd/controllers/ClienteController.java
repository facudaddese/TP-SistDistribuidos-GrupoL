package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.dto.ClienteRequest;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteUpdateRequest;
import com.unla.grupol.rentar.rentar_dssd.services.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public List<ClienteResponse> listar() {
        return clienteService.listar();
    }

    @GetMapping("/{id}")
    public ClienteResponse buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> crear(
            @Valid @RequestBody ClienteRequest request
    ) {
        ClienteResponse creado = clienteService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    @PutMapping("/{id}")
    public ClienteResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteUpdateRequest request
    ) {
        return clienteService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> darDeBaja(@PathVariable Long id) {
        clienteService.darDeBaja(id);
        return ResponseEntity.noContent().build();
    }
}
