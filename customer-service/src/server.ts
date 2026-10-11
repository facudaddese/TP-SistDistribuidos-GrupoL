import path from 'path';
import { fileURLToPath } from 'url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import { handlers } from './handlers.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, '../customer.proto');

const PORT = process.env.GRPC_PORT || '50051';

// Cargar el .proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const customerProto = grpc.loadPackageDefinition(packageDefinition).customer as any;

async function main() {
  // Verificar la conexión a la base de datos antes de iniciar
  await testConnection();

  const server = new grpc.Server();
  server.addService(customerProto.CustomerService.service, handlers);

  // NOTA: Se usan credenciales inseguras (createInsecure) ya que este servicio
  // corre dentro de una red interna de Docker, no expuesta a internet.
  // En un despliegue real expuesto correspondería usar TLS (createSsl).
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Error al arrancar el servidor gRPC:', err);
        process.exit(1);
      }
      console.log(`Servidor gRPC customer-service escuchando en el puerto ${port}`);
    }
  );
}

main();
