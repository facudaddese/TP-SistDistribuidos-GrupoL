// @ts-nocheck
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import {
  validarRangoFechas,
  obtenerVehiculosOcupados,
  vehiculoTieneSuperposicion,
} from "./reservasService";

// 1. Cargar el archivo .proto
const PROTO_PATH = path.resolve(__dirname, "./proto/rental.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const rentalProto = protoDescriptor.rental;

// 2. Base de datos en memoria para reservas
let reservas: any[] = [];
let nextId = 1;

// 3. Implementación de las funciones gRPC
const serverImplementation = {
  CrearReserva: (call: any, callback: any) => {
    try {
      const {
        clienteId,
        vehiculoId,
        fechaHoraInicio,
        fechaHoraFin,
        importeTotal,
      } = call.request;

      const rango = validarRangoFechas(fechaHoraInicio, fechaHoraFin);
      if (!rango.esValido) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message:
            "Las fechas deben ser cadenas ISO-8601 válidas y la fecha de fin debe ser posterior a la de inicio",
        });
      }

      if (
        vehiculoTieneSuperposicion(
          reservas,
          vehiculoId,
          rango.inicioMs,
          rango.finMs,
        )
      ) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: "El vehículo no está disponible en el período solicitado",
        });
      }

      const nuevaReserva = {
        id: nextId++,
        clienteId,
        vehiculoId,
        fechaHoraInicio,
        fechaHoraFin,
        importeTotal,
        estado: "CONFIRMADA",
      };

      reservas.push(nuevaReserva);
      console.log("[RentalService] Reserva creada con éxito:", nuevaReserva);
      callback(null, nuevaReserva);
    } catch (error) {
      console.error("[RentalService] Error al crear reserva:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error interno al crear la reserva",
      });
    }
  },

  ConsultarReservas: (call: any, callback: any) => {
    const { clienteId, vehiculoId, estado } = call.request;
    let resultado = reservas;

    if (clienteId)
      resultado = resultado.filter((r) => r.clienteId === clienteId);
    if (vehiculoId)
      resultado = resultado.filter((r) => r.vehiculoId === vehiculoId);
    if (estado) resultado = resultado.filter((r) => r.estado === estado);

    callback(null, { reservas: resultado });
  },

  CancelarReserva: (call: any, callback: any) => {
    const { id } = call.request;
    const reserva = reservas.find((r) => r.id === id);

    if (!reserva) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Reserva no encontrada",
      });
    }

    reserva.estado = "CANCELADA";
    console.log("[RentalService] Reserva cancelada:", reserva);
    callback(null, reserva);
  },

  ConsultarHistorial: (call: any, callback: any) => {
    const { clienteId } = call.request;
    const historial = reservas.filter((r) => r.clienteId === clienteId);
    callback(null, { reservas: historial });
  },

  ConsultarVehiculosOcupados: (call: any, callback: any) => {
    try {
      const { fechaInicio, fechaFin } = call.request;

      const rango = validarRangoFechas(fechaInicio, fechaFin);
      if (!rango.esValido) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message:
            "Las fechas deben ser cadenas ISO-8601 válidas y la fecha de fin debe ser posterior a la de inicio",
        });
      }

      const vehiculoIds = obtenerVehiculosOcupados(
        reservas,
        rango.inicioMs,
        rango.finMs,
      );

      callback(null, { vehiculoIds });
    } catch (error) {
      console.error(
        "[RentalService] Error al consultar vehículos ocupados:",
        error,
      );
      callback({
        code: grpc.status.INTERNAL,
        message: "Error interno al consultar vehículos ocupados",
      });
    }
  },
};

// 4. Iniciar Servidor gRPC
const server = new grpc.Server();
server.addService(rentalProto.RentalService.service, serverImplementation);

const PORT = "50053";

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, boundPort) => {
    if (err) {
      console.error("Error al iniciar el servidor gRPC:", err);
      return;
    }
    console.log(`Rental Service gRPC corriendo en puerto ${boundPort}`);
  },
);
