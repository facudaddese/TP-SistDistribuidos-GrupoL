import rabbitMQ from "../rabbitmq.config";
import { pool } from "../db";
import { verificarTitularidad } from "./registroTitularidad";
import {
    EXTERNOS_ROUTING_KEYS,
    type VehiculoExternoRegistradoEvent,
    type ValidacionTitularidadEvent,
} from "./types";

function esRegistroValido(
    valor: unknown,
): valor is VehiculoExternoRegistradoEvent {
    if (typeof valor !== "object" || valor === null) {
        return false;
    }

    const evento = valor as Record<string, unknown>;

    return (
        typeof evento.vehiculoExternoId === "string" &&
        /^[1-9]\d*$/.test(evento.vehiculoExternoId) &&
        typeof evento.clienteId === "string" &&
        /^[1-9]\d*$/.test(evento.clienteId) &&
        typeof evento.patente === "string" &&
        evento.patente.trim().length > 0 &&
        typeof evento.documento === "string" &&
        evento.documento.trim().length > 0
    );
}

export async function iniciarWorkerTitularidad(): Promise<void> {
    await rabbitMQ.consume<unknown>(
        "q.externos.validador-titularidad",
        EXTERNOS_ROUTING_KEYS.registrado,
        async (evento, ack, nack) => {
            if (!esRegistroValido(evento)) {
                console.error(
                    "[Titularidad] Evento inválido; se descarta",
                );

                nack();
                return;
            }

            const esTitular = verificarTitularidad(
                evento.patente,
                evento.documento,
            );

            const resultado: ValidacionTitularidadEvent = {
                vehiculoExternoId: evento.vehiculoExternoId,
                patente: evento.patente,
                clienteId: evento.clienteId,
                documento: evento.documento,
                resultado: esTitular ? "VALIDADO" : "RECHAZADO",
            };

            try {
                // La clave única evita generar dos respuestas
                // si RabbitMQ entrega nuevamente el mismo registro.
                await pool.execute(
                    `INSERT INTO externos_outbox (
                        clave,
                        routing_key,
                        payload
                    ) VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE clave = clave`,
                    [
                        `externo:${evento.vehiculoExternoId}:titularidad`,
                        EXTERNOS_ROUTING_KEYS.titularidad,
                        JSON.stringify(resultado),
                    ],
                );
            } catch (error) {
                console.error(
                    "[Titularidad] No se pudo guardar el resultado:",
                    error,
                );

                // Relanzamos para que el wrapper registre el error.
                // El reencolado se configura en el paso siguiente.
                throw error;
            }

            // Confirmamos el mensaje después de guardar la respuesta.
            ack();

            console.log(
                `[Titularidad] Solicitud ${evento.vehiculoExternoId}: ` +
                resultado.resultado,
            );
        },
    );
}
