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

// Consultar disponibilidad

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

//Historial alquileres

export interface Vehiculo {
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  tipo: Tipo;
}

export interface HistorialAlquileres {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  cantDias: number;
  importeTotal: number;
  estado: string;
  vehiculo: Vehiculo;
}

export interface HistorialAlquileresData {
  historialAlquileres: HistorialAlquileres[];
}

// Mis reservas

export interface ClienteReserva {
  nombre: string;
  apellido: string;
  documento: string;
}

export interface VehiculoReserva {
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  tipo: Tipo;
}

export interface Reserva {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  precioDiario: number;
  importeTotal: number;
  estado: string;
  cliente: ClienteReserva;
  vehiculo: VehiculoReserva;
}

export interface ConsultarReservasData {
  consultarReservas: Reserva[];
}

export interface VehiculoRequest {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  tipoVehiculo: Tipo;
  precioDiario: number;
}

// Para el update no se manda patente: es inmutable, el server la ignora
// si llega, pero mejor ni tentarlo.
export type VehiculoUpdateRequest = Omit<VehiculoRequest, "patente">;

export interface VehiculoResponse {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  tipoVehiculo: Tipo;
  precioDiario: number;
  estado: EstadoVehiculo;
  activo: boolean;
}


