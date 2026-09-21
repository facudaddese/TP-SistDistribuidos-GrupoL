import { httpClient } from "./httpClient";
import type {
  VehiculoRequest,
  VehiculoUpdateRequest,
  VehiculoResponse,
} from "../types/Vehiculo";

export const vehiculosApi = {
  listar: () => httpClient.get<VehiculoResponse[]>("/vehiculos"),

  obtener: (id: number) => httpClient.get<VehiculoResponse>(`/vehiculos/${id}`),

  crear: (data: VehiculoRequest) =>
    httpClient.post<VehiculoResponse>("/vehiculos", data),

  actualizar: (id: number, data: VehiculoUpdateRequest) =>
    httpClient.put<VehiculoResponse>(`/vehiculos/${id}`, data),

  darDeBaja: (id: number) => httpClient.delete<void>(`/vehiculos/${id}`),
};
