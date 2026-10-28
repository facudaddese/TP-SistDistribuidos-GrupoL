package com.unla.grupol.rentar.rentar_dssd.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.unla.grupol.rentar.grpc.vehicle.ActualizarEstadoRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoIdRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoResponse;
import com.unla.grupol.rentar.rentar_dssd.grpc.GrpcClientManager;

import customer.Customer.ClienteResponse;
import customer.Customer.ConsultarClientesRequest;
import customer.Customer.ListaClientesResponse;
import rental.Rental.CrearReservaRequest;
import rental.Rental.ReservaResponse;

@Service
public class ReservaOrchestratorService {

  @Autowired
  private GrpcClientManager grpcClients;

  public String crearReservaOrquestada(String documentoCliente, Long vehiculoId, String fechaInicio, String fechaFin) {

    // 1. Customer Service: el cliente tiene que existir y estar activo
    ListaClientesResponse clientes = grpcClients.getCustomerStub().consultarClientes(
        ConsultarClientesRequest.newBuilder().setSoloActivos(false).build());

    ClienteResponse cliente = clientes.getClientesList().stream()
        .filter(c -> c.getDocumento().equals(documentoCliente))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("El cliente no existe."));

    if (!cliente.getActivo()) {
      throw new IllegalStateException("El cliente está inactivo.");
    }

    // 2. Vehicle Service: el vehículo tiene que existir (si no, NOT_FOUND) y estar
    // activo
    VehiculoResponse vehiculo = grpcClients.getVehicleStub().consultarVehiculo(
        VehiculoIdRequest.newBuilder().setId(vehiculoId).build());

    if (!vehiculo.getActivo()) {
      throw new IllegalStateException("El vehículo está inactivo.");
    }

    // 3. Importe total = duración (proporcional a las horas) x precio diario
    Instant inicio = Instant.parse(fechaInicio);
    Instant fin = Instant.parse(fechaFin);
    long minutos = Duration.between(inicio, fin).toMinutes();
    if (minutos <= 0) {
      throw new IllegalArgumentException("La fecha de fin debe ser posterior a la de inicio.");
    }
    double importeTotal = new BigDecimal(vehiculo.getPrecioDiario())
        .multiply(BigDecimal.valueOf(minutos))
        .divide(BigDecimal.valueOf(24 * 60), 2, RoundingMode.HALF_UP)
        .doubleValue();

    // 4. Rental Service: crear la reserva
    ReservaResponse reserva = grpcClients.getRentalStub().crearReserva(
        CrearReservaRequest.newBuilder()
            .setClienteId(cliente.getId())
            .setVehiculoId(Math.toIntExact(vehiculo.getId()))
            .setFechaHoraInicio(fechaInicio)
            .setFechaHoraFin(fechaFin)
            .setImporteTotal(importeTotal)
            .build());

    // 5. Vehicle Service: pasar el vehículo a RESERVADO
    grpcClients.getVehicleStub().actualizarEstado(
        ActualizarEstadoRequest.newBuilder()
            .setId(vehiculo.getId())
            .setEstado("RESERVADO")
            .build());

    return "Reserva generada con éxito. ID Reserva: " + reserva.getId();
  }
}