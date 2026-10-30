import amqp from "amqplib";
import { MantenimientoResultadoEvent } from "./mantenimientoEvents.js";

function obtenerRabbitUrl(): string {
  if (process.env.RABBITMQ_URL) return process.env.RABBITMQ_URL;
  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const port = process.env.RABBITMQ_PORT || "5672";
  const user = process.env.RABBITMQ_USER || "rentar_rabbit";
  const pass = process.env.RABBITMQ_PASSWORD || "rentar_rabbit_pass";
  return `amqp://${user}:${pass}@${host}:${port}`;
}

export async function escucharResultadosMantenimiento(
  retries = 10,
  delay = 3000,
): Promise<void> {
  const rabbitUrl = obtenerRabbitUrl();

  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();

      const exchange = "mantenimiento_resultado_exchange";
      const queue = "cola_mantenimiento_preventivo_resultados";
      const routingKey = "mantenimiento.resultado";

      await channel.assertExchange(exchange, "direct", { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, routingKey);

      console.log(
        "[Mantenimiento Consumer] Escuchando resultados de mantenimiento...",
      );

      channel.consume(queue, async (msg) => {
        if (msg) {
          const resultado: MantenimientoResultadoEvent = JSON.parse(
            msg.content.toString(),
          );

          console.log(
            `[Mantenimiento Consumer] Historial actualizado para Reserva ID ${resultado.reservaId}: Estado ${resultado.resultado} (${resultado.motivo})`,
          );

          channel.ack(msg);
        }
      });

      return;
    } catch (error) {
      console.warn(
        `[Mantenimiento Consumer] Intento ${i + 1}/${retries} fallido. Reintentando en ${delay / 1000}s...`,
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.error(
    "[Mantenimiento Consumer Error] No se pudo conectar a RabbitMQ.",
  );
}
