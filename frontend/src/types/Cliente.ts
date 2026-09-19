export interface ClienteRequest {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  fechaNacimiento: string; 
}

// En edición no se manda password (eso sería un flujo aparte de "cambiar clave").
export type ClienteUpdateRequest = Omit<ClienteRequest, "password">;

export interface ClienteResponse {
  id: number;
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  activo: boolean;
}
