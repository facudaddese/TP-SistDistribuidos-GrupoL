import type { CrearVehiculoRequest } from "../types";

export type EstadoIncorporacion =
    | "PENDIENTE"
    | "APROBADA"
    | "RECHAZADA"
    | "INCORPORADA";

export type ResultadoValidacion = "VALIDADO" | "RECHAZADO";

// Datos necesarios para solicitar la incorporación.
export interface CrearSolicitudExterna extends CrearVehiculoRequest {
    clienteId: string;
    documento: string;
}

// Solicitud almacenada antes de incorporar el vehículo a la flota.
export interface SolicitudExterna extends CrearSolicitudExterna {
    vehiculoExternoId: string;
    estado: EstadoIncorporacion;
    resultadoPatente: ResultadoValidacion | null;
    resultadoTitularidad: ResultadoValidacion | null;
    vehiculoId: string | null;
}

// Mensaje que reciben los dos validadores.
export interface VehiculoExternoRegistradoEvent {
    vehiculoExternoId: string;
    clienteId: string;
    patente: string;
    documento: string;
}

// Respuesta del servicio que verifica la patente.
export interface ValidacionPatenteEvent {
    vehiculoExternoId: string;
    patente: string;
    resultado: ResultadoValidacion;
}

// Respuesta del servicio que verifica la titularidad.
export interface ValidacionTitularidadEvent {
    vehiculoExternoId: string;
    patente: string;
    clienteId: string;
    documento: string;
    resultado: ResultadoValidacion;
}

// Mensaje que habilita el alta definitiva en la flota.
export interface ValidacionCompletadaEvent {
    vehiculoExternoId: string;
}

export const EXTERNOS_EXCHANGE = "rentar.topic.exchange";

export const EXTERNOS_ROUTING_KEYS = {
    registrado: "vehiculos.externos.registrados",
    patente: "vehiculos.externos.validacion.patente",
    titularidad: "vehiculos.externos.validacion.titularidad",
    completada: "vehiculos.externos.validacion.completada",
} as const;
