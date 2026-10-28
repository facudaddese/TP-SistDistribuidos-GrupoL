import * as grpc from '@grpc/grpc-js';
import bcrypt from 'bcryptjs';
import * as clienteRepository from './clienteRepository.js';
import {
  ConsultarClientesRequest,
  ConsultarClienteRequest,
  ConsultarClientePorDocumentoRequest,
  VerificarClienteRequest,
  ClienteResponse,
  ListaClientesResponse,
  ExistenciaResponse,
  ActivoResponse,
  CrearClienteRequest,
  ModificarClienteRequest,
  DarDeBajaClienteRequest,
} from './types.js';

function validarDocumento(documento: unknown): string | null {
  if (typeof documento !== 'string' || !/^[a-zA-Z0-9]{1,20}$/.test(documento.trim())) {
    return 'El documento debe ser alfanumérico y tener como máximo 20 caracteres';
  }
  return null;
}

function validarNombre(nombre: unknown): string | null {
  if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.trim().length > 100) {
    return 'El nombre no puede estar vacío y debe tener como máximo 100 caracteres';
  }
  return null;
}

function validarApellido(apellido: unknown): string | null {
  if (typeof apellido !== 'string' || apellido.trim().length === 0 || apellido.trim().length > 100) {
    return 'El apellido no puede estar vacío y debe tener como máximo 100 caracteres';
  }
  return null;
}

function validarEmail(email: unknown): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    typeof email !== 'string' ||
    email.trim().length === 0 ||
    email.trim().length > 150 ||
    !emailRegex.test(email.trim())
  ) {
    return 'El email no tiene un formato válido o excede los 150 caracteres';
  }
  return null;
}

function validarPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  return null;
}

function validarTelefono(telefono: unknown): string | null {
  if (telefono !== undefined && telefono !== null && typeof telefono === 'string') {
    if (telefono.trim().length > 30) {
      return 'El teléfono debe tener como máximo 30 caracteres';
    }
  }
  return null;
}

function validarFechaNacimiento(fechaNacimiento: unknown): string | null {
  if (
    fechaNacimiento !== undefined &&
    fechaNacimiento !== null &&
    typeof fechaNacimiento === 'string' &&
    fechaNacimiento.trim().length > 0
  ) {
    const fechaTrim = fechaNacimiento.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTrim)) {
      return 'La fecha de nacimiento debe tener formato yyyy-MM-dd';
    }
    const [yearStr, monthStr, dayStr] = fechaTrim.split('-');
    const year = parseInt(yearStr!, 10);
    const month = parseInt(monthStr!, 10);
    const day = parseInt(dayStr!, 10);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return 'La fecha de nacimiento no es una fecha válida en el calendario';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed >= today) {
      return 'La fecha de nacimiento debe ser en el pasado';
    }
  }
  return null;
}

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

      const errorDoc = validarDocumento(documento);
      if (errorDoc) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: errorDoc,
        }, null);
      }

      const cliente = await clienteRepository.consultarClientePorDocumento(documento.trim());

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
  },

  CrearCliente: async (
    call: grpc.ServerUnaryCall<CrearClienteRequest, ClienteResponse>,
    callback: grpc.sendUnaryData<ClienteResponse>
  ) => {
    try {
      const { documento, nombre, apellido, email, password, telefono, fechaNacimiento } = call.request;
      console.log(`[RPC] CrearCliente`);

      const errorDoc = validarDocumento(documento);
      if (errorDoc) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorDoc }, null);
      }

      const errorNombre = validarNombre(nombre);
      if (errorNombre) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorNombre }, null);
      }

      const errorApellido = validarApellido(apellido);
      if (errorApellido) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorApellido }, null);
      }

      const errorEmail = validarEmail(email);
      if (errorEmail) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorEmail }, null);
      }

      const errorPassword = validarPassword(password);
      if (errorPassword) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorPassword }, null);
      }

      const errorTelefono = validarTelefono(telefono);
      if (errorTelefono) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorTelefono }, null);
      }

      const errorFecha = validarFechaNacimiento(fechaNacimiento);
      if (errorFecha) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorFecha }, null);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const nuevoCliente = await clienteRepository.crearCliente({
        documento: documento.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        passwordHash,
        telefono: telefono ? telefono.trim() : null,
        fechaNacimiento: fechaNacimiento ? fechaNacimiento.trim() : null,
      });

      callback(null, nuevoCliente);
    } catch (error) {
      if (error instanceof clienteRepository.ClienteDuplicateError) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: error.message,
        }, null);
      }
      // Sanitizar el log para no imprimir error.sql (que contiene el hash interpolado por mysql2)
      const errorSanitizado = error instanceof Error
        ? { message: error.message, name: error.name, code: (error as any).code, errno: (error as any).errno }
        : error;
      console.error('[RPC Error] CrearCliente:', errorSanitizado);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al crear cliente',
      }, null);
    }
  },

  ModificarCliente: async (
    call: grpc.ServerUnaryCall<ModificarClienteRequest, ClienteResponse>,
    callback: grpc.sendUnaryData<ClienteResponse>
  ) => {
    try {
      const { id, documento, nombre, apellido, email, telefono, fechaNacimiento } = call.request;
      console.log(`[RPC] ModificarCliente - id: ${id}`);

      if (!Number.isInteger(id) || id <= 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'El ID del cliente debe ser un entero positivo',
        }, null);
      }

      const errorDoc = validarDocumento(documento);
      if (errorDoc) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorDoc }, null);
      }

      const errorNombre = validarNombre(nombre);
      if (errorNombre) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorNombre }, null);
      }

      const errorApellido = validarApellido(apellido);
      if (errorApellido) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorApellido }, null);
      }

      const errorEmail = validarEmail(email);
      if (errorEmail) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorEmail }, null);
      }

      const errorTelefono = validarTelefono(telefono);
      if (errorTelefono) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorTelefono }, null);
      }

      const errorFecha = validarFechaNacimiento(fechaNacimiento);
      if (errorFecha) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: errorFecha }, null);
      }

      const clienteModificado = await clienteRepository.modificarCliente({
        id,
        documento: documento.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono: telefono ? telefono.trim() : null,
        fechaNacimiento: fechaNacimiento ? fechaNacimiento.trim() : null,
      });

      if (!clienteModificado) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Cliente no encontrado',
        }, null);
      }

      callback(null, clienteModificado);
    } catch (error) {
      if (error instanceof clienteRepository.ClienteDuplicateError) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: error.message,
        }, null);
      }
      console.error('[RPC Error] ModificarCliente:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al modificar cliente',
      }, null);
    }
  },

  DarDeBajaCliente: async (
    call: grpc.ServerUnaryCall<DarDeBajaClienteRequest, ClienteResponse>,
    callback: grpc.sendUnaryData<ClienteResponse>
  ) => {
    try {
      const { id } = call.request;
      console.log(`[RPC] DarDeBajaCliente - id: ${id}`);

      if (!Number.isInteger(id) || id <= 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'El ID del cliente debe ser un entero positivo',
        }, null);
      }

      const clienteDadoDeBaja = await clienteRepository.darDeBajaCliente(id);

      if (!clienteDadoDeBaja) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Cliente no encontrado',
        }, null);
      }

      callback(null, clienteDadoDeBaja);
    } catch (error) {
      if (error instanceof clienteRepository.ClienteYaInactivoError) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: error.message,
        }, null);
      }
      console.error('[RPC Error] DarDeBajaCliente:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor al dar de baja el cliente',
      }, null);
    }
  },
};
