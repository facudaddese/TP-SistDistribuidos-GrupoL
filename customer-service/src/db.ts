import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  connectTimeout: 10000, // Timeout de conexión de 10 segundos
  waitForConnections: true,
  queueLimit: 0
});

export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    console.log(' Conexión a la base de datos MySQL establecida correctamente.');
  } catch (error) {
    console.error(' Error al conectar a la base de datos:', error);
    process.exit(1);
  }
}
