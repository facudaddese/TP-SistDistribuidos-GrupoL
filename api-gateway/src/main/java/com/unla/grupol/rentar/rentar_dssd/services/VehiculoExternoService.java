package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.grpc.vehicle.*;
import com.unla.grupol.rentar.rentar_dssd.dtos.request.VehiculoRequestDTO;
import com.unla.grupol.rentar.rentar_dssd.dtos.response.SolicitudExternaResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.grpc.GrpcClientManager;
import com.unla.grupol.rentar.rentar_dssd.repositories.ClienteRepository;
import customer.Customer.ClienteResponse;
import customer.Customer.ConsultarClienteRequest;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class VehiculoExternoService {

    private final GrpcClientManager grpcClientManager;
    private final ClienteRepository clienteRepository;

    private ClienteResponse obtenerCliente(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesión"
            );
        }

        var cliente = clienteRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "El usuario no tiene un cliente asociado"
                ));

        if (!cliente.isActivo()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El cliente está inactivo"
            );
        }

        // customer.proto utiliza int32 para el ID.
        if (cliente.getId() <= 0 ||
                cliente.getId() > Integer.MAX_VALUE) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "El ID del cliente excede el rango admitido"
            );
        }

        var respuesta = ejecutarGrpc(() ->
                grpcClientManager.getCustomerStub()
                        .withDeadlineAfter(5, TimeUnit.SECONDS)
                        .consultarCliente(
                                ConsultarClienteRequest.newBuilder()
                                        .setId(cliente.getId().intValue())
                                        .build()
                        )
        );

        if (respuesta.getId() != cliente.getId().intValue()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "El servicio de clientes devolvió una identidad diferente"
            );
        }

        if (!respuesta.getActivo()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El cliente está inactivo"
            );
        }

        if (respuesta.getDocumento().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El cliente no tiene documento registrado"
            );
        }

        return respuesta;
    }

    public SolicitudExternaResponseDTO crear(
            VehiculoRequestDTO request,
            Authentication authentication
    ) {
        var cliente = obtenerCliente(authentication);

        var peticion = CrearSolicitudExternaRequest.newBuilder()
                .setClienteId(cliente.getId())
                .setDocumento(cliente.getDocumento())
                .setPatente(request.getPatente())
                .setMarca(request.getMarca())
                .setModelo(request.getModelo())
                .setAnio(request.getAnio())
                .setColor(request.getColor() == null ? "" : request.getColor())
                .setTipoVehiculo(request.getTipoVehiculo().name())
                .setPrecioDiario(request.getPrecioDiario().toPlainString())
                .build();

        var respuesta = ejecutarGrpc(() ->
                grpcClientManager.getVehicleStub()
                        .withDeadlineAfter(5, TimeUnit.SECONDS)
                        .crearSolicitudExterna(peticion)
        );

        return convertir(respuesta);
    }

    public SolicitudExternaResponseDTO consultar(
            Long id,
            Authentication authentication
    ) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El ID debe ser positivo"
            );
        }

        var cliente = obtenerCliente(authentication);

        var peticion = ConsultarSolicitudExternaRequest.newBuilder()
                .setVehiculoExternoId(id)
                .setClienteId(cliente.getId())
                .build();

        return convertir(ejecutarGrpc(() ->
                grpcClientManager.getVehicleStub()
                        .withDeadlineAfter(5, TimeUnit.SECONDS)
                        .consultarSolicitudExterna(peticion)
        ));
    }

    public List<SolicitudExternaResponseDTO> listar(
            Authentication authentication
    ) {
        var cliente = obtenerCliente(authentication);

        var peticion = SolicitudesExternasClienteRequest.newBuilder()
                .setClienteId(cliente.getId())
                .build();

        var respuesta = ejecutarGrpc(() ->
                grpcClientManager.getVehicleStub()
                        .withDeadlineAfter(5, TimeUnit.SECONDS)
                        .consultarSolicitudesExternasPorCliente(peticion)
        );

        return respuesta.getSolicitudesList()
                .stream()
                .map(this::convertir)
                .toList();
    }

    private SolicitudExternaResponseDTO convertir(
            SolicitudExternaResponse respuesta
    ) {
        return new SolicitudExternaResponseDTO(
                respuesta.getVehiculoExternoId(),
                respuesta.getClienteId(),
                respuesta.getPatente(),
                respuesta.getMarca(),
                respuesta.getModelo(),
                respuesta.getAnio(),
                respuesta.getColor(),
                respuesta.getTipoVehiculo(),
                respuesta.getPrecioDiario(),
                respuesta.getEstado(),
                respuesta.hasResultadoPatente()
                        ? respuesta.getResultadoPatente() : null,
                respuesta.hasResultadoTitularidad()
                        ? respuesta.getResultadoTitularidad() : null,
                respuesta.hasVehiculoId()
                        ? respuesta.getVehiculoId() : null
        );
    }

    private <T> T ejecutarGrpc(Supplier<T> operacion) {
        try {
            return operacion.get();
        } catch (StatusRuntimeException error) {
            HttpStatus estado = switch (error.getStatus().getCode()) {
                case INVALID_ARGUMENT -> HttpStatus.BAD_REQUEST;
                case NOT_FOUND -> HttpStatus.NOT_FOUND;
                case ALREADY_EXISTS -> HttpStatus.CONFLICT;
                case PERMISSION_DENIED -> HttpStatus.FORBIDDEN;
                case UNAUTHENTICATED -> HttpStatus.UNAUTHORIZED;
                case UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
                case DEADLINE_EXCEEDED -> HttpStatus.GATEWAY_TIMEOUT;
                default -> HttpStatus.BAD_GATEWAY;
            };

            String mensaje = switch (error.getStatus().getCode()) {
                case INVALID_ARGUMENT, NOT_FOUND, ALREADY_EXISTS ->
                        error.getStatus().getDescription();
                default -> "No se pudo completar la operación con el microservicio";
            };

            throw new ResponseStatusException(estado, mensaje, error);
        }
    }
}
