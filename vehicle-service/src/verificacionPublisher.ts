import amqp from "amqplib";
import { VerificacionSolicitadaEvent } from "./verificacionEvents";

function obtenerRabbitUrl(): string {
  if (process.env.RABBITMQ_URL) return process.env.RABBITMQ_URL;

  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const port = process.env.RABBITMQ_PORT || "5672";
  const user = process.env.RABBITMQ_USER || "rentar_rabbit";
  const pass = process.env.RABBITMQ_PASSWORD || "rentar_rabbit_pass";

  return `amqp://${user}:${pass}@${host}:${port}`;
}

export async function publicarSolicitudVerificacion(
  vehiculo: { id: number; patente: string; marca: string; modelo: string },
  retries = 5,
  delay = 2000,
): Promise<void> {
  const rabbitUrl = obtenerRabbitUrl();

  for (let i = 0; i < retries; i++) {
    let connection;
    try {
      connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();

      const exchange = "verificacion_policial_exchange";
      const routingKey = "vehiculo.solicitado";

      await channel.assertExchange(exchange, "direct", { durable: true });

      const evento: VerificacionSolicitadaEvent = {
        vehiculoId: vehiculo.id,
        patente: vehiculo.patente,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        fechaSolicitud: new Date().toISOString(),
      };

      channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(evento)),
        {
          persistent: true,
        },
      );

      console.log(
        `[RabbitMQ] Solicitud de verificación publicada para patente: ${vehiculo.patente}`,
      );

      await channel.close();
      await connection.close();
      return;
    } catch (error) {
      if (connection) await connection.close().catch(() => {});
      if (i === retries - 1) {
        console.error(
          "[RabbitMQ Error] Error al publicar solicitud de verificación:",
          error,
        );
      } else {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
}
