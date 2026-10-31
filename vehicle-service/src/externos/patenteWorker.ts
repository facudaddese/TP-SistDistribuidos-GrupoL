import rabbitMQ from "../rabbitmq.config";
import { pool } from "../db";
import {
    EXTERNOS_ROUTING_KEYS,
    type VehiculoExternoRegistradoEvent,
    type ValidacionPatenteEvent,
} from "./types";

// Registro policial simulado.
// Las patentes incluidas tienen una denuncia activa.
const PATENTES_ROBADAS = new Set([
    "AF999ZZ",
    "AG888YY",
]);

function esEventoValido(
    valor: unknown,
): valor is VehiculoExternoRegistradoEvent {
    if (typeof valor !== "object" || valor === null) {
        return false;
    }

    const evento = valor as Record<string, unknown>;

    return (
        typeof evento.vehiculoExternoId === "string" &&
        /^[1-9]\d*$/.test(evento.vehiculoExternoId) &&
        typeof evento.patente === "string" &&
        evento.patente.trim().length > 0
    );
}

export async function iniciarWorkerPatenteExternos(): Promise<void> {
    for (let intento = 1; intento <= 10; intento++) {
        try {
            await rabbitMQ.consume<unknown>(
                "q.externos.validador-patente",
                EXTERNOS_ROUTING_KEYS.registrado,
                async (evento, ack, nack) => {
                    if (!esEventoValido(evento)) {
                        console.error(
                            "[Policial Externos] Evento inválido",
                        );
                        nack();
                        return;
                    }

                    const patente = evento.patente.trim().toUpperCase();
                    const esRobado = PATENTES_ROBADAS.has(patente);

                    const resultado: ValidacionPatenteEvent = {
                        vehiculoExternoId: evento.vehiculoExternoId,
                        patente,
                        resultado: esRobado ? "RECHAZADO" : "VALIDADO",
                    };

                    await pool.execute(
                        `INSERT INTO externos_outbox (
                            clave,
                            routing_key,
                            payload
                        ) VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE clave = clave`,
                        [
                            `externo:${evento.vehiculoExternoId}:patente`,
                            EXTERNOS_ROUTING_KEYS.patente,
                            JSON.stringify(resultado),
                        ],
                    );

                    ack();

                    console.log(
                        `[Policial Externos] Solicitud ` +
                        `${evento.vehiculoExternoId}, patente ${patente}: ` +
                        resultado.resultado,
                    );
                },
            );

            return;
        } catch (error) {
            console.error(
                `[Policial Externos] Intento ${intento}/10 fallido:`,
                error instanceof Error ? error.message : error,
            );

            if (intento === 10) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
}
