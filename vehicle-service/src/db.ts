import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";

// Busca .env dentro de vehicle-service.
dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const dbPort = Number(process.env.DB_PORT ?? "3306");

if (!Number.isInteger(dbPort) || dbPort <= 0 || dbPort > 65535) {
    throw new Error("DB_PORT debe ser un puerto válido");
}

export const pool = mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: dbPort,
    user: process.env.DB_USER ?? "rentar_user",
    password: process.env.DB_PASSWORD ?? "rentar_password",
    database: process.env.DB_NAME ?? "rentar_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,

    // Conserva los importes DECIMAL como texto.
    decimalNumbers: false,

    // Evita convertir las fechas SQL a objetos Date.
    dateStrings: true,

    // Conserva IDs BIGINT sin pérdida de precisión.
    supportBigNumbers: true,
    bigNumberStrings: true,
});

export async function testConnection(): Promise<void> {
    const connection = await pool.getConnection();

    try {
        await connection.query("SELECT 1");
        console.log("[VehicleService] Conexión a MySQL correcta");
    } finally {
        connection.release();
    }
}
