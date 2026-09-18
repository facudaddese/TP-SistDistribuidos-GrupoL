import { httpClient } from "./httpClient";
import type {
  ClienteRequest,
  ClienteUpdateRequest,
  ClienteResponse,
} from "../types/Cliente";

export const clientesApi = {
  listar: () => httpClient.get<ClienteResponse[]>("/clientes"),

  obtener: (id: number) => httpClient.get<ClienteResponse>(`/clientes/${id}`),

  crear: (data: ClienteRequest) =>
    httpClient.post<ClienteResponse>("/clientes", data),

  actualizar: (id: number, data: ClienteUpdateRequest) =>
    httpClient.put<ClienteResponse>(`/clientes/${id}`, data),

  darDeBaja: (id: number) => httpClient.delete<void>(`/clientes/${id}`),
};
