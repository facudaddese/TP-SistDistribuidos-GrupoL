import amqp, { Channel, ChannelModel, Options } from "amqplib";

/**
 * Cliente Singleton para RabbitMQ.
 * Gestiona ciclo de vida de conexión, canal, declaración de exchanges,
 * reconexión ante fallos y publicación/consumo tipado en JSON.
 */
export class RabbitMQClient {
    private static instance: RabbitMQClient;
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private isConnecting: boolean = false;

    public static readonly EXCHANGE_NAME = "rentar.topic.exchange";

    private readonly amqpUrl: string;

    private constructor() {
        this.amqpUrl =
            process.env.RABBITMQ_URL ||
            `amqp://${process.env.RABBITMQ_USER || "rentar_rabbit"}:${process.env.RABBITMQ_PASSWORD || "rentar_rabbit_pass"
            }@${process.env.RABBITMQ_HOST || "localhost"}:${process.env.RABBITMQ_PORT || 5672
            }`;
    }

    /**
     * Obtiene la instancia única (Singleton).
     */
    public static getInstance(): RabbitMQClient {
        if (!RabbitMQClient.instance) {
            RabbitMQClient.instance = new RabbitMQClient();
        }
        return RabbitMQClient.instance;
    }

    /**
     * Establece la conexión al broker RabbitMQ y abre el canal.
     */
    public async connect(): Promise<Channel> {
        if (this.channel) {
            return this.channel;
        }

        if (this.isConnecting) {
            // Espera activa breve si ya hay una conexión en curso
            while (this.isConnecting) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (this.channel) return this.channel;
        }

        this.isConnecting = true;

        try {
            console.log(`[RabbitMQ] Conectando a ${this.amqpUrl.replace(/:[^:]*@/, ":****@")}...`);
            this.connection = await amqp.connect(this.amqpUrl);

            this.connection.on("error", (err) => {
                console.error("[RabbitMQ] Error en la conexión:", err.message);
            });

            this.connection.on("close", () => {
                console.warn("[RabbitMQ] Conexión cerrada. Limpiando canal...");
                this.connection = null;
                this.channel = null;
            });

            this.channel = await this.connection.createChannel();

            this.channel.on("error", (err) => {
                console.error("[RabbitMQ] Error en el canal:", err.message);
            });

            this.channel.on("close", () => {
                console.warn("[RabbitMQ] Canal cerrado.");
                this.channel = null;
            });

            // Asegurar existencia del TopicExchange principal (durable)
            await this.channel.assertExchange(RabbitMQClient.EXCHANGE_NAME, "topic", {
                durable: true,
            });

            console.log(
                `[RabbitMQ] Conexión establecida y TopicExchange '${RabbitMQClient.EXCHANGE_NAME}' verificado.`
            );

            return this.channel;
        } catch (error) {
            console.error("[RabbitMQ] Fallo crítico al conectar:", error);
            this.connection = null;
            this.channel = null;
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Obtiene el canal actual o se conecta si aún no está activo.
     */
    public async getChannel(): Promise<Channel> {
        if (!this.channel) {
            return await this.connect();
        }
        return this.channel;
    }

    /**
     * Publica un mensaje tipado serializado a JSON en el TopicExchange.
     */
    public async publish<T>(
        routingKey: string,
        message: T,
        options?: Options.Publish
    ): Promise<boolean> {
        try {
            const channel = await this.getChannel();
            const payload = Buffer.from(JSON.stringify(message));

            return channel.publish(RabbitMQClient.EXCHANGE_NAME, routingKey, payload, {
                contentType: "application/json",
                persistent: true, // Mensaje persistente en disco
                ...options,
            });
        } catch (error) {
            console.error(`[RabbitMQ] Error al publicar en '${routingKey}':`, error);
            throw error;
        }
    }

    /**
     * Crea una cola durable, la bindea al Exchange con una Routing Key dada y consume mensajes.
     */
    public async consume<T>(
        queueName: string,
        bindingKey: string,
        onMessage: (data: T, ack: () => void, nack: () => void) => Promise<void> | void
    ): Promise<void> {
        try {
            const channel = await this.getChannel();

            await channel.assertQueue(queueName, { durable: true });
            await channel.bindQueue(queueName, RabbitMQClient.EXCHANGE_NAME, bindingKey);

            await channel.consume(
                queueName,
                async (msg) => {
                    if (!msg) return;

                    const ack = () => channel.ack(msg);
                    const nack = (requeue = false) => channel.nack(msg, false, requeue);

                    try {
                        const parsedData: T = JSON.parse(msg.content.toString());
                        await onMessage(parsedData, ack, nack);
                    } catch (err) {
                        console.error(
                            `[RabbitMQ] Error procesando mensaje de cola '${queueName}':`,
                            err,
                        );

                        // Si el canal se cerró, RabbitMQ reencolará los mensajes
                        // que quedaron sin confirmar.
                        if (this.channel !== channel) {
                            return;
                        }

                        // Un JSON inválido no se soluciona reintentando.
                        if (err instanceof SyntaxError) {
                            channel.nack(msg, false, false);
                            return;
                        }

                        // Esperamos antes de reintentar un error de procesamiento.
                        await new Promise((resolve) => setTimeout(resolve, 1000));

                        if (this.channel === channel) {
                            channel.nack(msg, false, true);
                        }
                    }
                },
                { noAck: false } // Acknowledgment manual obligatorio
            );

            console.log(
                `[RabbitMQ] Consumidor registrado en cola '${queueName}' vinculada con patrón '${bindingKey}'.`
            );
        } catch (error) {
            console.error(`[RabbitMQ] Error al configurar consumidor en cola '${queueName}':`, error);
            throw error;
        }
    }

    /**
     * Cierre ordenado de conexiones (Graceful Shutdown).
     */
    public async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            console.log("[RabbitMQ] Conexión cerrada limpiamente.");
        } catch (error) {
            console.error("[RabbitMQ] Error durante el cierre de conexión:", error);
        }
    }
}

export default RabbitMQClient.getInstance();
