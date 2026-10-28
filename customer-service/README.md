# Customer Service — Rentar

Servicio del dominio de clientes desarrollado en Node.js con TypeScript.
Expone operaciones gRPC y persiste los datos de usuarios y clientes en MySQL.

## Operaciones

Contrato: `proto/customer.proto`.

| Método | Descripción |
|---|---|
| ConsultarClientes | Lista todos los clientes o solamente los activos. |
| ConsultarCliente | Consulta un cliente por ID. |
| VerificarExistencia | Verifica si existe un cliente dado su ID. |
| VerificarActivo | Verifica si existe y si se encuentra activo un cliente dado su ID. |
| ConsultarClientePorDocumento | Consulta un cliente por su número de documento. |
| CrearCliente | Da de alta un nuevo cliente (inserta en `usuario` y `cliente` en una transacción; valida formatos y hashea contraseña con `bcryptjs` cost 10). |
| ModificarCliente | Actualiza los datos editables del cliente (`documento`, `nombre`, `apellido`, `email`, `telefono`, `fechaNacimiento`). |
| DarDeBajaCliente | Realiza la baja lógica del cliente (`usuario.activo = 0`). Si ya estaba inactivo, devuelve `FAILED_PRECONDITION`. |

## Modelo de Datos

Persiste en dos tablas relacionadas en MySQL:
- `usuario`: `id` (PK AUTO_INCREMENT), `email` (UNIQUE), `password` (hash bcrypt), `rol` ('CLIENTE'), `activo` (BIT(1)).
- `cliente`: `usuario_id` (PK y FK hacia `usuario.id`), `documento` (UNIQUE), `nombre`, `apellido`, `telefono`, `fecha_nacimiento`.

## Requisitos

- Node.js (v18+) y npm.
- MySQL con la base de datos `rentar_db` y tablas `usuario` y `cliente`.

## Configuración

Desde la carpeta `customer-service`:

```bash
cp .env.example .env
```

Configurar las variables de entorno en `.env`:

```dotenv
GRPC_HOST=0.0.0.0
GRPC_PORT=50051

DB_HOST=localhost
DB_PORT=3306
DB_USER=customer_service
DB_PASSWORD=tu_password_aqui
DB_NAME=rentar_db
```

> **Importante:** Nunca versionar `.env` ni exponer credenciales reales.

## Comandos

- Instalar dependencias:
  ```bash
  npm install
  ```
- Ejecutar en modo desarrollo:
  ```bash
  npm run dev
  ```
- Validar tipos de TypeScript:
  ```bash
  npm run typecheck
  ```
