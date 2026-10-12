# Vehicle Service — Rentar

Servicio del dominio de vehículos desarrollado en TypeScript.
Expone operaciones gRPC y persiste los vehículos en MySQL.

## Operaciones

Contrato: `vehicle.proto`.

| Método | Descripción |
|---|---|
| ConsultarVehiculos | Lista todos los vehículos o solamente los activos. |
| ConsultarVehiculo | Consulta un vehículo por ID. |
| CrearVehiculo | Crea un vehículo activo con estado DISPONIBLE. |
| ModificarVehiculo | Modifica los datos sin cambiar patente, estado ni activo. |
| DarDeBajaVehiculo | Realiza una baja lógica. |
| ActualizarEstado | Cambia el estado operativo del vehículo. |
| ConsultarDisponibilidad | Filtra vehículos activos y excluye reservas confirmadas superpuestas. |

Estados: `DISPONIBLE`, `RESERVADO`, `EN_ALQUILER`.

Tipos: `SEDAN`, `SUV`, `PICKUP`, `COUPE`, `HATCHBACK`.

Los IDs se representan como strings para conservar precisión de int64.
Los precios se representan como strings decimales, compatibles con
DECIMAL(10,2).

## Requisitos

- Node.js y npm.
- MySQL con la tabla `vehiculo` del Hito 1.
- Rental Service disponible para consultar disponibilidad.

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
RENTAL_GRPC_ADDRESS=localhost:50053
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

## Disponibilidad

Vehicle consulta `ConsultarReservas` de Rental mediante gRPC,
solicitando reservas CONFIRMADAS.

Una reserva se superpone cuando:

```text
inicioSolicitado < finReserva
y
finSolicitado > inicioReserva
```

Los períodos contiguos no se superponen. Las reservas canceladas no
bloquean disponibilidad.

Filtros opcionales: tipoVehiculo, marca, modelo, precioMin y precioMax.
Marca y modelo se comparan por coincidencia parcial sin distinguir
mayúsculas.

La llamada a Rental tiene un plazo de cinco segundos. Si no se puede
consultar, la operación devuelve un error y no informa disponibilidad.

Contrato utilizado de Rental: `proto/rental.proto`.
Mantener esta copia sincronizada con el contrato del servicio proveedor.

## Pruebas manuales

En Postman, crear una solicitud gRPC a `localhost:50052`, desactivar TLS
e importar `vehicle.proto`.

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

Ejemplo de disponibilidad:

```json
{
  "fechaInicio": "2026-11-01T10:00:00Z",
  "fechaFin": "2026-11-03T10:00:00Z"
}
```

Se realizaron pruebas manuales de consulta, alta y patente duplicada,
modificación, validación de precio, baja lógica, actualización de estado,
Rental no disponible, reserva superpuesta y períodos contiguos.

## Errores

- INVALID_ARGUMENT: datos inválidos.
- NOT_FOUND: vehículo inexistente.
- ALREADY_EXISTS: patente duplicada.
- UNAVAILABLE: Rental no disponible o plazo de consulta agotado.
- INTERNAL: fallo interno.

## Alcance y pendientes

- La disponibilidad depende de las reservas que expone Rental.
  Su implementación inicial en memoria no incluye las reservas históricas
  de MySQL y pierde los datos al reiniciarse.
- La baja lógica no cancela reservas existentes.
- ActualizarEstado valida el valor del estado; no coordina por sí mismo
  el ciclo de reservas.
- La consulta de disponibilidad no garantiza exclusividad al reservar:
  Rental debe prevenir reservas simultáneas superpuestas.
- Falta integrar el servicio con el API Gateway y la ejecución conjunta
  del proyecto.
