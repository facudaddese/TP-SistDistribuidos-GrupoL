import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";

// Carga la configuración antes de leer las variables de entorno.
import "./db";

export interface ReservaRpc {
    id: number;
    clienteId: number;
    vehiculoId: number;
    fechaHoraInicio: string;
    fechaHoraFin: string;
    importeTotal: number;
    estado: string;
}

interface ConsultarReservasRequest {
    estado: string;
}

interface ListaReservasResponse {
    reservas: ReservaRpc[];
}

interface RentalClient extends grpc.Client {
    ConsultarReservas(
        request: ConsultarReservasRequest,
        options: grpc.CallOptions,
        callback: (
            error: grpc.ServiceError | null,
            response?: ListaReservasResponse,
        ) => void,
    ): grpc.ClientUnaryCall;
}

// TODO: Eliminar rental.proto y este cliente en el Paso 1.4 al quitar la dependencia de vehicle-service hacia Rental Service.
const definition = protoLoader.loadSync(
    path.resolve(__dirname, "../proto/rental.proto"),
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);

const descriptor = grpc.loadPackageDefinition(definition);
const rentalPackage = descriptor.rental as grpc.GrpcObject;
const RentalService =
    rentalPackage.RentalService as grpc.ServiceClientConstructor;

const client = new RentalService(
    process.env.RENTAL_GRPC_ADDRESS ?? "localhost:50053",
    grpc.credentials.createInsecure(),
) as unknown as RentalClient;

export function consultarReservasConfirmadas(): Promise<ReservaRpc[]> {
    return new Promise((resolve, reject) => {
        client.ConsultarReservas(
            { estado: "CONFIRMADA" },
            { deadline: Date.now() + 5000 },
            (error, response) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!response) {
                    reject(new Error("Rental Service devolvió una respuesta vacía"));
                    return;
                }

                resolve(response.reservas);
            },
        );
    });
}

export function cerrarRentalClient(): void {
    client.close();
}
