import amqp from "amqplib";
import {
  ReservaConfirmadaEvent,
  MantenimientoResultadoEvent,
} from "./mantenimientoEvents.js";

function obtenerRabbitUrl(): string {
  if (process.env.RABBITMQ_URL) return process.env.RABBITMQ_URL;
  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const port = process.env.RABBITMQ_PORT || "5672";
  const user = process.env.RABBITMQ_USER || "rentar_rabbit";
  const pass = process.env.RABBITMQ_PASSWORD || "rentar_rabbit_pass";
  return `amqp://${user}:${pass}@${host}:${port}`;
}

export async function iniciarWorkerMantenimiento(
  retries = 10,
  delay = 3000,
): Promise<void> {
  const rabbitUrl = obtenerRabbitUrl();

  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();

      const exchangeIn = "mantenimiento_preventivo_exchange";
      const queueIn = "cola_mantenimiento_preventivo_solicitudes";
      const routingKeyIn = "reserva.confirmada";

      const exchangeOut = "mantenimiento_resultado_exchange";
      const routingKeyOut = "mantenimiento.resultado";

      await channel.assertExchange(exchangeIn, "direct", { durable: true });
      await channel.assertQueue(queueIn, { durable: true });
      await channel.bindQueue(queueIn, exchangeIn, routingKeyIn);

      await channel.assertExchange(exchangeOut, "direct", { durable: true });

      console.log(
        "[Worker Mantenimiento] Conectado exitosamente. Escuchando reservas confirmadas...",
      );

      channel.consume(queueIn, async (msg) => {
        if (msg) {
          const evento: ReservaConfirmadaEvent = JSON.parse(
            msg.content.toString(),
          );
          console.log(
            `[Worker Mantenimiento] Procesando mantenimiento preventivo para Reserva ID: ${evento.reservaId}`,
          );

          const realizado = Math.random() < 0.8;

          const resultado: MantenimientoResultadoEvent = {
            reservaId: evento.reservaId,
            vehiculoId: evento.vehiculoId,
            resultado: realizado ? "REALIZADO" : "NO_REALIZADO",
            motivo: realizado
              ? "Inspección técnica y niveles verificados correctamente"
              : "Falta de insumos o taller ocupado",
            fechaProcesamiento: new Date().toISOString(),
          };

          channel.publish(
            exchangeOut,
            routingKeyOut,
            Buffer.from(JSON.stringify(resultado)),
            { persistent: true },
          );

          console.log(
            `[Worker Mantenimiento] Resultado emitido para Reserva ID ${evento.reservaId}: ${resultado.resultado}`,
          );
          channel.ack(msg);
        }
      });

      return;
    } catch (error) {
      console.warn(
        `[Worker Mantenimiento] Intento ${i + 1}/${retries} fallido. Reintentando en ${delay / 1000}s...`,
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.error("[Worker Mantenimiento Error] No se pudo conectar a RabbitMQ.");
}
