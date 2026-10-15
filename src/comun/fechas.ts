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

/** Texto corto para una cuenta de días ya no negativa: "hoy", "mañana", "en 5 días". */
export function textoDias(n: number): string {
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  return `en ${n} días`;
}

/** Fecha local → 'AAAA-MM-DD'. */
export function isoDe(d: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Posición de una fecha entre inicio (0) y fin (1). Fuera del tramo da < 0 o > 1. */
export function fraccion(iso: string, inicio: string, fin: string): number {
  const total = diasHasta(fin, leerFecha(inicio));
  return total > 0 ? diasHasta(iso, leerFecha(inicio)) / total : 0;
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** '2026-10-19' → 'lun 19 oct'. */
export function fechaCorta(iso: string): string {
  const d = leerFecha(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** Pruebas de hoy a dentro de 7 días, por fecha. */
export function estaSemana<T extends { fecha: string }>(pruebas: T[], hoy: Date): T[] {
  return pruebas
    .filter((p) => { const n = diasHasta(p.fecha, hoy); return n >= 0 && n <= 7; })
    .sort((x, y) => x.fecha.localeCompare(y.fecha));
}

/** Fecha de hoy. En desarrollo se puede fingir otra con ?hoy=AAAA-MM-DD (para probar). */
export function hoyDe(busqueda: string, desarrollo: boolean): Date {
  const m = /[?&]hoy=(\d{4}-\d{2}-\d{2})/.exec(busqueda);
  return desarrollo && m ? leerFecha(m[1]) : new Date();
}

/** Como textoDias, pero una cuenta negativa dice "ya pasó". */
export function textoRelativo(n: number): string {
  return n < 0 ? 'ya pasó' : textoDias(n);
}

/** Mensaje de "Esta semana" cuando no hay pruebas en los próximos 7 días (null si las hay). */
export function mensajeSemana<T extends { fecha: string; nombre: string }>(pruebas: T[], hoy: Date): string | null {
  if (estaSemana(pruebas, hoy).length) return null;
  const siguiente = proximaPrueba(pruebas, hoy);
  return siguiente
    ? `Nada esta semana. La siguiente: ${siguiente.nombre}, ${textoDias(diasHasta(siguiente.fecha, hoy))}.`
    : 'Sin pruebas próximas.';
}
