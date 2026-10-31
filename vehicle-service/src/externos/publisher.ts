import amqp from "amqplib";
import type { RowDataPacket } from "mysql2";
import { pool } from "../db";
import {
    EXTERNOS_EXCHANGE,
    EXTERNOS_ROUTING_KEYS,
} from "./types";

interface EventoPendienteRow extends RowDataPacket {
    id: string;
    clave: string;
    routing_key: string;
    payload: unknown;
}

// Declaramos las colas antes de publicar para que los eventos
// tengan destino aunque los consumidores todavía no estén activos.
const COLAS_EXTERNOS = [
    {
        nombre: "q.externos.validador-patente",
        routingKey: EXTERNOS_ROUTING_KEYS.registrado,
    },
    {
        nombre: "q.externos.validador-titularidad",
        routingKey: EXTERNOS_ROUTING_KEYS.registrado,
    },
    {
        nombre: "q.rentar.externos-val-patente",
        routingKey: EXTERNOS_ROUTING_KEYS.patente,
    },
    {
        nombre: "q.rentar.externos-val-titularidad",
        routingKey: EXTERNOS_ROUTING_KEYS.titularidad,
    },
    {
        nombre: "q.rentar.externos-completada",
        routingKey: EXTERNOS_ROUTING_KEYS.completada,
    },
];

function obtenerRabbitUrl(): string {
    if (process.env.RABBITMQ_URL) {
        return process.env.RABBITMQ_URL;
    }

    const host = process.env.RABBITMQ_HOST ?? "localhost";
    const port = process.env.RABBITMQ_PORT ?? "5672";
    const user = encodeURIComponent(
        process.env.RABBITMQ_USER ?? "rentar_rabbit",
    );
    const password = encodeURIComponent(
        process.env.RABBITMQ_PASSWORD ?? "rentar_rabbit_pass",
    );

    return `amqp://${user}:${password}@${host}:${port}`;
}

async function publicarPendientes(): Promise<void> {
    const db = await pool.getConnection();

    let rabbit: Awaited<ReturnType<typeof amqp.connect>> | undefined;

    try {
        await db.beginTransaction();

        const [eventos] = await db.query<EventoPendienteRow[]>(
            `SELECT id, clave, routing_key, payload
             FROM externos_outbox
             WHERE publicado = FALSE
             ORDER BY id
             LIMIT 10
             FOR UPDATE SKIP LOCKED`,
        );

        if (eventos.length === 0) {
            await db.commit();
            return;
        }

        rabbit = await amqp.connect(
            obtenerRabbitUrl(),
            { timeout: 5000 },
        );

        rabbit.on("error", (error: Error) => {
            console.error(
                "[Externos] Error de conexión RabbitMQ:",
                error.message,
            );
        });

        const channel = await rabbit.createConfirmChannel();

        channel.on("error", (error: Error) => {
            console.error(
                "[Externos] Error de canal RabbitMQ:",
                error.message,
            );
        });

        await channel.assertExchange(
            EXTERNOS_EXCHANGE,
            "topic",
            { durable: true },
        );

        for (const cola of COLAS_EXTERNOS) {
            await channel.assertQueue(
                cola.nombre,
                { durable: true },
            );

            await channel.bindQueue(
                cola.nombre,
                EXTERNOS_EXCHANGE,
                cola.routingKey,
            );
        }

        for (const evento of eventos) {
            const payload =
                typeof evento.payload === "string"
                    ? evento.payload
                    : JSON.stringify(evento.payload);

            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(
                        new Error("RabbitMQ no confirmó el evento a tiempo"),
                    );
                }, 10000);

                try {
                    channel.publish(
                        EXTERNOS_EXCHANGE,
                        evento.routing_key,
                        Buffer.from(payload),
                        {
                            persistent: true,
                            contentType: "application/json",
                            messageId: evento.clave,
                        },
                        (error) => {
                            clearTimeout(timeout);

                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        },
                    );
                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });

            await db.execute(
                `UPDATE externos_outbox
                 SET publicado = TRUE
                 WHERE id = ?`,
                [evento.id],
            );
        }

        await db.commit();

        console.log(
            `[Externos] ${eventos.length} evento(s) publicados`,
        );
    } catch (error) {
        await db.rollback();
        throw error;
    } finally {
        try {
            if (rabbit) {
                await rabbit.close().catch(() => undefined);
            }
        } finally {
            db.release();
        }
    }
}

export function iniciarPublicadorExternos(): () => Promise<void> {
    let detenido = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ejecucion: Promise<void> = Promise.resolve();

    const ejecutar = async (): Promise<void> => {
        try {
            await publicarPendientes();
        } catch (error) {
            console.error(
                "[Externos] No se pudieron publicar los eventos; se reintentará:",
                error instanceof Error ? error.message : error,
            );
        } finally {
            if (!detenido) {
                timer = setTimeout(() => {
                    ejecucion = ejecutar();
                }, 3000);
            }
        }
    };

    ejecucion = ejecutar();

    return async () => {
        detenido = true;

        if (timer) {
            clearTimeout(timer);
        }

        await ejecucion;
    };
}
