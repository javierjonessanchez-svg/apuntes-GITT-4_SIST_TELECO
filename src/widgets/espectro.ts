// Regla de longitudes de onda (nm): dónde cae cada λ en la barra y de qué color
// se pinta. La usan la portada de Ópticas y los widgets que dibujan espectros.

/** Las tres ventanas de transmisión de la fibra. */
export const VENTANAS = [850, 1310, 1550] as const;

/** Color del infrarrojo en la regla: no se ve, así que va en gris violáceo. */
export const GRIS_IR = '#5B5470';

/** Posición de λ en una regla de «desde» a «hasta» nm, de 0 a 1 (fuera de la regla, en el borde). */
export function posicion(nm: number, desde = 380, hasta = 1700): number {
  if (!Number.isFinite(nm)) return 0;
  return Math.min(1, Math.max(0, (nm - desde) / (hasta - desde)));
}

/** Longitud de onda (nm) que emite un salto de energía de eV electronvoltios: λ = hc/Eg. */
export function nmDeEv(eV: number): number {
  return 1239.84 / eV;
}

const hex = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');

/** Color aproximado de una λ visible (380–750 nm); por encima, el gris del infrarrojo. */
export function colorDe(nm: number): string {
  if (!(nm >= 380)) return '#6B3FA0';
  if (nm > 750) return GRIS_IR;
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else { r = 1; }
  // Los extremos del visible se ven más oscuros
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (750 - nm) / 50 : 1;
  return `#${hex(r * f)}${hex(g * f)}${hex(b * f)}`;
}

/** Paradas del degradado de la regla entre desde y hasta nm (offset de 0 a 1). */
export function paradas(desde = 380, hasta = 1700): { offset: number; color: string }[] {
  const visibles = [380, 420, 470, 510, 560, 600, 645, 700, 750].filter((nm) => nm >= desde && nm <= hasta);
  const lista = visibles.map((nm) => ({ offset: posicion(nm, desde, hasta), color: colorDe(nm) }));
  if (hasta > 750) lista.push({ offset: posicion(Math.max(800, desde), desde, hasta), color: GRIS_IR });
  if (lista.length === 0 || lista[lista.length - 1].offset < 1) lista.push({ offset: 1, color: colorDe(hasta) });
  return lista;
}
