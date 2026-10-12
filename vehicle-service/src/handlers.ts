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
    ConsultarDisponibilidadRequest,
} from "./types";

import {
    consultarDisponibilidad as buscarDisponibilidad,
    ErrorValidacion,
} from "./disponibilidadService";

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

function validarNuevoVehiculo(
    datos: CrearVehiculoRequest,
): string | null {
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
    const centavos =
        BigInt(entero!) * 100n + BigInt(decimal.padEnd(2, "0"));

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

const consultarDisponibilidad: grpc.handleUnaryCall<
    ConsultarDisponibilidadRequest,
    ListaVehiculosResponse
> = async (call, callback) => {
    try {
        const vehiculos = await buscarDisponibilidad(call.request);

        callback(null, { vehiculos });
    } catch (error) {
        if (error instanceof ErrorValidacion) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: error.message,
            });
            return;
        }

        console.error("[VehicleService] Error de disponibilidad:", error);

        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (
                error.code === grpc.status.UNAVAILABLE ||
                error.code === grpc.status.DEADLINE_EXCEEDED
            )
        ) {
            callback({
                code: grpc.status.UNAVAILABLE,
                message: "No se pudo consultar Rental Service",
            });
            return;
        }

        callback({
            code: grpc.status.INTERNAL,
            message: "Error interno al consultar disponibilidad",
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
    ConsultarDisponibilidad: consultarDisponibilidad,
};
