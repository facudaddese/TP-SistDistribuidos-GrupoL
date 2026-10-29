import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { pool, testConnection } from "./db";
import { handlers } from "./handlers";
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

            void pool.end().catch((error: unknown) => {
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
