import { httpClient } from "./httpClient";
import type { ReservaRequest, ReservaResponse } from "../types/Reserva";

export const reservasApi = {
  crear: (data: ReservaRequest) =>
    httpClient.post<ReservaResponse>("/reservas", data),

  cancelar: (id: number) =>
    httpClient.patch<ReservaResponse>(`/reservas/${id}/cancelar`, undefined),
};
