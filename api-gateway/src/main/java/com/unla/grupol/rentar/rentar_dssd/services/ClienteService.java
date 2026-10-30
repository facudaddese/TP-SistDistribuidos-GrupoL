package com.unla.grupol.rentar.rentar_dssd.services;

import customer.Customer.ClienteResponse;
import customer.Customer.ConsultarClienteRequest;
import customer.Customer.ConsultarClientesRequest;
import customer.Customer.CrearClienteRequest;
import customer.Customer.DarDeBajaClienteRequest;
import customer.Customer.ListaClientesResponse;
import customer.Customer.ModificarClienteRequest;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteRequest;
import com.unla.grupol.rentar.rentar_dssd.dto.ClienteUpdateRequest;
import com.unla.grupol.rentar.rentar_dssd.grpc.ClienteGrpcMapper;
import com.unla.grupol.rentar.rentar_dssd.grpc.GrpcClientManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final GrpcClientManager grpcClientManager;
    private final ClienteGrpcMapper clienteGrpcMapper;

    public List<com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse> listar() {
        // En el comportamiento anterior, listar() consultaba findAllByActivoTrue()
        ConsultarClientesRequest grpcRequest = ConsultarClientesRequest.newBuilder()
                .setSoloActivos(true)
                .build();
        ListaClientesResponse grpcResponse = grpcClientManager.getCustomerStub().consultarClientes(grpcRequest);
        return clienteGrpcMapper.toResponseDTOList(grpcResponse);
    }

    public com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse buscarPorId(Long id) {
        ConsultarClienteRequest grpcRequest = ConsultarClienteRequest.newBuilder()
                .setId(id != null ? Math.toIntExact(id) : 0)
                .build();
        ClienteResponse grpcResponse = grpcClientManager.getCustomerStub().consultarCliente(grpcRequest);
        return clienteGrpcMapper.toResponseDTO(grpcResponse);
    }

    public com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse crear(ClienteRequest request) {
        // La contraseña no se hashea en el API Gateway; se envía tal cual a CrearCliente
        // y customer-service la hashea con BCrypt. Viaja en texto claro solo por la red interna
        // entre contenedores / servicios. La contraseña nunca se loguea ni se devuelve en la respuesta.
        CrearClienteRequest grpcRequest = clienteGrpcMapper.toCrearRequest(request);
        ClienteResponse grpcResponse = grpcClientManager.getCustomerStub().crearCliente(grpcRequest);
        return clienteGrpcMapper.toResponseDTO(grpcResponse);
    }

    public com.unla.grupol.rentar.rentar_dssd.dto.ClienteResponse actualizar(Long id, ClienteUpdateRequest request) {
        ModificarClienteRequest grpcRequest = clienteGrpcMapper.toModificarRequest(id, request);
        ClienteResponse grpcResponse = grpcClientManager.getCustomerStub().modificarCliente(grpcRequest);
        return clienteGrpcMapper.toResponseDTO(grpcResponse);
    }

    public void darDeBaja(Long id) {
        DarDeBajaClienteRequest grpcRequest = DarDeBajaClienteRequest.newBuilder()
                .setId(id != null ? Math.toIntExact(id) : 0)
                .build();
        grpcClientManager.getCustomerStub().darDeBajaCliente(grpcRequest);
    }
}
