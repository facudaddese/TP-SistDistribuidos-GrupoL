export interface ReservaConfirmadaEvent {
  reservaId: number;
  vehiculoId: number;
  clienteId: number;
  fechaReserva: string;
}

export interface MantenimientoResultadoEvent {
  reservaId: number;
  vehiculoId: number;
  resultado: "REALIZADO" | "NO_REALIZADO";
  motivo?: string;
  fechaProcesamiento: string;
}
