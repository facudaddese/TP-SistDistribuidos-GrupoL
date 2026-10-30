export interface VerificacionSolicitadaEvent {
  vehiculoId: number;
  patente: string;
  marca: string;
  modelo: string;
  fechaSolicitud: string;
}

export interface VerificacionResultadoEvent {
  vehiculoId: number;
  patente: string;
  resultado: "VALIDADO" | "ROBADO";
  motivo?: string;
  fechaVerificacion: string;
}
