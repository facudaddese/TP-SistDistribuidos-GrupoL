import amqp from "amqplib";
import {
  VerificacionSolicitadaEvent,
  VerificacionResultadoEvent,
} from "./verificacionEvents";

function obtenerRabbitUrl(): string {
  if (process.env.RABBITMQ_URL) return process.env.RABBITMQ_URL;

  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const port = process.env.RABBITMQ_PORT || "5672";
  const user = process.env.RABBITMQ_USER || "rentar_rabbit";
  const pass = process.env.RABBITMQ_PASSWORD || "rentar_rabbit_pass";

  return `amqp://${user}:${pass}@${host}:${port}`;
}

export async function iniciarWorkerPolicial(
  retries = 10,
  delay = 3000,
): Promise<void> {
  const rabbitUrl = obtenerRabbitUrl();

  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();

      const exchangeIn = "verificacion_policial_exchange";
      const queueIn = "cola_verificacion_policial_solicitudes";
      const routingKeyIn = "vehiculo.solicitado";

      const exchangeOut = "verificacion_resultado_exchange";
      const routingKeyOut = "vehiculo.resultado";

      await channel.assertExchange(exchangeIn, "direct", { durable: true });
      await channel.assertQueue(queueIn, { durable: true });
      await channel.bindQueue(queueIn, exchangeIn, routingKeyIn);

      await channel.assertExchange(exchangeOut, "direct", { durable: true });

      console.log(
        "[Worker Policial] Conectado exitosamente a RabbitMQ. Escuchando solicitudes...",
      );

      channel.consume(queueIn, async (msg) => {
        if (msg) {
          const solicitud: VerificacionSolicitadaEvent = JSON.parse(
            msg.content.toString(),
          );
          console.log(
            `[Worker Policial] Verificando vehículo ID ${solicitud.vehiculoId} - Patente: ${solicitud.patente}`,
          );

          const esRobado = Math.random() < 0.2;

          const resultado: VerificacionResultadoEvent = {
            vehiculoId: solicitud.vehiculoId,
            patente: solicitud.patente,
            resultado: esRobado ? "ROBADO" : "VALIDADO",
            motivo: esRobado
              ? "Denuncia por robo activa en registro automotor"
              : "Sin denuncias ni pedidos de captura",
            fechaVerificacion: new Date().toISOString(),
          };

          channel.publish(
            exchangeOut,
            routingKeyOut,
            Buffer.from(JSON.stringify(resultado)),
            { persistent: true },
          );

          console.log(
            `[Worker Policial] Respuesta enviada para patente ${solicitud.patente}: ${resultado.resultado}`,
          );
          channel.ack(msg);
        }
      });

      return;
    } catch (error) {
      console.warn(
        `[Worker Policial] Intento de conexión ${i + 1}/${retries} fallido. Reintentando en ${delay / 1000}s...`,
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.error(
    "[Worker Policial Error] No se pudo conectar a RabbitMQ tras varios intentos.",
  );
}
