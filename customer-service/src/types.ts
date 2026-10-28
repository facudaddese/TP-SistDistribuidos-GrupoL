export interface ConsultarClientesRequest {
  soloActivos: boolean;
}

export interface ConsultarClienteRequest {
  id: number;
}

export interface ConsultarClientePorDocumentoRequest {
  documento: string;
}

export interface VerificarClienteRequest {
  id: number;
}

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

export interface ListaClientesResponse {
  clientes: ClienteResponse[];
}

export interface ExistenciaResponse {
  existe: boolean;
}

export interface ActivoResponse {
  existe: boolean;
  activo: boolean;
}

export interface CrearClienteRequest {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  fechaNacimiento: string;
}

export interface ModificarClienteRequest {
  id: number;
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
}

export interface DarDeBajaClienteRequest {
  id: number;
}
