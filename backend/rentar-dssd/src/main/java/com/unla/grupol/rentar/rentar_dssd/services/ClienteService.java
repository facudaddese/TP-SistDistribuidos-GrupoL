package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.rentar_dssd.dto.ClienteRequest;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteUpdateRequest;
import com.unla.grupol.rentar.rentar_dssd.entities.Cliente;
import com.unla.grupol.rentar.rentar_dssd.exceptions.RecursoNoEncontradoException;
import com.unla.grupol.rentar.rentar_dssd.repositories.ClienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public ClienteService(
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAllByActivoTrue()
                .stream()
                .map(this::convertirAResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        Cliente cliente = buscarEntidad(id);
        return convertirAResponse(cliente);
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        if (clienteRepository.existsByDocumento(request.documento())) {
            throw new IllegalArgumentException(
                    "Ya existe un cliente con ese documento"
            );
        }

        if (clienteRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                    "Ya existe un usuario con ese email"
            );
        }

        Cliente cliente = Cliente.builder()
                .documento(request.documento())
                .nombre(request.nombre())
                .apellido(request.apellido())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .telefono(request.telefono())
                .fechaNacimiento(request.fechaNacimiento())
                .activo(true)
                .build();

        Cliente clienteGuardado = clienteRepository.save(cliente);

        return convertirAResponse(clienteGuardado);
    }

    @Transactional
    public ClienteResponse actualizar(
            Long id,
            ClienteUpdateRequest request
    ) {
        Cliente cliente = buscarEntidad(id);

        clienteRepository.findByDocumento(request.documento())
                .filter(encontrado -> !encontrado.getId().equals(id))
                .ifPresent(encontrado -> {
                    throw new IllegalArgumentException(
                            "Ya existe otro cliente con ese documento"
                    );
                });

        clienteRepository.findByEmail(request.email())
                .filter(encontrado -> !encontrado.getId().equals(id))
                .ifPresent(encontrado -> {
                    throw new IllegalArgumentException(
                            "Ya existe otro usuario con ese email"
                    );
                });

        cliente.setDocumento(request.documento());
        cliente.setNombre(request.nombre());
        cliente.setApellido(request.apellido());
        cliente.setEmail(request.email());
        cliente.setTelefono(request.telefono());
        cliente.setFechaNacimiento(request.fechaNacimiento());

        Cliente clienteActualizado = clienteRepository.save(cliente);

        return convertirAResponse(clienteActualizado);
    }

    @Transactional
    public void darDeBaja(Long id) {
        Cliente cliente = buscarEntidad(id);

        if (!cliente.isActivo()) {
            throw new IllegalArgumentException(
                    "El cliente ya se encuentra dado de baja"
            );
        }

        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    private Cliente buscarEntidad(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "No se encontró el cliente con ID " + id
                        )
                );
    }

    private ClienteResponse convertirAResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getDocumento(),
                cliente.getNombre(),
                cliente.getApellido(),
                cliente.getEmail(),
                cliente.getTelefono(),
                cliente.getFechaNacimiento(),
                cliente.isActivo()
        );
    }
}
