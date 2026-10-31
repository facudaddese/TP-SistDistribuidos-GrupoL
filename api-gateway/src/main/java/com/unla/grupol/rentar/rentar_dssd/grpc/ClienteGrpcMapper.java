package com.unla.grupol.rentar.rentar_dssd.grpc;

import customer.Customer.ClienteResponse;
import customer.Customer.CrearClienteRequest;
import customer.Customer.ListaClientesResponse;
import customer.Customer.ModificarClienteRequest;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteRequest;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteUpdateRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class ClienteGrpcMapper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public CrearClienteRequest toCrearRequest(ClienteRequest dto) {
        // La contraseña viaja en texto claro únicamente a través de la red interna
        // entre el API Gateway y customer-service, donde este último aplica el hash con BCrypt.
        return CrearClienteRequest.newBuilder()
                .setDocumento(dto.documento() != null ? dto.documento().trim() : "")
                .setNombre(dto.nombre() != null ? dto.nombre().trim() : "")
                .setApellido(dto.apellido() != null ? dto.apellido().trim() : "")
                .setEmail(dto.email() != null ? dto.email().trim() : "")
                .setPassword(dto.password() != null ? dto.password() : "")
                .setTelefono(dto.telefono() != null ? dto.telefono().trim() : "")
                .setFechaNacimiento(formatFecha(dto.fechaNacimiento()))
                .build();
    }

    public ModificarClienteRequest toModificarRequest(Long id, ClienteUpdateRequest dto) {
        return ModificarClienteRequest.newBuilder()
                .setId(id != null ? Math.toIntExact(id) : 0)
                .setDocumento(dto.documento() != null ? dto.documento().trim() : "")
                .setNombre(dto.nombre() != null ? dto.nombre().trim() : "")
                .setApellido(dto.apellido() != null ? dto.apellido().trim() : "")
                .setEmail(dto.email() != null ? dto.email().trim() : "")
                .setTelefono(dto.telefono() != null ? dto.telefono().trim() : "")
                .setFechaNacimiento(formatFecha(dto.fechaNacimiento()))
                .build();
    }

    public com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse toResponseDTO(ClienteResponse response) {
        return new com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse(
                (long) response.getId(),
                response.getDocumento(),
                response.getNombre(),
                response.getApellido(),
                response.getEmail(),
                response.getTelefono(),
                parseFecha(response.getFechaNacimiento()),
                response.getActivo()
        );
    }

    public List<com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse> toResponseDTOList(ListaClientesResponse response) {
        return response.getClientesList().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    private String formatFecha(LocalDate fecha) {
        return fecha != null ? fecha.format(DATE_FORMATTER) : "";
    }

    private LocalDate parseFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(fechaStr.trim(), DATE_FORMATTER);
        } catch (Exception ignored) {
            return null;
        }
    }
}
