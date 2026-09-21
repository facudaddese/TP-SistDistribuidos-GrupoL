export type EstadoReserva = "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

export interface ReservaRequest {
  clienteId: number;
  vehiculoId: number;
  fechaHoraInicio: string; // ISO
  fechaHoraFin: string; // ISO
}

export interface ReservaResponse {
  id: number;
  cliente: { id: number; nombre: string; apellido: string };
  vehiculo: { id: number; patente: string; marca: string; modelo: string };
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioDiarioAplicado: number;
  importeTotal: number;
  estado: EstadoReserva;
}


