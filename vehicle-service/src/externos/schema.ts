import { pool } from "../db";

export async function inicializarTablasExternos(): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS vehiculo_externo (
            id BIGINT NOT NULL AUTO_INCREMENT,
            cliente_id BIGINT NOT NULL,
            documento VARCHAR(20) NOT NULL,
            patente VARCHAR(10) NOT NULL,
            datos JSON NOT NULL,
            estado ENUM(
                'PENDIENTE',
                'APROBADA',
                'RECHAZADA',
                'INCORPORADA'
            ) NOT NULL DEFAULT 'PENDIENTE',
            resultado_patente ENUM(
                'VALIDADO',
                'RECHAZADO'
            ) NULL,
            resultado_titularidad ENUM(
                'VALIDADO',
                'RECHAZADO'
            ) NULL,
            vehiculo_id BIGINT NULL,
            creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            actualizado_en TIMESTAMP NOT NULL
                DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

            PRIMARY KEY (id),
            UNIQUE KEY uq_externo_patente (patente),
            UNIQUE KEY uq_externo_vehiculo (vehiculo_id)
        ) ENGINE=InnoDB
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS externos_outbox (
            id BIGINT NOT NULL AUTO_INCREMENT,
            clave VARCHAR(160) NOT NULL,
            routing_key VARCHAR(100) NOT NULL,
            payload JSON NOT NULL,
            publicado BOOLEAN NOT NULL DEFAULT FALSE,
            creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (id),
            UNIQUE KEY uq_externos_outbox_clave (clave),
            KEY idx_externos_outbox_publicado (publicado, id)
        ) ENGINE=InnoDB
    `);
}
