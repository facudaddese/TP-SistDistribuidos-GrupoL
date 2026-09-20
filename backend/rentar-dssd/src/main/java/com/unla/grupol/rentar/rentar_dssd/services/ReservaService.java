package com.unla.grupol.rentar.rentar_dssd.services;

import java.util.List;

import com.unla.grupol.rentar.rentar_dssd.dtos.request.ReservaRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.ReservaResponseDTO;

public interface ReservaService {
    ReservaResponseDTO crearReserva(ReservaRequestDTO request);

    List<ReservaResponseDTO> obtenerTodas();
}
