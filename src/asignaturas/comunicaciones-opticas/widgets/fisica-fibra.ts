// Física de los widgets de la fibra (temas 1 a 5). Funciones puras, probadas con Vitest
// (tests/fisica-opticas.test.ts). Son modelos sencillos: dan el orden de magnitud, que es
// lo que se pide en el examen, no el valor exacto de una fibra concreta.

const GRAD = 180 / Math.PI;

/** Ángulo crítico entre núcleo (n1) y recubrimiento (n2), en grados y medido desde la normal: arcsen(n2/n1). */
export function anguloCritico(n1: number, n2: number): number {
  return Math.asin(Math.min(1, n2 / n1)) * GRAD;
}

/** Apertura numérica NA = √(n1² − n2²) = sen θmax, con θmax medido desde el eje de la fibra. */
export function aperturaNumerica(n1: number, n2: number): number {
  return Math.sqrt(Math.max(0, n1 * n1 - n2 * n2));
}

/** Ángulo de refracción (grados) por la ley de Snell, o null si hay reflexión total interna. */
export function snell(theta: number, n1: number, n2: number): number | null {
  const s = (n1 / n2) * Math.sin(theta / GRAD);
  return s >= 1 ? null : Math.asin(s) * GRAD;
}

/** Atenuación por esparcimiento Rayleigh (dB/km): proporcional a 1/λ⁴. */
export function rayleigh(nm: number): number {
  return 0.95 / (nm / 1000) ** 4;
}

/**
 * Atenuación total de una fibra de sílice (dB/km) a λ nm: Rayleigh + cola de absorción infrarroja
 * + pico del agua (OH⁻) en 1383 nm, que las fibras G.652.D casi eliminan (picoAgua = false).
 */
export function atenuacionFibra(nm: number, picoAgua = true): number {
  const infrarrojo = 7.81e11 * Math.exp(-48.48 / (nm / 1000));
  const agua = picoAgua ? 0.5 * Math.exp(-(((nm - 1383) / 16) ** 2) / 2) : 0;
  return rayleigh(nm) + infrarrojo + agua;
}

/** Parámetro de dispersión cromática D (ps/(nm·km)) a λ nm, para una fibra con dispersión nula en λ0 nm. */
export function dispersionD(nm: number, lambda0 = 1310, S0 = 0.092): number {
  return (S0 / 4) * (nm - lambda0 ** 4 / nm ** 3);
}

/** Ensanchamiento del pulso Δτ = D·L·Δλ, en ps (D en ps/(nm·km), L en km, Δλ en nm). */
export function ensanchamiento(D: number, km: number, anchoNm: number): number {
  return Math.abs(D) * km * anchoNm;
}

/**
 * Mezcla de cuatro ondas: productos fi + fj − fk (k distinto de i y de j) de canales en posiciones
 * enteras. Devuelve, para cada posición, cuántos productos caen en ella.
 */
export function productosFWM(canales: number[]): Map<number, number> {
  const cuenta = new Map<number, number>();
  canales.forEach((fi, i) => canales.forEach((fj, j) => {
    if (j < i) return; // fi + fj = fj + fi: cada pareja una sola vez
    canales.forEach((fk, k) => {
      if (k === i || k === j) return;
      const f = fi + fj - fk;
      cuenta.set(f, (cuenta.get(f) ?? 0) + 1);
    });
  }));
  return cuenta;
}

/** OTDR: tiempo (µs) que tarda en volver el eco de un evento a «km» km (ida y vuelta, v = c/n). */
export function retardoOtdr(km: number, n = 1.5): number {
  return ((2 * km * 1e3) / (3e8 / n)) * 1e6;
}
