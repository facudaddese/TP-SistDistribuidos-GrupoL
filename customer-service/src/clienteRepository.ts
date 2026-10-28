import type { ResultSetHeader } from 'mysql2';
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

export async function consultarClientePorDocumento(documento: string): Promise<ClienteResponse | null> {
  const query = `
    SELECT u.id, u.email, u.activo, c.documento, c.nombre, c.apellido,
           c.telefono, c.fecha_nacimiento as fechaNacimiento
    FROM usuario u
    JOIN cliente c ON c.usuario_id = u.id
    WHERE u.rol = 'CLIENTE' AND c.documento = ?
  `;
  
  const [rows] = await pool.query(query, [documento]);
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

export class ClienteDuplicateError extends Error {
  constructor(message: string = 'Ya existe un cliente con esos datos') {
    super(message);
    this.name = 'ClienteDuplicateError';
  }
}

export class ClienteYaInactivoError extends Error {
  constructor(message: string = 'El cliente ya se encuentra dado de baja') {
    super(message);
    this.name = 'ClienteYaInactivoError';
  }
}

function isDuplicateKeyError(err: any): boolean {
  return Boolean(err && (err.errno === 1062 || err.code === 'ER_DUP_ENTRY'));
}

export interface CrearClienteDatos {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  passwordHash: string;
  telefono?: string | null;
  fechaNacimiento?: string | null;
}

export async function crearCliente(datos: CrearClienteDatos): Promise<ClienteResponse> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO usuario (email, password, rol, activo) VALUES (?, ?, 'CLIENTE', 1)`,
      [datos.email, datos.passwordHash]
    );

    const usuarioId = userResult.insertId;

    await connection.query(
      `INSERT INTO cliente (usuario_id, documento, nombre, apellido, telefono, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        datos.documento,
        datos.nombre,
        datos.apellido,
        datos.telefono || null,
        datos.fechaNacimiento || null,
      ]
    );

    await connection.commit();

    const nuevoCliente = await consultarCliente(usuarioId);
    if (!nuevoCliente) {
      throw new Error('Error al recuperar el cliente recién creado');
    }
    return nuevoCliente;
  } catch (error) {
    await connection.rollback();
    if (isDuplicateKeyError(error)) {
      throw new ClienteDuplicateError('Ya existe un cliente con esos datos');
    }
    throw error;
  } finally {
    connection.release();
  }
}

export interface ModificarClienteDatos {
  id: number;
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  fechaNacimiento?: string | null;
}

export async function modificarCliente(datos: ModificarClienteDatos): Promise<ClienteResponse | null> {
  const existente = await consultarCliente(datos.id);
  if (!existente) {
    return null;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE usuario SET email = ? WHERE id = ? AND rol = 'CLIENTE'`,
      [datos.email, datos.id]
    );

    await connection.query(
      `UPDATE cliente
       SET documento = ?, nombre = ?, apellido = ?, telefono = ?, fecha_nacimiento = ?
       WHERE usuario_id = ?`,
      [
        datos.documento,
        datos.nombre,
        datos.apellido,
        datos.telefono || null,
        datos.fechaNacimiento || null,
        datos.id,
      ]
    );

    await connection.commit();

    return await consultarCliente(datos.id);
  } catch (error) {
    await connection.rollback();
    if (isDuplicateKeyError(error)) {
      throw new ClienteDuplicateError('Ya existe un cliente con esos datos');
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function darDeBajaCliente(id: number): Promise<ClienteResponse | null> {
  const existente = await consultarCliente(id);
  if (!existente) {
    return null;
  }

  if (!existente.activo) {
    throw new ClienteYaInactivoError('El cliente ya se encuentra dado de baja');
  }

  await pool.query(
    `UPDATE usuario SET activo = 0 WHERE id = ? AND rol = 'CLIENTE'`,
    [id]
  );

  return await consultarCliente(id);
}

