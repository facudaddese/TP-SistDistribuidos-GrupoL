import * as grpc from '@grpc/grpc-js';
import * as clienteRepository from './clienteRepository.js';
import {
  ConsultarClientesRequest,
  ConsultarClienteRequest,
  ConsultarClientePorDocumentoRequest,
  VerificarClienteRequest,
  ClienteResponse,
  ListaClientesResponse,
  ExistenciaResponse,
  ActivoResponse
} from './types.js';

export const handlers = {
  ConsultarClientes: async (
    call: grpc.ServerUnaryCall<ConsultarClientesRequest, ListaClientesResponse>,
    callback: grpc.sendUnaryData<ListaClientesResponse>
  ) => {
    try {
      const { soloActivos } = call.request;
      console.log(`[RPC] ConsultarClientes - soloActivos: ${soloActivos}`);
      
      const clientes = await clienteRepository.consultarClientes(soloActivos);
      callback(null, { clientes });
    } catch (error) {
      console.error('[RPC Error] ConsultarClientes:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al consultar clientes',
      }, null);
    }
  },

  ConsultarCliente: async (
    call: grpc.ServerUnaryCall<ConsultarClienteRequest, ClienteResponse>,
    callback: grpc.sendUnaryData<ClienteResponse>
  ) => {
    try {
      const { id } = call.request;
      console.log(`[RPC] ConsultarCliente - id: ${id}`);

      if (!Number.isInteger(id) || id <= 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'El ID del cliente debe ser un entero positivo',
        }, null);
      }

      const cliente = await clienteRepository.consultarCliente(id);
      
      if (!cliente) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Cliente no encontrado',
        }, null);
      }

      callback(null, cliente);
    } catch (error) {
      console.error('[RPC Error] ConsultarCliente:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al consultar cliente',
      }, null);
    }
  },

  VerificarExistencia: async (
    call: grpc.ServerUnaryCall<VerificarClienteRequest, ExistenciaResponse>,
    callback: grpc.sendUnaryData<ExistenciaResponse>
  ) => {
    try {
      const { id } = call.request;
      console.log(`[RPC] VerificarExistencia - id: ${id}`);

      if (!Number.isInteger(id) || id <= 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'El ID del cliente debe ser un entero positivo',
        }, null);
      }

      const existe = await clienteRepository.verificarExistencia(id);
      callback(null, { existe });
    } catch (error) {
      console.error('[RPC Error] VerificarExistencia:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al verificar existencia',
      }, null);
    }
  },

  VerificarActivo: async (
    call: grpc.ServerUnaryCall<VerificarClienteRequest, ActivoResponse>,
    callback: grpc.sendUnaryData<ActivoResponse>
  ) => {
    try {
      const { id } = call.request;
      console.log(`[RPC] VerificarActivo - id: ${id}`);

      if (!Number.isInteger(id) || id <= 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'El ID del cliente debe ser un entero positivo',
        }, null);
      }

      const resultado = await clienteRepository.verificarActivo(id);
      callback(null, resultado);
    } catch (error) {
      console.error('[RPC Error] VerificarActivo:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al verificar estado activo',
      }, null);
    }
  },

  ConsultarClientePorDocumento: async (
    call: grpc.ServerUnaryCall<ConsultarClientePorDocumentoRequest, ClienteResponse>,
    callback: grpc.sendUnaryData<ClienteResponse>
  ) => {
    try {
      const { documento } = call.request;
      console.log(`[RPC] ConsultarClientePorDocumento`);

      if (!documento || typeof documento !== 'string' || !/^[a-zA-Z0-9]{1,20}$/.test(documento)) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'El documento debe ser alfanumérico y tener como máximo 20 caracteres',
        }, null);
      }

      const cliente = await clienteRepository.consultarClientePorDocumento(documento);

      if (!cliente) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Cliente no encontrado',
        }, null);
      }

      callback(null, cliente);
    } catch (error) {
      console.error('[RPC Error] ConsultarClientePorDocumento:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al consultar cliente',
      }, null);
    }
  }
};
