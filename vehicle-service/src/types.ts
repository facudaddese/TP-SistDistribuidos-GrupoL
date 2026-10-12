export const TIPOS_VEHICULO = [
    "SEDAN",
    "SUV",
    "PICKUP",
    "COUPE",
    "HATCHBACK",
] as const;

export type TipoVehiculo = (typeof TIPOS_VEHICULO)[number];

export const ESTADOS_VEHICULO = [
    "DISPONIBLE",
    "RESERVADO",
    "EN_ALQUILER",
] as const;

export type EstadoVehiculo = (typeof ESTADOS_VEHICULO)[number];

export interface VehiculoResponse {
    id: string;
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string;
    tipoVehiculo: TipoVehiculo;
    precioDiario: string;
    estado: EstadoVehiculo;
    activo: boolean;
}

export interface ConsultarVehiculosRequest {
    soloActivos: boolean;
}

export interface VehiculoIdRequest {
    id: string;
}

export interface ListaVehiculosResponse {
    vehiculos: VehiculoResponse[];
}

export interface CrearVehiculoRequest {
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string;
    tipoVehiculo: string;
    precioDiario: string;
}

export interface ModificarVehiculoRequest
    extends Omit<CrearVehiculoRequest, "patente"> {
    id: string;
}

export interface ActualizarEstadoRequest {
    id: string;
    estado: string;
}
export interface ConsultarDisponibilidadRequest {
    fechaInicio: string;
    fechaFin: string;
    tipoVehiculo?: string;
    marca?: string;
    modelo?: string;
    precioMin?: string;
    precioMax?: string;
}
