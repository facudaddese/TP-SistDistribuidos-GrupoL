import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import type {
    CrearVehiculoRequest,
    EstadoVehiculo,
    TipoVehiculo,
    VehiculoResponse,
    ModificarVehiculoRequest,
} from "./types";

interface VehiculoRow extends RowDataPacket {
    id: string | number;
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string | null;
    tipo_vehiculo: TipoVehiculo;
    precio_diario: string;
    estado: EstadoVehiculo;
    activo: Buffer | number | boolean;
}

// MySQL puede devolver BIT como Buffer y BOOLEAN como número.
function convertirActivo(valor: Buffer | number | boolean): boolean {
    if (Buffer.isBuffer(valor)) {
        return valor.some((byte) => byte !== 0);
    }

    return valor === true || valor === 1;
}

function convertirVehiculo(row: VehiculoRow): VehiculoResponse {
    return {
        id: String(row.id),
        patente: row.patente,
        marca: row.marca,
        modelo: row.modelo,
        anio: row.anio,
        color: row.color ?? "",
        tipoVehiculo: row.tipo_vehiculo,
        precioDiario: String(row.precio_diario),
        estado: row.estado,
        activo: convertirActivo(row.activo),
    };
}

const COLUMNAS = `
  id,
  patente,
  marca,
  modelo,
  anio,
  color,
  tipo_vehiculo,
  precio_diario,
  estado,
  activo
`;

export async function consultarVehiculos(
    soloActivos: boolean,
): Promise<VehiculoResponse[]> {
    const condicion = soloActivos ? "WHERE activo = 1" : "";

    const [rows] = await pool.execute<VehiculoRow[]>(
        `SELECT ${COLUMNAS}
     FROM vehiculo
     ${condicion}
     ORDER BY id`,
    );

    return rows.map(convertirVehiculo);
}

export async function consultarVehiculo(
    id: string,
): Promise<VehiculoResponse | null> {
    const [rows] = await pool.execute<VehiculoRow[]>(
        `SELECT ${COLUMNAS}
     FROM vehiculo
     WHERE id = ?`,
        [id],
    );

    const vehiculo = rows[0];

    return vehiculo ? convertirVehiculo(vehiculo) : null;
}
export async function crearVehiculo(
    datos: CrearVehiculoRequest,
): Promise<VehiculoResponse> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO vehiculo (
        patente,
        marca,
        modelo,
        anio,
        color,
        tipo_vehiculo,
        precio_diario,
        estado,
        activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'DISPONIBLE', 1)`,
            [
                datos.patente,
                datos.marca,
                datos.modelo,
                datos.anio,
                datos.color || null,
                datos.tipoVehiculo,
                datos.precioDiario,
            ],
        );

        // Se consulta en la misma conexión para obtener el ID insertado.
        const [rows] = await connection.execute<VehiculoRow[]>(
            `SELECT ${COLUMNAS}
       FROM vehiculo
       WHERE id = LAST_INSERT_ID()`,
        );

        const row = rows[0];

        if (!row) {
            throw new Error("No se pudo recuperar el vehículo creado");
        }

        const vehiculo = convertirVehiculo(row);

        await connection.commit();

        return vehiculo;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function modificarVehiculo(
    datos: ModificarVehiculoRequest,
): Promise<VehiculoResponse | null> {
    await pool.execute(
        `UPDATE vehiculo
     SET marca = ?,
         modelo = ?,
         anio = ?,
         color = ?,
         tipo_vehiculo = ?,
         precio_diario = ?
     WHERE id = ?`,
        [
            datos.marca,
            datos.modelo,
            datos.anio,
            datos.color || null,
            datos.tipoVehiculo,
            datos.precioDiario,
            datos.id,
        ],
    );

    return consultarVehiculo(datos.id);
}

export async function darDeBajaVehiculo(
    id: string,
): Promise<VehiculoResponse | null> {
    await pool.execute(
        "UPDATE vehiculo SET activo = 0 WHERE id = ?",
        [id],
    );

    return consultarVehiculo(id);
}

export async function actualizarEstado(
    id: string,
    estado: EstadoVehiculo,
): Promise<VehiculoResponse | null> {
    await pool.execute(
        "UPDATE vehiculo SET estado = ? WHERE id = ?",
        [estado, id],
    );

    return consultarVehiculo(id);
}

export async function buscarVehiculosDisponibles(
    idsExcluidos?: string[],
): Promise<VehiculoResponse[]> {
    const params: string[] = [];
    let sql = `SELECT ${COLUMNAS} FROM vehiculo WHERE activo = 1`;

    if (idsExcluidos && idsExcluidos.length > 0) {
        const placeholders = idsExcluidos.map(() => "?").join(", ");
        sql += ` AND id NOT IN (${placeholders})`;
        params.push(...idsExcluidos);
    }

    sql += " ORDER BY id";

    const [rows] = await pool.execute<VehiculoRow[]>(sql, params);
    return rows.map(convertirVehiculo);
}

