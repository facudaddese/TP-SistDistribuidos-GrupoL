package com.unla.grupol.rentar.rentar_dssd.services.impl;

import com.unla.grupol.rentar.grpc.vehicle.ConsultarVehiculosRequest;
import com.unla.grupol.rentar.grpc.vehicle.CrearVehiculoRequest;
import com.unla.grupol.rentar.grpc.vehicle.ListaVehiculosResponse;
import com.unla.grupol.rentar.grpc.vehicle.ModificarVehiculoRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoIdRequest;
import com.unla.grupol.rentar.grpc.vehicle.VehiculoResponse;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoUpdateRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.VehiculoResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.grpc.GrpcClientManager;
import com.unla.grupol.rentar.rentar_dssd.grpc.VehiculoGrpcMapper;
import com.unla.grupol.rentar.rentar_dssd.services.VehiculoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehiculoServiceImpl implements VehiculoService {

    private final GrpcClientManager grpcClientManager;
    private final VehiculoGrpcMapper vehiculoGrpcMapper;

    @Override
    public VehiculoResponseDTO createVehiculo(VehiculoRequestDTO request) {
        CrearVehiculoRequest grpcRequest = vehiculoGrpcMapper.toCrearRequest(request);
        VehiculoResponse grpcResponse = grpcClientManager.getVehicleStub().crearVehiculo(grpcRequest);
        return vehiculoGrpcMapper.toResponseDTO(grpcResponse);
    }

    @Override
    public VehiculoResponseDTO updateVehiculo(Long id, VehiculoUpdateRequestDTO request) {
        ModificarVehiculoRequest grpcRequest = vehiculoGrpcMapper.toModificarRequest(id, request);
        VehiculoResponse grpcResponse = grpcClientManager.getVehicleStub().modificarVehiculo(grpcRequest);
        return vehiculoGrpcMapper.toResponseDTO(grpcResponse);
    }

    @Override
    public void deleteVehiculo(Long id) {
        VehiculoIdRequest grpcRequest = VehiculoIdRequest.newBuilder()
                .setId(id != null ? id : 0L)
                .build();
        grpcClientManager.getVehicleStub().darDeBajaVehiculo(grpcRequest);
    }

    @Override
    public VehiculoResponseDTO getVehiculoById(Long id) {
        VehiculoIdRequest grpcRequest = VehiculoIdRequest.newBuilder()
                .setId(id != null ? id : 0L)
                .build();
        VehiculoResponse grpcResponse = grpcClientManager.getVehicleStub().consultarVehiculo(grpcRequest);
        return vehiculoGrpcMapper.toResponseDTO(grpcResponse);
    }

    @Override
    public List<VehiculoResponseDTO> getAllVehiculos() {
        ConsultarVehiculosRequest grpcRequest = ConsultarVehiculosRequest.newBuilder()
                .setSoloActivos(false)
                .build();
        ListaVehiculosResponse grpcResponse = grpcClientManager.getVehicleStub().consultarVehiculos(grpcRequest);
        return vehiculoGrpcMapper.toResponseDTOList(grpcResponse);
    }
}
