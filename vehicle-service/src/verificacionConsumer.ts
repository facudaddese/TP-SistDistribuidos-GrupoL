import amqp from "amqplib";
import { VerificacionResultadoEvent } from "./verificacionEvents";
import { darDeBajaVehiculo } from "./vehiculoRepository";

function obtenerRabbitUrl(): string {
  if (process.env.RABBITMQ_URL) return process.env.RABBITMQ_URL;

  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const port = process.env.RABBITMQ_PORT || "5672";
  const user = process.env.RABBITMQ_USER || "rentar_rabbit";
  const pass = process.env.RABBITMQ_PASSWORD || "rentar_rabbit_pass";

  return `amqp://${user}:${pass}@${host}:${port}`;
}

export async function escucharResultadosVerificacion(
  retries = 10,
  delay = 3000,
): Promise<void> {
  const rabbitUrl = obtenerRabbitUrl();

  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();

      const exchange = "verificacion_resultado_exchange";
      const queue = "cola_verificacion_policial_resultados";
      const routingKey = "vehiculo.resultado";

      await channel.assertExchange(exchange, "direct", { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, routingKey);

      console.log(
        "[Vehicle Service Consumer] Conectado exitosamente. Escuchando resultados policiales...",
      );

      channel.consume(queue, async (msg) => {
        if (msg) {
          const evento: VerificacionResultadoEvent = JSON.parse(
            msg.content.toString(),
          );

          if (evento.resultado === "ROBADO") {
            console.warn(
              `[ALERTA POLICIAL] Vehículo ID ${evento.vehiculoId} (Patente: ${evento.patente}) reportado como ROBADO. Inhabilitando vehículo...`,
            );

            await darDeBajaVehiculo(String(evento.vehiculoId));

            console.log(
              `[Vehicle Service] Vehículo ID ${evento.vehiculoId} inhabilitado exitosamente (activo = false).`,
            );
          } else {
            console.log(
              `[OK] Vehículo ID ${evento.vehiculoId} (${evento.patente}) verificado correctamente por la policía.`,
            );
          }

          channel.ack(msg);
        }
      });

      return;
    } catch (error) {
      console.warn(
        `[Vehicle Service Consumer] Intento de conexión ${i + 1}/${retries} fallido. Reintentando en ${delay / 1000}s...`,
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.error(
    "[Vehicle Service Consumer Error] No se pudo conectar a RabbitMQ tras varios intentos.",
  );
}
