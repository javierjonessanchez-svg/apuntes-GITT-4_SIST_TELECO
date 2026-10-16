// Número de portadora (ARFCN) ↔ frecuencia en las bandas GSM que se usan en
// España: GSM 900 (P-GSM), su extensión E-GSM y DCS 1800. Portadoras cada 200 kHz.
import { fmt } from '../../../widgets/numeros';
import type { Paso } from '../../../widgets/desarrollo';

export type Banda = 'GSM 900' | 'E-GSM' | 'DCS 1800';
export type Portadora = { banda: Banda; subidaMHz: number; bajadaMHz: number };

/** Frecuencias de subida (MS → BTS) y bajada (BTS → MS) de una portadora, o null si no existe. */
export function arfcnAFrecuencia(n: number): Portadora | null {
  if (!Number.isInteger(n)) return null;
  // Se redondea a 0,1 kHz para quitar el ruido de coma flotante (890 + 0,2·1 = 890,2000…01)
  const p = (banda: Banda, subida: number, duplex: number): Portadora => {
    const s = Math.round(subida * 1e4) / 1e4;
    return { banda, subidaMHz: s, bajadaMHz: Math.round((s + duplex) * 1e4) / 1e4 };
  };
  if (n >= 1 && n <= 124) return p('GSM 900', 890 + 0.2 * n, 45);
  if (n === 0) return p('E-GSM', 890, 45);
  if (n >= 975 && n <= 1023) return p('E-GSM', 890 + 0.2 * (n - 1024), 45);
  if (n >= 512 && n <= 885) return p('DCS 1800', 1710.2 + 0.2 * (n - 512), 95);
  return null;
}

/** Todas las portadoras válidas, de menor a mayor número. */
export const ARFCNS = [...Array(1024).keys()].filter((n) => arfcnAFrecuencia(n) !== null);

/** La portadora que usa una frecuencia, y en qué sentido; null si no cae en la rejilla de ninguna banda. */
export function frecuenciaAArfcn(mhz: number): { arfcn: number; banda: Banda; sentido: 'subida' | 'bajada' } | null {
  for (const n of ARFCNS) {
    const p = arfcnAFrecuencia(n)!;
    if (Math.abs(p.subidaMHz - mhz) < 1e-6) return { arfcn: n, banda: p.banda, sentido: 'subida' };
    if (Math.abs(p.bajadaMHz - mhz) < 1e-6) return { arfcn: n, banda: p.banda, sentido: 'bajada' };
  }
  return null;
}

const tex = (n: number) => fmt(n, 1).replace(/\./g, '').replace(',', '{,}');

/** Desarrollo de la conversión ARFCN → frecuencias, para la calculadora. */
export function pasosArfcn(n: number): Paso[] {
  const p = arfcnAFrecuencia(n);
  if (!p) return [{ texto: `El ${n} no es una portadora de GSM 900, E-GSM ni DCS 1800.` }];
  const [base, desde, duplex] =
    p.banda === 'DCS 1800' ? ['1710{,}2', '(n - 512)', 95] : n >= 975 ? ['890', '(n - 1024)', 45] : ['890', 'n', 45];
  return [
    { texto: `El ${n} cae en la banda **${p.banda}**: portadoras cada 200 kHz y separación dúplex de ${duplex} MHz.` },
    { texto: 'Subida (del móvil a la BTS):', formula: `f_\\uparrow = ${base} + 0{,}2\\cdot${desde.replace('n', String(n))} = ${tex(p.subidaMHz)}\\ \\text{MHz}` },
    { texto: 'Bajada (de la BTS al móvil), la subida más la separación dúplex:', formula: `f_\\downarrow = ${tex(p.subidaMHz)} + ${duplex} = ${tex(p.bajadaMHz)}\\ \\text{MHz}` },
  ];
}
