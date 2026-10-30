# Contratos gRPC — API Gateway

Este directorio contiene las copias de los contratos de los microservicios del sistema Rentar, necesarias para que el Gateway pueda generar los stubs gRPC y comunicarse con cada servicio.

## Origen de los contratos

| Archivo | Servicio Dueño | Ruta de Origen |
|---|---|---|
| `customer.proto` | Customer Service | `customer-service/proto/customer.proto` |
| `vehicle.proto` | Vehicle Service | `vehicle-service/proto/vehicle.proto` |
| `rental.proto` | Rental Service | `rentar-service/proto/rental.proto` |

## Regla de Sincronización

Estas copias deben mantenerse sincronizadas; ante un cambio de contrato, se edita primero en el servicio dueño y se vuelve a copiar.
Las copias en este directorio no deben ser modificadas directamente ni contener diferencias respecto a los archivos originales de los microservicios.
