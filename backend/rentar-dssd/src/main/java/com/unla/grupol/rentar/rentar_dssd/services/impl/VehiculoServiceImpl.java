package com.unla.grupol.rentar.rentar_dssd.services.impl;

import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.VehiculoResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.entities.Vehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.exceptions.BadRequestException;
import com.unla.grupol.rentar.rentar_dssd.exceptions.ResourceNotFoundException;
import com.unla.grupol.rentar.rentar_dssd.repositories.VehiculoRepository;
import com.unla.grupol.rentar.rentar_dssd.services.VehiculoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository vehiculoRepository;

    @Override
    @Transactional
    public VehiculoResponseDTO createVehiculo(VehiculoRequestDTO request) {
        if (vehiculoRepository.existsByPatente(request.getPatente())) {
            throw new BadRequestException("Ya existe un vehiculo con la patente: " + request.getPatente());
        }

        Vehiculo vehiculo = Vehiculo.builder()
                .patente(request.getPatente())
                .marca(request.getMarca())
                .modelo(request.getModelo())
                .anio(request.getAnio())
                .color(request.getColor())
                .tipoVehiculo(request.getTipoVehiculo())
                .precioDiario(request.getPrecioDiario())
                .estado(EstadoVehiculo.DISPONIBLE)
                .activo(true)
                .build();

        vehiculo = vehiculoRepository.save(vehiculo);
        return mapToResponseDTO(vehiculo);
    }

    @Override
    @Transactional
    public VehiculoResponseDTO updateVehiculo(Long id, VehiculoRequestDTO request) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehiculo no encontrado con ID: " + id));

        vehiculo.setMarca(request.getMarca());
        vehiculo.setModelo(request.getModelo());
        vehiculo.setAnio(request.getAnio());
        vehiculo.setColor(request.getColor());
        vehiculo.setTipoVehiculo(request.getTipoVehiculo());
        vehiculo.setPrecioDiario(request.getPrecioDiario());
        
        vehiculo = vehiculoRepository.save(vehiculo);
        return mapToResponseDTO(vehiculo);
    }

    @Override
    @Transactional
    public void deleteVehiculo(Long id) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehiculo no encontrado con ID: " + id));
        
        vehiculo.setActivo(false);
        vehiculoRepository.save(vehiculo);
    }

    @Override
    @Transactional(readOnly = true)
    public VehiculoResponseDTO getVehiculoById(Long id) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehiculo no encontrado con ID: " + id));
        return mapToResponseDTO(vehiculo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehiculoResponseDTO> getAllVehiculos() {
        return vehiculoRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private VehiculoResponseDTO mapToResponseDTO(Vehiculo vehiculo) {
        return VehiculoResponseDTO.builder()
                .id(vehiculo.getId())
                .patente(vehiculo.getPatente())
                .marca(vehiculo.getMarca())
                .modelo(vehiculo.getModelo())
                .anio(vehiculo.getAnio())
                .color(vehiculo.getColor())
                .tipoVehiculo(vehiculo.getTipoVehiculo())
                .precioDiario(vehiculo.getPrecioDiario())
                .estado(vehiculo.getEstado())
                .activo(vehiculo.isActivo())
                .build();
    }
}
