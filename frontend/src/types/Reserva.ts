export type EstadoReserva = "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

export interface ReservaRequest {
  clienteId: number;
  vehiculoId: number;
  fechaHoraInicio: string; // ISO
  fechaHoraFin: string; // ISO
}

export interface ReservaResponse {
    id: number;
    clienteId: number;
    vehiculoId: number;
    fechaHoraInicio: string;
    fechaHoraFin: string;
    precioDiarioAplicado: number;
    importeTotal: number;
    estado: EstadoReserva;
    fechaCreacion?: string | null;
}


