import { consultarVehiculos } from "./vehiculoRepository";
import { consultarReservasConfirmadas } from "./rentalClient";
import { TIPOS_VEHICULO } from "./types";
import type {
    ConsultarDisponibilidadRequest,
    VehiculoResponse,
} from "./types";

export class ErrorValidacion extends Error {}

function parsearFecha(valor: string, campo: string): number {
    const patron =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/;

    const partes = patron.exec(valor ?? "");

    if (!partes) {
        throw new ErrorValidacion(`${campo} debe tener formato ISO-8601`);
    }

    const anio = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const hora = Number(partes[4]);
    const minuto = Number(partes[5]);
    const segundo = Number(partes[6]);

    const bisiesto =
        anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);

    const diasPorMes = [
        31, bisiesto ? 29 : 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31,
    ];

    if (
        anio < 1 ||
        mes < 1 ||
        mes > 12 ||
        dia < 1 ||
        dia > diasPorMes[mes - 1]! ||
        hora > 23 ||
        minuto > 59 ||
        segundo > 59
    ) {
        throw new ErrorValidacion(`${campo} contiene una fecha inválida`);
    }

    // Convención: las fechas sin zona se interpretan como UTC.
    const fecha = Date.parse(partes[7] ? valor : `${valor}Z`);

    if (!Number.isFinite(fecha)) {
        throw new ErrorValidacion(`${campo} contiene una fecha inválida`);
    }

    return fecha;
}

function precioEnCentavos(valor: string, campo: string): bigint {
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(valor)) {
        throw new ErrorValidacion(
            `${campo} debe ser un decimal no negativo con hasta 2 decimales`,
        );
    }

    const [entero, decimal = ""] = valor.split(".");

    return BigInt(entero!) * 100n + BigInt(decimal.padEnd(2, "0"));
}

export async function consultarDisponibilidad(
    request: ConsultarDisponibilidadRequest,
): Promise<VehiculoResponse[]> {
    const inicio = parsearFecha(request.fechaInicio, "fechaInicio");
    const fin = parsearFecha(request.fechaFin, "fechaFin");

    if (fin <= inicio) {
        throw new ErrorValidacion(
            "fechaFin debe ser posterior a fechaInicio",
        );
    }

    if (
        request.tipoVehiculo !== undefined &&
        !TIPOS_VEHICULO.some((tipo) => tipo === request.tipoVehiculo)
    ) {
        throw new ErrorValidacion("El tipo de vehículo es inválido");
    }

    const precioMin = request.precioMin === undefined
        ? undefined
        : precioEnCentavos(request.precioMin, "precioMin");

    const precioMax = request.precioMax === undefined
        ? undefined
        : precioEnCentavos(request.precioMax, "precioMax");

    if (
        precioMin !== undefined &&
        precioMax !== undefined &&
        precioMin > precioMax
    ) {
        throw new ErrorValidacion(
            "precioMin no puede ser mayor a precioMax",
        );
    }

    const marca = (request.marca ?? "").trim().toLowerCase();
    const modelo = (request.modelo ?? "").trim().toLowerCase();

    const vehiculos = await consultarVehiculos(true);
    const reservas = await consultarReservasConfirmadas();

    const bloqueados = new Set<string>();

    for (const reserva of reservas) {
        if (reserva.estado !== "CONFIRMADA") continue;

        let inicioReserva: number;
        let finReserva: number;

        try {
            inicioReserva = parsearFecha(
                reserva.fechaHoraInicio,
                "fechaHoraInicio",
            );

            finReserva = parsearFecha(
                reserva.fechaHoraFin,
                "fechaHoraFin",
            );

            if (finReserva <= inicioReserva) {
                throw new Error("Período de reserva inválido");
            }
        } catch {
            // Un dato inválido de Rental no debe generar falsa disponibilidad.
            throw new Error(
                `Rental devolvió fechas inválidas para la reserva ${reserva.id}`,
            );
        }

        if (inicio < finReserva && fin > inicioReserva) {
            bloqueados.add(String(reserva.vehiculoId));
        }
    }

    return vehiculos.filter((vehiculo) => {
        const precio = precioEnCentavos(
            vehiculo.precioDiario,
            "precioDiario",
        );

        return (
            !bloqueados.has(vehiculo.id) &&
            (
                request.tipoVehiculo === undefined ||
                vehiculo.tipoVehiculo === request.tipoVehiculo
            ) &&
            vehiculo.marca.toLowerCase().includes(marca) &&
            vehiculo.modelo.toLowerCase().includes(modelo) &&
            (precioMin === undefined || precio >= precioMin) &&
            (precioMax === undefined || precio <= precioMax)
        );
    });
}
