export type Tipo = "SEDAN" | "SUV" | "PICKUP" | "COUPE" | "HATCHBACK";

export type EstadoVehiculo = "DISPONIBLE" | "RESERVADO" | "EN_ALQUILER";

export interface Vehiculo {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  tipo: Tipo;
  precioDiario: number;
  estadoVehiculo: EstadoVehiculo;
  activo: boolean;
}

export interface Disponibilidad {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  color: string;
  tipo: Tipo;
  precioDiario: number;
}

export interface ConsultarDisponibilidadData {
  consultarDisponibilidad: Disponibilidad[];
}
