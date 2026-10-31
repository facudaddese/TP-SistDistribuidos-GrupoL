package com.unla.grupol.rentar.rentar_dssd.grpc;

import com.unla.grupol.rentar.grpc.vehicle.CrearVehiculoRequest;
import com.unla.grupol.rentar.grpc.vehicle.ListaVehiculosResponse;
import com.unla.grupol.rentar.grpc.vehicle.ModificarVehiculoRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoResponse;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoUpdateRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.VehiculoResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class VehiculoGrpcMapper {

    public CrearVehiculoRequest toCrearRequest(VehiculoRequestDTO dto) {
        return CrearVehiculoRequest.newBuilder()
                .setPatente(dto.getPatente() != null ? dto.getPatente().trim() : "")
                .setMarca(dto.getMarca() != null ? dto.getMarca().trim() : "")
                .setModelo(dto.getModelo() != null ? dto.getModelo().trim() : "")
                .setAnio(dto.getAnio() != null ? dto.getAnio() : 0)
                .setColor(dto.getColor() != null ? dto.getColor().trim() : "")
                .setTipoVehiculo(dto.getTipoVehiculo() != null ? dto.getTipoVehiculo().name() : "")
                .setPrecioDiario(dto.getPrecioDiario() != null ? dto.getPrecioDiario().toPlainString() : "")
                .build();
    }

    public ModificarVehiculoRequest toModificarRequest(Long id, VehiculoUpdateRequestDTO dto) {
        return ModificarVehiculoRequest.newBuilder()
                .setId(id != null ? id : 0L)
                .setMarca(dto.getMarca() != null ? dto.getMarca().trim() : "")
                .setModelo(dto.getModelo() != null ? dto.getModelo().trim() : "")
                .setAnio(dto.getAnio() != null ? dto.getAnio() : 0)
                .setColor(dto.getColor() != null ? dto.getColor().trim() : "")
                .setTipoVehiculo(dto.getTipoVehiculo() != null ? dto.getTipoVehiculo().name() : "")
                .setPrecioDiario(dto.getPrecioDiario() != null ? dto.getPrecioDiario().toPlainString() : "")
                .build();
    }

    public VehiculoResponseDTO toResponseDTO(VehiculoResponse response) {
        return VehiculoResponseDTO.builder()
                .id(response.getId())
                .patente(response.getPatente())
                .marca(response.getMarca())
                .modelo(response.getModelo())
                .anio(response.getAnio())
                .color(response.getColor())
                .tipoVehiculo(parseTipoVehiculo(response.getTipoVehiculo()))
                .precioDiario(parsePrecioDiario(response.getPrecioDiario()))
                .estado(parseEstadoVehiculo(response.getEstado()))
                .activo(response.getActivo())
                .build();
    }

    public List<VehiculoResponseDTO> toResponseDTOList(ListaVehiculosResponse response) {
        return response.getVehiculosList().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    private TipoVehiculo parseTipoVehiculo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return null;
        }
        try {
            return TipoVehiculo.valueOf(tipo.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private EstadoVehiculo parseEstadoVehiculo(String estado) {
        if (estado == null || estado.isBlank()) {
            return null;
        }
        try {
            return EstadoVehiculo.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private BigDecimal parsePrecioDiario(String precio) {
        if (precio == null || precio.isBlank()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(precio.trim());
    }
}
