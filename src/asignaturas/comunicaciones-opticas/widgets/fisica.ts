// Física de los widgets de Ópticas. Funciones puras: no tocan el DOM y se prueban
// con Vitest (tests/fisica-opticas.test.ts). Los widgets enseñan el comportamiento;
// estos modelos hacen que ese comportamiento sea fiel.
import { nmDeEv } from '../../../widgets/espectro';

/** Fracción de la luz de un emisor lambertiano (LED) que entra en una fibra de apertura numérica an: AN². */
export function acoploLambert(an: number): number {
  return Math.min(1, Math.max(0, an * an));
}

/** Módulo de la suma de fasores unitarios con esas fases, dividido entre su número (1 = todos en fase). */
export function sumaFasores(fases: number[]): number {
  if (!fases.length) return 0;
  let re = 0, im = 0;
  for (const f of fases) { re += Math.cos(f); im += Math.sin(f); }
  return Math.hypot(re, im) / fases.length;
}

/**
 * Transmisión de un Fabry-Pérot a lo largo de un rango espectral libre (n muestras, pico en el centro).
 * Airy: T = 1/(1 + F·sen²φ) con F = 4R/(1−R)². Un mal alineamiento (0 = malo, 1 = perfecto)
 * ensancha los picos con una gaussiana.
 */
export function curvaFP(R: number, alineamiento: number, n: number): number[] {
  const F = 4 * R / ((1 - R) * (1 - R));
  const airy: number[] = [];
  for (let i = 0; i < n; i++) {
    const fi = -Math.PI / 2 + Math.PI * i / n;
    airy.push(1 / (1 + F * Math.sin(fi) ** 2));
  }
  const anchoRel = 1 / (2 + 98 * Math.min(1, Math.max(0, alineamiento)));
  const sigma = Math.max(0.5, anchoRel * n / 2.3548);
  const radio = Math.min(Math.floor(4 * sigma), (n >> 1) - 1);
  const nucleo: number[] = [];
  let suma = 0;
  for (let k = -radio; k <= radio; k++) { const v = Math.exp(-k * k / (2 * sigma * sigma)); nucleo.push(v); suma += v; }
  return airy.map((_, i) => {
    let s = 0;
    for (let k = -radio; k <= radio; k++) s += airy[(i + k + n) % n] * nucleo[k + radio];
    return s / suma;
  });
}

/** Anchura a media altura del pico principal, como fracción del rango espectral libre. */
export function anchoPico(curva: number[]): number {
  const n = curva.length;
  let imax = 0;
  for (let i = 1; i < n; i++) if (curva[i] > curva[imax]) imax = i;
  const mitad = curva[imax] / 2;
  let cuenta = 1;
  for (let k = 1; k < n && curva[(imax + k) % n] >= mitad; k++) cuenta++;
  for (let k = 1; k < n && curva[(imax - k + n) % n] >= mitad; k++) cuenta++;
  return Math.min(1, cuenta / n);
}

/** Fineza = rango espectral libre / anchura a media altura. */
export function finezaMedida(curva: number[]): number {
  return 1 / anchoPico(curva);
}

/** Corriente umbral (mA) a Tc °C: crece exponencialmente con la temperatura (I0 a 20 °C). */
export function umbral(Tc: number, I0 = 10, T0 = 60): number {
  return I0 * Math.exp((Tc - 20) / T0);
}

/** Potencia óptica (u. a.): por debajo del umbral, emisión espontánea (como un LED); por encima, estimulada. */
export function potenciaPI(I: number, Ith: number, eta = 0.3, eps = 0.01): number {
  return I < Ith ? eps * I : eps * Ith + eta * (I - Ith);
}

/** Retardo de encendido (ns) al pasar de la polarización Ib a la corriente I: τ·ln((I−Ib)/(I−Ith)). */
export function retrasoEncendido(I: number, Ib: number, Ith: number, tau = 2): number {
  if (Ib >= Ith) return 0;
  if (I <= Ith) return Infinity;
  return tau * Math.log((I - Ib) / (I - Ith));
}

/** Deriva de λ (nm) para un cambio de temperatura dT (DFB típico: 0,1 nm/°C). */
export function derivaLambda(dT: number, coef = 0.1): number {
  return coef * dT;
}

/** Estado de un canal corrido dl nm en una rejilla con separación sep nm. */
export function estadoCanal(dl: number, sep = 0.8): 'ok' | 'peligro' | 'choque' {
  const d = Math.abs(dl);
  if (d <= sep / 4 + 1e-9) return 'ok';
  if (d <= sep / 2 + 1e-9) return 'peligro';
  return 'choque';
}

/** Separación en nm que equivale a ghz GHz a la longitud de onda dada: λ²·Δf/c. */
export function lambdaDeGHz(ghz: number, lambdaNm: number): number {
  return lambdaNm * lambdaNm * ghz / 2.99792458e8;
}

/** Plan CWDM: 18 canales de 1271 a 1611 nm cada 20 nm. */
export function canalesCWDM(): number[] {
  return Array.from({ length: 18 }, (_, i) => 1271 + 20 * i);
}

/** n canales DWDM centrados en «centro» nm y separados sepGHz. */
export function canalesDWDM(centro = 1550, sepGHz = 100, n = 8): number[] {
  const paso = lambdaDeGHz(sepGHz, centro);
  return Array.from({ length: n }, (_, i) => centro + (i - (n - 1) / 2) * paso);
}

/**
 * λ (nm) de un pozo cuántico de ancho anchoNm sobre un material de gap egEv. Pozo infinito: la energía
 * de confinamiento (electrón + hueco) crece como 1/ancho² (6,35 eV·nm² para GaAs).
 */
export function lambdaPozo(anchoNm: number, egEv = 1.42): number {
  return nmDeEv(egEv + 6.35 / (anchoNm * anchoNm));
}

/** Posición relativa (nm) de los modos longitudinales según el tipo de láser. */
export function picosModos(tipo: 'FP' | 'DBR' | 'DFB'): number[] {
  return tipo === 'FP' ? [-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3] : [0];
}

/** Gap (eV) de los materiales de los fotodetectores: su λ de corte es nmDeEv(gap). */
export const GAP_DETECTOR = { Si: 1.12, Ge: 0.67, InGaAs: 0.75 } as const;

/** Banda de ganancia del EDFA (nm): «solo en la banda de 1550 nm, unos 50 nm de ancho» (apuntes). */
export const BANDA_EDFA = { desde: 1525, hasta: 1575 } as const;
