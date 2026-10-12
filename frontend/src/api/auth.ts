import { httpClient } from "./httpClient";
import type { LoginRequest, LoginResponse, Usuario } from "../types/Auth";

export const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> => {
    return httpClient.post<LoginResponse>("/auth/login", credentials);
  },

  getUsuarioActual: (): Promise<Usuario> => {
    return httpClient.get<Usuario>("/auth/me");
  },
};
