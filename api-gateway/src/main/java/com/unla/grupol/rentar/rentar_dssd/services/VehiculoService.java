package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoUpdateRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.VehiculoResponseDTO;

import java.util.List;

public interface VehiculoService {
    VehiculoResponseDTO createVehiculo(VehiculoRequestDTO request);
    VehiculoResponseDTO updateVehiculo(Long id, VehiculoUpdateRequestDTO request);
    void deleteVehiculo(Long id);
    VehiculoResponseDTO getVehiculoById(Long id);
    List<VehiculoResponseDTO> getAllVehiculos();
}
