import { pool } from './db.js';
import { ClienteResponse } from './types.js';

interface ClienteRow {
  id: number;
  email: string;
  activo: Buffer;
  documento: string;
  nombre: string;
  apellido: string;
  telefono: string;
  fechaNacimiento: Date | string | null;
}

function mapRowToClienteResponse(row: ClienteRow): ClienteResponse {
  let fechaStr = '';
  if (row.fechaNacimiento) {
    if (typeof row.fechaNacimiento === 'string') {
      fechaStr = row.fechaNacimiento;
    } else {
      fechaStr = row.fechaNacimiento.toISOString().split('T')[0] ?? '';
    }
  }

  return {
    id: row.id,
    email: row.email,
    activo: row.activo[0] === 1,
    documento: row.documento,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono || '',
    fechaNacimiento: fechaStr,
  };
}

export async function consultarClientes(soloActivos: boolean): Promise<ClienteResponse[]> {
  let query = `
    SELECT u.id, u.email, u.activo, c.documento, c.nombre, c.apellido,
           c.telefono, c.fecha_nacimiento as fechaNacimiento
    FROM usuario u
    JOIN cliente c ON c.usuario_id = u.id
    WHERE u.rol = 'CLIENTE'
  `;
  const params: any[] = [];

  if (soloActivos) {
    query += ` AND u.activo = ?`;
    params.push(true);
  }

  const [rows] = await pool.query(query, params);
  const clientes = rows as ClienteRow[];
  
  return clientes.map(mapRowToClienteResponse);
}

export async function consultarCliente(id: number): Promise<ClienteResponse | null> {
  const query = `
    SELECT u.id, u.email, u.activo, c.documento, c.nombre, c.apellido,
           c.telefono, c.fecha_nacimiento as fechaNacimiento
    FROM usuario u
    JOIN cliente c ON c.usuario_id = u.id
    WHERE u.rol = 'CLIENTE' AND u.id = ?
  `;
  
  const [rows] = await pool.query(query, [id]);
  const clientes = rows as ClienteRow[];

  if (clientes.length === 0) {
    return null;
  }
  
  return mapRowToClienteResponse(clientes[0]!);
}

export async function verificarExistencia(id: number): Promise<boolean> {
  const query = `
    SELECT 1
    FROM usuario u
    JOIN cliente c ON c.usuario_id = u.id
    WHERE u.rol = 'CLIENTE' AND u.id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  const result = rows as any[];
  
  return result.length > 0;
}

export async function verificarActivo(id: number): Promise<{ existe: boolean; activo: boolean }> {
  const query = `
    SELECT u.activo
    FROM usuario u
    JOIN cliente c ON c.usuario_id = u.id
    WHERE u.rol = 'CLIENTE' AND u.id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  const result = rows as ClienteRow[];
  
  if (result.length === 0) {
    return { existe: false, activo: false };
  }
  
  return { existe: true, activo: result[0]!.activo[0] === 1 };
}
