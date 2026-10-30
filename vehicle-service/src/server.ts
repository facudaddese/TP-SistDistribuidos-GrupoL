import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { pool, testConnection } from "./db";
import { handlers } from "./handlers";
import { iniciarWorkerPolicial } from "./policialWorker";
import { escucharResultadosVerificacion } from "./verificacionConsumer";
import { inicializarTablasExternos } from "./externos/schema";
import { iniciarPublicadorExternos } from "./externos/publisher";
import { iniciarWorkerTitularidad } from "./externos/titularidadWorker";
import { iniciarCoordinadorExternos } from "./externos/coordinadorWorker";
import { iniciarWorkerIncorporacion } from "./externos/incorporacionWorker";


const PROTO_PATH = path.resolve(__dirname, "../proto/vehicle.proto");

async function main(): Promise<void> {
  const host = process.env.GRPC_HOST ?? "0.0.0.0";
  const port = Number(process.env.GRPC_PORT ?? "50052");

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("GRPC_PORT debe ser un puerto válido");
  }

  const definition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const descriptor = grpc.loadPackageDefinition(definition);
  const vehiclePackage = descriptor.vehicle as grpc.GrpcObject;
  const vehicleService =
    vehiclePackage.VehicleService as grpc.ServiceClientConstructor;

  await testConnection();
  await inicializarTablasExternos();
  console.log("[VehicleService] Tablas de vehículos externos listas");

    const detenerPublicadorExternos = iniciarPublicadorExternos();

    async function conectarWorkerTitularidad(): Promise<void> {
        const maxIntentos = 10;

        for (let intento = 1; intento <= maxIntentos; intento++) {
            try {
                await iniciarWorkerTitularidad();
                return;
            } catch (error) {
                console.error(
                    `[Titularidad] Intento ${intento}/${maxIntentos} fallido:`,
                    error instanceof Error ? error.message : error,
                );

                if (intento === maxIntentos) {
                    throw error;
                }

                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }
    }

    void conectarWorkerTitularidad().catch((error: unknown) => {
        console.error(
            "[VehicleService] Se agotaron los intentos de inicio de titularidad:",
            error,
        );
    });

    void iniciarCoordinadorExternos().catch((error: unknown) => {
        console.error(
            "[VehicleService] No se pudo iniciar el coordinador:",
            error,
        );
    });

    void iniciarWorkerIncorporacion().catch((error: unknown) => {
        console.error(
            "[VehicleService] No se pudo iniciar el worker de incorporación:",
            error,
        );
    });

  iniciarWorkerPolicial().catch((error) =>
    console.error("[VehicleService] Error al iniciar Worker Policial:", error),
  );
  escucharResultadosVerificacion().catch((error) =>
    console.error(
      "[VehicleService] Error al iniciar Consumidor de Resultados:",
      error,
    ),
  );

  const server = new grpc.Server();

  server.addService(vehicleService.service, handlers);

  const boundPort = await new Promise<number>((resolve, reject) => {
    server.bindAsync(
      `${host}:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, actualPort) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(actualPort);
      },
    );
  });

  console.log(
    `[VehicleService] Servidor gRPC escuchando en ${host}:${boundPort}`,
  );

  let cerrando = false;

  const cerrar = (): void => {
    if (cerrando) return;
    cerrando = true;

    console.log("[VehicleService] Cerrando servidor...");

    const timeout = setTimeout(() => {
      server.forceShutdown();
    }, 5000);

    server.tryShutdown(() => {
      clearTimeout(timeout);

        void detenerPublicadorExternos()
            .then(() => pool.end())
            .catch((error: unknown) => {
        console.error("[VehicleService] Error al cerrar MySQL:", error);
        process.exitCode = 1;
      });
    });
  };

  process.once("SIGINT", cerrar);
  process.once("SIGTERM", cerrar);
}

void main().catch(async (error: unknown) => {
  console.error("[VehicleService] No se pudo iniciar:", error);
  process.exitCode = 1;
  await pool.end();
});
