import amqp from "amqplib";
import { ReservaConfirmadaEvent } from "./mantenimientoEvents";

function obtenerRabbitUrl(): string {
  if (process.env.RABBITMQ_URL) return process.env.RABBITMQ_URL;
  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const port = process.env.RABBITMQ_PORT || "5672";
  const user = process.env.RABBITMQ_USER || "rentar_rabbit";
  const pass = process.env.RABBITMQ_PASSWORD || "rentar_rabbit_pass";
  return `amqp://${user}:${pass}@${host}:${port}`;
}

export async function publicarReservaConfirmada(reserva: {
  id: number;
  vehiculoId: number;
  clienteId: number;
}): Promise<void> {
  const rabbitUrl = obtenerRabbitUrl();
  let connection;

  try {
    connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();

    const exchange = "mantenimiento_preventivo_exchange";
    const routingKey = "reserva.confirmada";

    await channel.assertExchange(exchange, "direct", { durable: true });

    const evento: ReservaConfirmadaEvent = {
      reservaId: reserva.id,
      vehiculoId: reserva.vehiculoId,
      clienteId: reserva.clienteId,
      fechaReserva: new Date().toISOString(),
    };

    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(evento)), {
      persistent: true,
    });

    console.log(
      `[RabbitMQ] Evento reserva.confirmada publicado para Reserva ID: ${reserva.id}`,
    );

    await channel.close();
    await connection.close();
  } catch (error) {
    if (connection) await connection.close().catch(() => {});
    console.error(
      "[RabbitMQ Error] Error publicando evento de reserva confirmada:",
      error,
    );
  }
}
