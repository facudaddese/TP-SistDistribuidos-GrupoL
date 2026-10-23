## 🚀 Objetivo
Implementación de la infraestructura core de RabbitMQ y definición de la topología de eventos (Exchange y Routing Keys) para la comunicación asíncrona entre el backend principal y los microservicios satélites.

## 🗺️ Mapa de Topología y Enrutamiento

**Exchange principal:** `rentar.topic.exchange` (Tipo: Topic)

### 🚓 Flujo 1: Verificación Policial
| Routing Key | Productor | Consumidor | Cola Sugerida | Descripción del Evento |
|---|---|---|---|---|
| `vehiculos.verificacion.solicitada` | Backend Rentar | Serv. Policial | `q.policial.verificacion-solicitada` | Se emite tras registrar un vehículo. Solicita chequear denuncia de robo. |
| `vehiculos.verificacion.resultado` | Serv. Policial | Backend Rentar | `q.rentar.verificacion-resultado` | Devuelve veredicto (VALIDADO o ROBADO). Rentar inhabilita el vehículo si es robado. |

### 🤝 Flujo 2: Vehículos Externos
| Routing Key | Productor | Consumidor | Cola Sugerida | Descripción del Evento |
|---|---|---|---|---|
| `vehiculos.externos.registrados` | Backend Rentar | Validadores | `q.externos.validador-patente` <br> `q.externos.validador-titularidad` | Solicitud de incorporación (PENDIENTE). Dos colas la consumen en paralelo (Pub/Sub). |
| `vehiculos.externos.validacion.patente` | Validador Patente | Orquestador | `q.rentar.externos-val-patente` | Informa si la patente está limpia (VALIDADO o RECHAZADO). |
| `vehiculos.externos.validacion.titularidad` | Validador Titularidad | Orquestador | `q.rentar.externos-val-titularidad` | Informa si el cliente es titular real (VALIDADO o RECHAZADO). |
| `vehiculos.externos.validacion.completada` | Orquestador | Servicio Flota | `q.rentar.externos-completada` | Ambas validaciones exitosas. El vehículo pasa a DISPONIBLE. |

### 🛠️ Flujo 3: Mantenimiento
| Routing Key | Productor | Consumidor | Cola Sugerida | Descripción del Evento |
|---|---|---|---|---|
| `reserva.confirmada` | Backend Rentar | Serv. Mantenimiento | `q.mantenimiento.reserva-confirmada` | Reserva confirmada. Mantenimiento se agenda de forma asíncrona sin bloquear. |
| `mantenimiento.resultado` | Serv. Mantenimiento | Backend Rentar | `q.rentar.mantenimiento-resultado` | Informa si el mantenimiento fue REALIZADO o NO_REALIZADO y se asocia a la reserva. |
