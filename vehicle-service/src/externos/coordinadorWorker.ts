import rabbitMQ from "../rabbitmq.config";
import { registrarResultadoExterno } from "./repository";
import {
    EXTERNOS_ROUTING_KEYS,
    type ValidacionPatenteEvent,
    type ValidacionTitularidadEvent,
} from "./types";

function esResultadoValido(
    valor: unknown,
): valor is ValidacionPatenteEvent {
    if (typeof valor !== "object" || valor === null) {
        return false;
    }

    const evento = valor as Record<string, unknown>;

    return (
        typeof evento.vehiculoExternoId === "string" &&
        /^[1-9]\d*$/.test(evento.vehiculoExternoId) &&
        typeof evento.patente === "string" &&
        evento.patente.trim().length > 0 &&
        (
            evento.resultado === "VALIDADO" ||
            evento.resultado === "RECHAZADO"
        )
    );
}

function tieneIdentidad(
    evento: ValidacionPatenteEvent,
): evento is ValidacionTitularidadEvent {
    const valor = evento as unknown as Record<string, unknown>;

    return (
        typeof valor.clienteId === "string" &&
        /^[1-9]\d*$/.test(valor.clienteId) &&
        typeof valor.documento === "string" &&
        valor.documento.trim().length > 0
    );
}

// Se inicializa cada consumidor por separado para que un fallo
// al registrar uno no duplique el otro durante los reintentos.
async function iniciarConReintentos(
    nombre: string,
    iniciar: () => Promise<void>,
): Promise<void> {
    for (let intento = 1; intento <= 10; intento++) {
        try {
            await iniciar();
            return;
        } catch (error) {
            console.error(
                `[Coordinador] ${nombre}: intento ${intento}/10 fallido`,
                error instanceof Error ? error.message : error,
            );

            if (intento === 10) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
}

export async function iniciarCoordinadorExternos(): Promise<void> {
    await Promise.all([
        iniciarConReintentos("patente", async () => {
            await rabbitMQ.consume<unknown>(
                "q.rentar.externos-val-patente",
                EXTERNOS_ROUTING_KEYS.patente,
                async (evento, ack, nack) => {
                    if (!esResultadoValido(evento)) {
                        console.error(
                            "[Coordinador] Resultado de patente inválido",
                        );
                        nack();
                        return;
                    }

                    await registrarResultadoExterno(
                        evento.vehiculoExternoId,
                        evento.patente,
                        "PATENTE",
                        evento.resultado,
                    );

                    ack();
                },
            );
        }),

        iniciarConReintentos("titularidad", async () => {
            await rabbitMQ.consume<unknown>(
                "q.rentar.externos-val-titularidad",
                EXTERNOS_ROUTING_KEYS.titularidad,
                async (evento, ack, nack) => {
                    if (
                        !esResultadoValido(evento) ||
                        !tieneIdentidad(evento)
                    ) {
                        console.error(
                            "[Coordinador] Resultado de titularidad inválido",
                        );
                        nack();
                        return;
                    }

                    await registrarResultadoExterno(
                        evento.vehiculoExternoId,
                        evento.patente,
                        "TITULARIDAD",
                        evento.resultado,
                        {
                            clienteId: evento.clienteId,
                            documento: evento.documento,
                        },
                    );

                    ack();
                },
            );
        }),
    ]);
}
