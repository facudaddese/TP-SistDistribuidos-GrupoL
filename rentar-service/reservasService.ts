/**
 * Dominio y lógica de negocio de Rental Service.
 * Tipos estrictos sin @ts-nocheck ni any.
 */

export interface Reserva {
  id: number;
  clienteId: number;
  vehiculoId: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  importeTotal: number;
  estado: string;
}

/**
 * Parsea una cadena de fecha ISO-8601 a milisegundos desde epoch UTC.
 *
 * Si la cadena no contiene especificación de zona horaria (sin 'Z' ni offset '[+-]HH:mm'),
 * por convención se interpreta en UTC agregando 'Z'. Esto garantiza determinismo y evita
 * discrepancias derivadas de la zona horaria local del servidor Node.js al comparar fechas.
 *
 * Retorna NaN si la cadena no es válida o no cumple con el formato ISO-8601.
 */
export function parsearFechaIso(fechaStr: string): number {
  if (!fechaStr || typeof fechaStr !== "string") {
    return NaN;
  }
  const trimmed = fechaStr.trim();
  // Validar formato ISO-8601: YYYY-MM-DDTHH:mm:ss[.sss][Z|+-HH:mm]
  const isoRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?$/i;
  if (!isoRegex.test(trimmed)) {
    return NaN;
  }

  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const normalizada = tieneZona ? trimmed : `${trimmed}Z`;
  const ms = Date.parse(normalizada);
  return Number.isFinite(ms) ? ms : NaN;
}

/**
 * Valida que un intervalo de fechas sea válido:
 * - Ambas fechas son ISO-8601 válidas.
 * - fechaFin es estrictamente posterior a fechaInicio.
 */
export function validarRangoFechas(
  fechaInicioStr: string,
  fechaFinStr: string,
): { esValido: boolean; inicioMs: number; finMs: number } {
  const inicioMs = parsearFechaIso(fechaInicioStr);
  const finMs = parsearFechaIso(fechaFinStr);

  if (Number.isNaN(inicioMs) || Number.isNaN(finMs) || finMs <= inicioMs) {
    return { esValido: false, inicioMs: NaN, finMs: NaN };
  }

  return { esValido: true, inicioMs, finMs };
}

/**
 * Función pura de superposición entre dos períodos:
 * Dos períodos se superponen si y solo si inicioA < finB Y finA > inicioB.
 *
 * Regla estricta: Los períodos contiguos (ej. finA === inicioB o inicioA === finB)
 * NO se superponen.
 */
export function periodosSeSuperponen(
  inicioA: number,
  finA: number,
  inicioB: number,
  finB: number,
): boolean {
  return inicioA < finB && finA > inicioB;
}

/**
 * Obtiene los IDs únicos de vehículos que posean reservas en estado "CONFIRMADA"
 * superpuestas con el período especificado [inicioMs, finMs].
 * Las reservas con estado "CANCELADA" u otro estado no bloquean.
 */
export function obtenerVehiculosOcupados(
  reservas: readonly Reserva[],
  inicioMs: number,
  finMs: number,
): number[] {
  const ocupados = new Set<number>();

  for (const reserva of reservas) {
    if (reserva.estado !== "CONFIRMADA") {
      continue;
    }

    const rInicio = parsearFechaIso(reserva.fechaHoraInicio);
    const rFin = parsearFechaIso(reserva.fechaHoraFin);

    if (Number.isNaN(rInicio) || Number.isNaN(rFin) || rFin <= rInicio) {
      continue;
    }

    if (periodosSeSuperponen(inicioMs, finMs, rInicio, rFin)) {
      ocupados.add(reserva.vehiculoId);
    }
  }

  return Array.from(ocupados);
}

/**
 * Verifica si un vehículo específico ya tiene una reserva "CONFIRMADA"
 * superpuesta en el período [inicioMs, finMs].
 */
export function vehiculoTieneSuperposicion(
  reservas: readonly Reserva[],
  vehiculoId: number,
  inicioMs: number,
  finMs: number,
): boolean {
  for (const reserva of reservas) {
    if (reserva.vehiculoId !== vehiculoId) {
      continue;
    }
    if (reserva.estado !== "CONFIRMADA") {
      continue;
    }

    const rInicio = parsearFechaIso(reserva.fechaHoraInicio);
    const rFin = parsearFechaIso(reserva.fechaHoraFin);

    if (Number.isNaN(rInicio) || Number.isNaN(rFin) || rFin <= rInicio) {
      continue;
    }

    if (periodosSeSuperponen(inicioMs, finMs, rInicio, rFin)) {
      return true;
    }
  }

  return false;
}
