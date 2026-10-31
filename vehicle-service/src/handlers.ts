import * as grpc from "@grpc/grpc-js";
import * as vehiculoRepository from "./vehiculoRepository";
import type {
  ConsultarVehiculosRequest,
  CrearVehiculoRequest,
  ListaVehiculosResponse,
  VehiculoIdRequest,
  VehiculoResponse,
  ModificarVehiculoRequest,
  ActualizarEstadoRequest,
  BuscarVehiculosDisponiblesRequest,
} from "./types";
import { publicarSolicitudVerificacion } from "./verificacionPublisher";
import * as externosRepository from "./externos/repository";
import type {
    CrearSolicitudExterna,
    SolicitudExterna,
} from "./externos/types";

class ErrorValidacion extends Error {}

function precioEnCentavos(valor: string, campo: string): bigint {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(valor)) {
    throw new ErrorValidacion(
      `${campo} debe ser un decimal no negativo con hasta 2 decimales`,
    );
  }

  const [entero, decimal = ""] = valor.split(".");
  return BigInt(entero!) * 100n + BigInt(decimal.padEnd(2, "0"));
}

import { TIPOS_VEHICULO, ESTADOS_VEHICULO } from "./types";

function validarId(id: string): boolean {
  if (!/^[1-9]\d*$/.test(id)) {
    return false;
  }

  // Máximo de un Long positivo de Java.
  return BigInt(id) <= 9223372036854775807n;
}

const consultarVehiculos: grpc.handleUnaryCall<
  ConsultarVehiculosRequest,
  ListaVehiculosResponse
> = async (call, callback) => {
  try {
    const vehiculos = await vehiculoRepository.consultarVehiculos(
      call.request.soloActivos,
    );

    callback(null, { vehiculos });
  } catch (error) {
    console.error("[VehicleService] Error al consultar vehículos:", error);

    callback({
      code: grpc.status.INTERNAL,
      message: "Error interno al consultar vehículos",
    });
  }
};

const consultarVehiculo: grpc.handleUnaryCall<
  VehiculoIdRequest,
  VehiculoResponse
> = async (call, callback) => {
  try {
    const { id } = call.request;

    if (!validarId(id)) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "El ID debe ser un entero positivo válido",
      });
      return;
    }

    const vehiculo = await vehiculoRepository.consultarVehiculo(id);

    if (!vehiculo) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: "Vehículo no encontrado",
      });
      return;
    }

    callback(null, vehiculo);
  } catch (error) {
    console.error("[VehicleService] Error al consultar vehículo:", error);

    callback({
      code: grpc.status.INTERNAL,
      message: "Error interno al consultar vehículo",
    });
  }
};

function validarNuevoVehiculo(datos: CrearVehiculoRequest): string | null {
  if (!datos.patente || datos.patente.length > 10) {
    return "La patente es obligatoria y admite hasta 10 caracteres";
  }

  if (!datos.marca || datos.marca.length > 50) {
    return "La marca es obligatoria y admite hasta 50 caracteres";
  }

  if (!datos.modelo || datos.modelo.length > 50) {
    return "El modelo es obligatorio y admite hasta 50 caracteres";
  }

  if (!Number.isInteger(datos.anio) || datos.anio <= 0) {
    return "El año debe ser un entero positivo";
  }

  if (datos.color.length > 30) {
    return "El color admite hasta 30 caracteres";
  }

  if (!TIPOS_VEHICULO.some((tipo) => tipo === datos.tipoVehiculo)) {
    return "Tipo inválido: use SEDAN, SUV, PICKUP, COUPE o HATCHBACK";
  }

  // Compatible con DECIMAL(10,2): hasta 8 enteros y 2 decimales.
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(datos.precioDiario)) {
    return "El precio admite hasta 8 enteros y 2 decimales, con punto decimal";
  }

  const [entero, decimal = ""] = datos.precioDiario.split(".");
  const centavos = BigInt(entero!) * 100n + BigInt(decimal.padEnd(2, "0"));

  if (centavos <= 0n) {
    return "El precio diario debe ser mayor a 0";
  }

  return null;
}

const crearVehiculo: grpc.handleUnaryCall<
  CrearVehiculoRequest,
  VehiculoResponse
> = async (call, callback) => {
  try {
    const datos: CrearVehiculoRequest = {
      patente: (call.request.patente ?? "").trim().toUpperCase(),
      marca: (call.request.marca ?? "").trim(),
      modelo: (call.request.modelo ?? "").trim(),
      anio: call.request.anio,
      color: (call.request.color ?? "").trim(),
      tipoVehiculo: (call.request.tipoVehiculo ?? "").trim(),
      precioDiario: (call.request.precioDiario ?? "").trim(),
    };

    const errorValidacion = validarNuevoVehiculo(datos);

    if (errorValidacion) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: errorValidacion,
      });
      return;
    }

    const vehiculo = await vehiculoRepository.crearVehiculo(datos);

    // Emitir evento a RabbitMQ de forma asíncrona
    publicarSolicitudVerificacion({
      id: Number(vehiculo.id),
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
    }).catch((err) =>
      console.error(
        "[RabbitMQ] Error publicando solicitud de verificación:",
        err,
      ),
    );

    callback(null, vehiculo);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      callback({
        code: grpc.status.ALREADY_EXISTS,
        message: "Ya existe un vehículo con esa patente",
      });
      return;
    }

    console.error("[VehicleService] Error al crear vehículo:", error);

    callback({
      code: grpc.status.INTERNAL,
      message: "Error interno al crear vehículo",
    });
  }
};

const modificarVehiculo: grpc.handleUnaryCall<
  ModificarVehiculoRequest,
  VehiculoResponse
> = async (call, callback) => {
  try {
    const { id } = call.request;

    if (!validarId(id)) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "El ID debe ser un entero positivo válido",
      });
      return;
    }

    const actual = await vehiculoRepository.consultarVehiculo(id);

    if (!actual) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: "Vehículo no encontrado",
      });
      return;
    }

    const datos: ModificarVehiculoRequest = {
      id,
      marca: (call.request.marca ?? "").trim(),
      modelo: (call.request.modelo ?? "").trim(),
      anio: call.request.anio,
      color: (call.request.color ?? "").trim(),
      tipoVehiculo: (call.request.tipoVehiculo ?? "").trim(),
      precioDiario: (call.request.precioDiario ?? "").trim(),
    };

    // Reutiliza las validaciones del alta con la patente existente.
    const errorValidacion = validarNuevoVehiculo({
      ...datos,
      patente: actual.patente,
    });

    if (errorValidacion) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: errorValidacion,
      });
      return;
    }

    const vehiculo = await vehiculoRepository.modificarVehiculo(datos);

    if (!vehiculo) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: "Vehículo no encontrado",
      });
      return;
    }

    callback(null, vehiculo);
  } catch (error) {
    console.error("[VehicleService] Error al modificar vehículo:", error);

    callback({
      code: grpc.status.INTERNAL,
      message: "Error interno al modificar vehículo",
    });
  }
};

const darDeBajaVehiculo: grpc.handleUnaryCall<
  VehiculoIdRequest,
  VehiculoResponse
> = async (call, callback) => {
  try {
    const { id } = call.request;

    if (!validarId(id)) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "El ID debe ser un entero positivo válido",
      });
      return;
    }

    const vehiculo = await vehiculoRepository.darDeBajaVehiculo(id);

    if (!vehiculo) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: "Vehículo no encontrado",
      });
      return;
    }

    callback(null, vehiculo);
  } catch (error) {
    console.error("[VehicleService] Error al dar de baja:", error);

    callback({
      code: grpc.status.INTERNAL,
      message: "Error interno al dar de baja el vehículo",
    });
  }
};

const actualizarEstado: grpc.handleUnaryCall<
  ActualizarEstadoRequest,
  VehiculoResponse
> = async (call, callback) => {
  try {
    const { id } = call.request;

    if (!validarId(id)) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "El ID debe ser un entero positivo válido",
      });
      return;
    }

    const estado = ESTADOS_VEHICULO.find(
      (valor) => valor === call.request.estado,
    );

    if (!estado) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Estado inválido: use DISPONIBLE, RESERVADO o EN_ALQUILER",
      });
      return;
    }

    const vehiculo = await vehiculoRepository.actualizarEstado(id, estado);

    if (!vehiculo) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: "Vehículo no encontrado",
      });
      return;
    }

    callback(null, vehiculo);
  } catch (error) {
    console.error("[VehicleService] Error al actualizar estado:", error);

    callback({
      code: grpc.status.INTERNAL,
      message: "Error interno al actualizar el estado",
    });
  }
};

const buscarVehiculosDisponibles: grpc.handleUnaryCall<
  BuscarVehiculosDisponiblesRequest,
  ListaVehiculosResponse
> = async (call, callback) => {
  try {
    const { tipoVehiculo, marca, modelo, precioMin, precioMax, idsExcluidos } =
      call.request;

    // Validar idsExcluidos si existen
    if (idsExcluidos !== undefined && idsExcluidos !== null) {
      if (!Array.isArray(idsExcluidos)) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "La lista de IDs excluidos debe ser un arreglo",
        });
      }

      if (idsExcluidos.length > 1000) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message:
            "La lista de IDs excluidos no puede superar los 1000 elementos",
        });
      }

      const idRegex = /^[1-9][0-9]{0,18}$/;
      for (const id of idsExcluidos) {
        if (typeof id !== "string" || !idRegex.test(id)) {
          return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Uno o más IDs excluidos son inválidos",
          });
        }
      }
    }

    if (
      tipoVehiculo !== undefined &&
      tipoVehiculo !== "" &&
      !TIPOS_VEHICULO.some((tipo) => tipo === tipoVehiculo)
    ) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "El tipo de vehículo es inválido",
      });
    }

    let precioMinCentavos: bigint | undefined = undefined;
    let precioMaxCentavos: bigint | undefined = undefined;

    if (precioMin !== undefined && precioMin !== "") {
      precioMinCentavos = precioEnCentavos(precioMin, "precioMin");
    }

    if (precioMax !== undefined && precioMax !== "") {
      precioMaxCentavos = precioEnCentavos(precioMax, "precioMax");
    }

    if (
      precioMinCentavos !== undefined &&
      precioMaxCentavos !== undefined &&
      precioMinCentavos > precioMaxCentavos
    ) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "precioMin no puede ser mayor a precioMax",
      });
    }

    const marcaFiltro = (marca ?? "").trim().toLowerCase();
    const modeloFiltro = (modelo ?? "").trim().toLowerCase();

    const vehiculos = await vehiculoRepository.buscarVehiculosDisponibles(
      idsExcluidos && idsExcluidos.length > 0 ? idsExcluidos : undefined,
    );

    const vehiculosFiltrados = vehiculos.filter((vehiculo) => {
      const precio = precioEnCentavos(vehiculo.precioDiario, "precioDiario");

      return (
        (tipoVehiculo === undefined ||
          tipoVehiculo === "" ||
          vehiculo.tipoVehiculo === tipoVehiculo) &&
        vehiculo.marca.toLowerCase().includes(marcaFiltro) &&
        vehiculo.modelo.toLowerCase().includes(modeloFiltro) &&
        (precioMinCentavos === undefined || precio >= precioMinCentavos) &&
        (precioMaxCentavos === undefined || precio <= precioMaxCentavos)
      );
    });

    callback(null, { vehiculos: vehiculosFiltrados });
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: error.message,
      });
    }

    console.error(
      "[VehicleService] Error al buscar vehículos disponibles:",
      error,
    );
    callback({
      code: grpc.status.INTERNAL,
      message: "Error interno al buscar vehículos disponibles",
    });
  }
};

interface ConsultarSolicitudExternaRequest {
    vehiculoExternoId: string;
    clienteId: string;
}

interface SolicitudesExternasClienteRequest {
    clienteId: string;
}

// Los campos opcionales se omiten mientras no tienen resultado.
// No enviamos el documento en la respuesta.
type SolicitudExternaGrpcResponse = Omit<
    SolicitudExterna,
    "documento" | "resultadoPatente" | "resultadoTitularidad" | "vehiculoId"
> & {
    resultadoPatente?: string;
    resultadoTitularidad?: string;
    vehiculoId?: string;
};

function convertirSolicitudGrpc(
    solicitud: SolicitudExterna,
): SolicitudExternaGrpcResponse {
    return {
        vehiculoExternoId: solicitud.vehiculoExternoId,
        clienteId: solicitud.clienteId,
        patente: solicitud.patente,
        marca: solicitud.marca,
        modelo: solicitud.modelo,
        anio: solicitud.anio,
        color: solicitud.color,
        tipoVehiculo: solicitud.tipoVehiculo,
        precioDiario: solicitud.precioDiario,
        estado: solicitud.estado,
        ...(solicitud.resultadoPatente !== null
            ? { resultadoPatente: solicitud.resultadoPatente }
            : {}),
        ...(solicitud.resultadoTitularidad !== null
            ? { resultadoTitularidad: solicitud.resultadoTitularidad }
            : {}),
        ...(solicitud.vehiculoId !== null
            ? { vehiculoId: solicitud.vehiculoId }
            : {}),
    };
}

const crearSolicitudExterna: grpc.handleUnaryCall<
    CrearSolicitudExterna,
    SolicitudExternaGrpcResponse
> = async (call, callback) => {
    try {
        const entrada = call.request;

        const datos: CrearSolicitudExterna = {
            clienteId: entrada.clienteId ?? "",
            documento: (entrada.documento ?? "").replace(/[.\s-]/g, ""),
            patente: (entrada.patente ?? "").trim().toUpperCase(),
            marca: (entrada.marca ?? "").trim(),
            modelo: (entrada.modelo ?? "").trim(),
            anio: entrada.anio,
            color: (entrada.color ?? "").trim(),
            tipoVehiculo: (entrada.tipoVehiculo ?? "").trim(),
            precioDiario: (entrada.precioDiario ?? "").trim(),
        };

        if (!validarId(datos.clienteId)) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: "El ID del cliente debe ser un entero positivo válido",
            });
            return;
        }

        if (!datos.documento || datos.documento.length > 20) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: "El documento es obligatorio y admite hasta 20 caracteres",
            });
            return;
        }

        const errorValidacion = validarNuevoVehiculo(datos);

        if (errorValidacion) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: errorValidacion,
            });
            return;
        }

        const solicitud =
            await externosRepository.crearSolicitudExterna(datos);

        callback(null, convertirSolicitudGrpc(solicitud));
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ER_DUP_ENTRY"
        ) {
            callback({
                code: grpc.status.ALREADY_EXISTS,
                message: "Ya existe una solicitud para esa patente",
            });
            return;
        }

        console.error(
            "[VehicleService] Error al crear solicitud externa:",
            error,
        );

        callback({
            code: grpc.status.INTERNAL,
            message: "Error interno al crear la solicitud externa",
        });
    }
};

const consultarSolicitudExterna: grpc.handleUnaryCall<
    ConsultarSolicitudExternaRequest,
    SolicitudExternaGrpcResponse
> = async (call, callback) => {
    try {
        const { vehiculoExternoId, clienteId } = call.request;

        if (
            !validarId(vehiculoExternoId ?? "") ||
            !validarId(clienteId ?? "")
        ) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: "Los IDs deben ser enteros positivos válidos",
            });
            return;
        }

        const solicitud =
            await externosRepository.consultarSolicitudExterna(
                vehiculoExternoId,
            );

        // No revelamos solicitudes pertenecientes a otro cliente.
        if (!solicitud || solicitud.clienteId !== clienteId) {
            callback({
                code: grpc.status.NOT_FOUND,
                message: "Solicitud no encontrada",
            });
            return;
        }

        callback(null, convertirSolicitudGrpc(solicitud));
    } catch (error) {
        console.error(
            "[VehicleService] Error al consultar solicitud externa:",
            error,
        );

        callback({
            code: grpc.status.INTERNAL,
            message: "Error interno al consultar la solicitud externa",
        });
    }
};

const consultarSolicitudesExternasPorCliente: grpc.handleUnaryCall<
    SolicitudesExternasClienteRequest,
    { solicitudes: SolicitudExternaGrpcResponse[] }
> = async (call, callback) => {
    try {
        const { clienteId } = call.request;

        if (!validarId(clienteId ?? "")) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: "El ID del cliente debe ser un entero positivo válido",
            });
            return;
        }

        const solicitudes =
            await externosRepository.consultarSolicitudesPorCliente(clienteId);

        callback(null, {
            solicitudes: solicitudes.map(convertirSolicitudGrpc),
        });
    } catch (error) {
        console.error(
            "[VehicleService] Error al listar solicitudes externas:",
            error,
        );

        callback({
            code: grpc.status.INTERNAL,
            message: "Error interno al listar solicitudes externas",
        });
    }
};


export const handlers = {
    ConsultarVehiculos: consultarVehiculos,
    ConsultarVehiculo: consultarVehiculo,
    CrearVehiculo: crearVehiculo,
    ModificarVehiculo: modificarVehiculo,
    DarDeBajaVehiculo: darDeBajaVehiculo,
    ActualizarEstado: actualizarEstado,
    BuscarVehiculosDisponibles: buscarVehiculosDisponibles,

    CrearSolicitudExterna: crearSolicitudExterna,
    ConsultarSolicitudExterna: consultarSolicitudExterna,
    ConsultarSolicitudesExternasPorCliente:
    consultarSolicitudesExternasPorCliente,
};
