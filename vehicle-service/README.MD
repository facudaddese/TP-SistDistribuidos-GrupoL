# Vehicle Service — Rentar

Servicio del dominio de vehículos desarrollado en TypeScript.
Expone operaciones gRPC y persiste los vehículos en MySQL.

## Operaciones

Contrato: `proto/vehicle.proto`.

| Método | Descripción |
|---|---|
| ConsultarVehiculos | Lista todos los vehículos o solamente los activos. |
| ConsultarVehiculo | Consulta un vehículo por ID. |
| CrearVehiculo | Crea un vehículo activo con estado DISPONIBLE. |
| ModificarVehiculo | Modifica los datos sin cambiar patente, estado ni activo. |
| DarDeBajaVehiculo | Realiza una baja lógica. |
| ActualizarEstado | Cambia el estado operativo del vehículo. |
| BuscarVehiculosDisponibles | Filtra vehículos activos según atributos opcionales y excluyendo los IDs indicados. |

Estados: `DISPONIBLE`, `RESERVADO`, `EN_ALQUILER`.

Tipos: `SEDAN`, `SUV`, `PICKUP`, `COUPE`, `HATCHBACK`.

Los IDs se representan como strings para conservar precisión de int64.
Los precios se representan como strings decimales, compatibles con DECIMAL(10,2).

## Requisitos

- Node.js y npm.
- MySQL con la tabla `vehiculo` del Hito 1.

El servicio no crea las tablas automáticamente.

## Configuración

Desde `vehicle-service`, en PowerShell:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Editar `.env` con los datos de conexión a MySQL.

Configuración local:

```dotenv
GRPC_HOST=0.0.0.0
GRPC_PORT=50052
DB_HOST=localhost
DB_PORT=3306
DB_USER=rentar_user
DB_PASSWORD=rentar_password
DB_NAME=rentar_db
```

No versionar `.env`.

## Ejecución

```powershell
npm.cmd run typecheck
npm.cmd run dev
```

Para ejecutar sin reinicio automático:

```powershell
npm.cmd start
```

El servidor utiliza gRPC sin TLS para el entorno local de desarrollo.

## Búsqueda de Vehículos Disponibles

El servicio expone el RPC `BuscarVehiculosDisponibles`:
- Vehicle Service es independiente de Rental Service: ya no conoce fechas ni reservas.
- La superposición de reservas temporales la resuelve el **API Gateway**, consultando los vehículos ocupados a **Rental Service** (`ConsultarVehiculosOcupados`) y enviando la lista resultante en el campo `idsExcluidos`.
- Filtros opcionales:
  - `tipoVehiculo`: SEDAN, SUV, PICKUP, COUPE o HATCHBACK.
  - `marca`: coincidencia parcial sin distinguir mayúsculas.
  - `modelo`: coincidencia parcial sin distinguir mayúsculas.
  - `precioMin` y `precioMax`: rango decimal con hasta dos decimales.
  - `idsExcluidos`: lista de hasta 1000 identificadores a omitir del resultado (excluidos en la consulta SQL mediante `NOT IN (?)` parametrizado).
- Solo se retornan vehículos con `activo = 1`.

## Pruebas manuales

En Postman, crear una solicitud gRPC a `localhost:50052`, desactivar TLS e importar `proto/vehicle.proto`.

Ejemplo de alta:

```json
{
  "patente": "RPC001",
  "marca": "Toyota",
  "modelo": "Corolla",
  "anio": 2022,
  "color": "Gris",
  "tipoVehiculo": "SEDAN",
  "precioDiario": "25000.00"
}
```

Ejemplo de búsqueda de disponibles:

```json
{
  "tipoVehiculo": "SEDAN",
  "marca": "Toyota",
  "precioMin": "10000.00",
  "precioMax": "50000.00",
  "idsExcluidos": [1, 2]
}
```

## Errores

- `INVALID_ARGUMENT`: datos inválidos (formato de precio, tipo de vehículo desconocido, más de 1000 IDs excluidos o IDs con formato erróneo).
- `NOT_FOUND`: vehículo inexistente.
- `ALREADY_EXISTS`: patente duplicada.
- `INTERNAL`: fallo interno del servidor.
