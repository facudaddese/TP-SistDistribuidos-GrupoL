package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.services.ReservaOrchestratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
public class ReservaRestController {

  @Autowired
  private ReservaOrchestratorService reservaOrchestratorService;

  @PostMapping("/crear-orquestada")
  public ResponseEntity<String> crearReserva(
      @RequestParam String documentoCliente,
      @RequestParam Long vehiculoId,
      @RequestParam String fechaInicio,
      @RequestParam String fechaFin) {

    String resultado = reservaOrchestratorService.crearReservaOrquestada(
        documentoCliente, vehiculoId, fechaInicio, fechaFin);
    return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
  }
}