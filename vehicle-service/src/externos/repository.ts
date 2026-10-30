import type { RowDataPacket } from "mysql2";
import { pool } from "../db";
import {
    EXTERNOS_ROUTING_KEYS,
    type CrearSolicitudExterna,
    type EstadoIncorporacion,
    type ResultadoValidacion,
    type SolicitudExterna,
    type VehiculoExternoRegistradoEvent,
} from "./types";

interface SolicitudRow extends RowDataPacket {
    id: string;
    cliente_id: string;
    documento: string;
    patente: string;
    datos: string | CrearSolicitudExterna;
    estado: EstadoIncorporacion;
    resultado_patente: ResultadoValidacion | null;
    resultado_titularidad: ResultadoValidacion | null;
    vehiculo_id: string | null;
}

function convertirSolicitud(row: SolicitudRow): SolicitudExterna {
    // mysql2 puede devolver JSON como objeto o como texto.
    const datos: CrearSolicitudExterna =
        typeof row.datos === "string"
            ? JSON.parse(row.datos)
            : row.datos;

    return {
        ...datos,
        vehiculoExternoId: String(row.id),
        clienteId: String(row.cliente_id),
        documento: row.documento,
        patente: row.patente,
        estado: row.estado,
        resultadoPatente: row.resultado_patente,
        resultadoTitularidad: row.resultado_titularidad,
        vehiculoId:
            row.vehiculo_id === null
                ? null
                : String(row.vehiculo_id),
    };
}

export async function crearSolicitudExterna(
    entrada: CrearSolicitudExterna,
): Promise<SolicitudExterna> {
    const datos: CrearSolicitudExterna = {
        ...entrada,
        patente: entrada.patente.trim().toUpperCase(),
        documento: entrada.documento.trim(),
    };

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO vehiculo_externo (
                cliente_id,
                documento,
                patente,
                datos
            ) VALUES (?, ?, ?, ?)`,
            [
                datos.clienteId,
                datos.documento,
                datos.patente,
                JSON.stringify(datos),
            ],
        );

        // Se consulta en la misma conexión para recuperar
        // el ID generado sin perder precisión con BIGINT.
        const [rows] = await connection.query<SolicitudRow[]>(
            `SELECT *
             FROM vehiculo_externo
             WHERE id = LAST_INSERT_ID()`,
        );

        const row = rows[0];

        if (!row) {
            throw new Error("No se pudo recuperar la solicitud creada");
        }

        const solicitud = convertirSolicitud(row);

        const evento: VehiculoExternoRegistradoEvent = {
            vehiculoExternoId: solicitud.vehiculoExternoId,
            clienteId: solicitud.clienteId,
            patente: solicitud.patente,
            documento: solicitud.documento,
        };

        await connection.execute(
            `INSERT INTO externos_outbox (
                clave,
                routing_key,
                payload
            ) VALUES (?, ?, ?)`,
            [
                `externo:${solicitud.vehiculoExternoId}:registrado`,
                EXTERNOS_ROUTING_KEYS.registrado,
                JSON.stringify(evento),
            ],
        );

        await connection.commit();

        return solicitud;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function consultarSolicitudExterna(
    vehiculoExternoId: string,
): Promise<SolicitudExterna | null> {
    const [rows] = await pool.execute<SolicitudRow[]>(
        `SELECT *
         FROM vehiculo_externo
         WHERE id = ?`,
        [vehiculoExternoId],
    );

    const row = rows[0];

    return row ? convertirSolicitud(row) : null;
}

export async function consultarSolicitudesPorCliente(
    clienteId: string,
): Promise<SolicitudExterna[]> {
    const [rows] = await pool.execute<SolicitudRow[]>(
        `SELECT *
         FROM vehiculo_externo
         WHERE cliente_id = ?
         ORDER BY id DESC`,
        [clienteId],
    );

    return rows.map(convertirSolicitud);
}

export async function registrarResultadoExterno(
    vehiculoExternoId: string,
    patente: string,
    tipo: "PATENTE" | "TITULARIDAD",
    resultado: ResultadoValidacion,
    identidad?: {
        clienteId: string;
        documento: string;
    },
): Promise<void> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Bloqueamos la solicitud mientras actualizamos su progreso.
        // Así dos resultados simultáneos no se pisan.
        const [rows] = await connection.execute<SolicitudRow[]>(
            `SELECT *
             FROM vehiculo_externo
             WHERE id = ?
             FOR UPDATE`,
            [vehiculoExternoId],
        );

        const row = rows[0];

        if (!row) {
            throw new Error(
                `No existe la solicitud externa ${vehiculoExternoId}`,
            );
        }

        const solicitud = convertirSolicitud(row);

        if (
            solicitud.patente.trim().toUpperCase() !==
            patente.trim().toUpperCase()
        ) {
            throw new Error("La patente no coincide con la solicitud");
        }

        if (tipo === "TITULARIDAD") {
            const normalizarDocumento = (valor: string): string =>
                valor.replace(/[.\s-]/g, "");

            if (
                !identidad ||
                identidad.clienteId !== solicitud.clienteId ||
                normalizarDocumento(identidad.documento) !==
                normalizarDocumento(solicitud.documento)
            ) {
                throw new Error(
                    "La identidad no coincide con la solicitud",
                );
            }
        }

        // Una solicitud finalizada no vuelve a cambiar de decisión.
        if (solicitud.estado !== "PENDIENTE") {
            await connection.commit();
            return;
        }

        const resultadoAnterior =
            tipo === "PATENTE"
                ? solicitud.resultadoPatente
                : solicitud.resultadoTitularidad;

        // Las entregas repetidas no deben modificar el resultado.
        if (resultadoAnterior !== null) {
            if (resultadoAnterior !== resultado) {
                throw new Error(
                    "Se recibió un resultado contradictorio",
                );
            }

            await connection.commit();
            return;
        }

        const resultadoPatente =
            tipo === "PATENTE"
                ? resultado
                : solicitud.resultadoPatente;

        const resultadoTitularidad =
            tipo === "TITULARIDAD"
                ? resultado
                : solicitud.resultadoTitularidad;

        let estado: EstadoIncorporacion = "PENDIENTE";

        if (
            resultadoPatente === "RECHAZADO" ||
            resultadoTitularidad === "RECHAZADO"
        ) {
            estado = "RECHAZADA";
        } else if (
            resultadoPatente === "VALIDADO" &&
            resultadoTitularidad === "VALIDADO"
        ) {
            estado = "APROBADA";
        }

        await connection.execute(
            `UPDATE vehiculo_externo
             SET resultado_patente = ?,
                 resultado_titularidad = ?,
                 estado = ?
             WHERE id = ?`,
            [
                resultadoPatente,
                resultadoTitularidad,
                estado,
                vehiculoExternoId,
            ],
        );

        if (estado === "APROBADA") {
            await connection.execute(
                `INSERT INTO externos_outbox (
                    clave,
                    routing_key,
                    payload
                ) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE clave = clave`,
                [
                    `externo:${vehiculoExternoId}:completada`,
                    EXTERNOS_ROUTING_KEYS.completada,
                    JSON.stringify({ vehiculoExternoId }),
                ],
            );
        }

        await connection.commit();

        console.log(
            `[Coordinador] Solicitud ${vehiculoExternoId}: ${estado}`,
        );
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function incorporarVehiculoExterno(
    vehiculoExternoId: string,
): Promise<string | null> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute<SolicitudRow[]>(
            `SELECT *
             FROM vehiculo_externo
             WHERE id = ?
                 FOR UPDATE`,
            [vehiculoExternoId],
        );

        const row = rows[0];

        if (!row) {
            throw new Error(
                `No existe la solicitud ${vehiculoExternoId}`,
            );
        }

        const solicitud = convertirSolicitud(row);

        // Un mensaje repetido no debe crear otro vehículo.
        if (solicitud.estado === "INCORPORADA") {
            if (!solicitud.vehiculoId) {
                throw new Error(
                    "Solicitud incorporada sin vehículo asociado",
                );
            }

            await connection.commit();
            return solicitud.vehiculoId;
        }

        if (
            solicitud.estado !== "APROBADA" ||
            solicitud.resultadoPatente !== "VALIDADO" ||
            solicitud.resultadoTitularidad !== "VALIDADO"
        ) {
            throw new Error(
                "La solicitud no tiene ambas validaciones aprobadas",
            );
        }

        await connection.execute(
            `INSERT INTO vehiculo (patente,
                                   marca,
                                   modelo,
                                   anio,
                                   color,
                                   tipo_vehiculo,
                                   precio_diario,
                                   estado,
                                   activo)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'DISPONIBLE', 1)`,
            [
                solicitud.patente,
                solicitud.marca,
                solicitud.modelo,
                solicitud.anio,
                solicitud.color || null,
                solicitud.tipoVehiculo,
                solicitud.precioDiario,
            ],
        );

        const [vehiculos] = await connection.query<RowDataPacket[]>(
            `SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id`,
        );

        const vehiculoId = String(vehiculos[0].id);

        await connection.execute(
            `UPDATE vehiculo_externo
             SET estado      = 'INCORPORADA',
                 vehiculo_id = ?
             WHERE id = ?`,
            [vehiculoId, vehiculoExternoId],
        );

        await connection.commit();

        console.log(
            `[Externos] Solicitud ${vehiculoExternoId}: ` +
            `INCORPORADA, vehículo ${vehiculoId} DISPONIBLE`,
        );

        return vehiculoId;
    } catch (error) {
        await connection.rollback();

        const esDuplicado =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ER_DUP_ENTRY";

        if (esDuplicado) {
            await connection.execute(
                `UPDATE vehiculo_externo
                 SET estado = 'RECHAZADA'
                 WHERE id = ?
                   AND estado = 'APROBADA'
                   AND vehiculo_id IS NULL`,
                [vehiculoExternoId],
            );

            console.error(
                `[Externos] Solicitud ${vehiculoExternoId} rechazada: ` +
                "la patente ya existe en la flota",
            );

            return null;
        }

        throw error;
    } finally {
        connection.release();
    }
}
