// Fechas de las pruebas. Se trabaja siempre en hora local: new Date('2026-10-20')
// sería medianoche UTC, que en España puede caer en otro día.

const MS_DIA = 24 * 60 * 60 * 1000;

/** 'AAAA-MM-DD' → medianoche local de ese día. */
export function leerFecha(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Días enteros desde hoy (hora local) hasta la fecha. Negativo si ya pasó. */
export function diasHasta(iso: string, hoy: Date): number {
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  // Math.round absorbe la hora de más o de menos de los cambios de horario
  return Math.round((leerFecha(iso).getTime() - inicioHoy.getTime()) / MS_DIA);
}

/** La prueba más cercana de hoy en adelante, o null si todas han pasado. */
export function proximaPrueba<T extends { fecha: string }>(pruebas: T[], hoy: Date): T | null {
  const futuras = pruebas
    .filter((p) => diasHasta(p.fecha, hoy) >= 0)
    .sort((x, y) => x.fecha.localeCompare(y.fecha));
  return futuras[0] ?? null;
}
