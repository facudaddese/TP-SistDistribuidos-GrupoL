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
