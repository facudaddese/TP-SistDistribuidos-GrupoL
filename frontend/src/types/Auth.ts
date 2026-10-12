export type Rol = "ADMINISTRADOR" | "CLIENTE";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  id: number;
  email: string;
  rol: Rol;
  nombreCompleto: string;
}

export interface Usuario {
  id: number;
  email: string;
  rol: Rol;
  nombreCompleto: string;
  activo: boolean;
}
