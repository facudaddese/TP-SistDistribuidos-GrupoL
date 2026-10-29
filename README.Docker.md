# Ejecutar RENTAR con Docker

## Requisitos

- Docker Desktop iniciado y configurado para contenedores Linux.
- Docker Compose v2 o posterior.
- Internet para la primera construcción.
- Puertos 5173, 8080, 50051, 50052, 50053 y 15672 disponibles.

No requiere instalar Java, Maven, Node ni MySQL en el equipo.

## Inicio

Desde la raíz del repositorio:

```bash
docker compose up -d --build --wait
```

La primera ejecución descarga las imágenes, instala dependencias,
compila las aplicaciones y prepara la base de datos.

El archivo .env es opcional. Sin él se usan los valores de
demostración definidos en compose.yaml.

## Accesos

- Frontend: http://localhost:5173
- Swagger: http://localhost:8080/swagger-ui/index.html
- Salud del Gateway: http://localhost:8080/actuator/health
- RabbitMQ: http://localhost:15672

Usuarios de demostración:

- Administrador: admin@rentar.com / admin123
- Cliente: cliente@rentar.com / cliente123
- RabbitMQ: rentar_rabbit / rentar_rabbit_pass
  (salvo que se modifiquen mediante .env).

## Estado y diagnóstico

```bash
docker compose ps -a
docker compose logs --tail=80
```

## Detener

```bash
docker compose down
```

Este comando conserva los volúmenes de MySQL y RabbitMQ.
Rental Service mantiene sus reservas gRPC en memoria y las pierde
al reiniciarse.

## Pendiente funcional conocido

La confirmación de reserva del frontend intenta acceder a un objeto
vehiculo que no incluye la respuesta REST. Puede dejar la pantalla
en blanco aunque la reserva se haya creado. Su corrección se aborda
por separado.