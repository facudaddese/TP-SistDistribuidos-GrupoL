import rabbitMQ from "../rabbitmq.config";
import { incorporarVehiculoExterno } from "./repository";
import { EXTERNOS_ROUTING_KEYS } from "./types";

function obtenerId(evento: unknown): string | null {
    if (typeof evento !== "object" || evento === null) {
        return null;
    }

    const valor = evento as Record<string, unknown>;
    const id = valor.vehiculoExternoId;

    return typeof id === "string" && /^[1-9]\d*$/.test(id)
        ? id
        : null;
}

export async function iniciarWorkerIncorporacion(): Promise<void> {
    for (let intento = 1; intento <= 10; intento++) {
        try {
            await rabbitMQ.consume<unknown>(
                "q.rentar.externos-completada",
                EXTERNOS_ROUTING_KEYS.completada,
                async (evento, ack, nack) => {
                    const id = obtenerId(evento);

                    if (!id) {
                        console.error(
                            "[Incorporacion] Evento inválido",
                        );
                        nack();
                        return;
                    }

                    await incorporarVehiculoExterno(id);

                    // Confirmamos después de completar la transacción.
                    ack();
                },
            );

            return;
        } catch (error) {
            console.error(
                `[Incorporacion] Intento ${intento}/10 fallido:`,
                error instanceof Error ? error.message : error,
            );

            if (intento === 10) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
}
