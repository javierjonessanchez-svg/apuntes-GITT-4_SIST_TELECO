// Calculadora de baudios de la UART del LPC1768 (UM10360, cap. 14):
//   V = F_PCLK / (16·(256·DLM + DLL)·(1 + DivAddVal/MulVal))
// DLM:DLL es el divisor de 16 bits; U0FDR guarda el fraccionario (DivAddVal en los bits 3:0
// y MulVal en los 7:4). El manual pide 1 ≤ MulVal ≤ 15, DivAddVal < MulVal y, con
// fraccionario (DivAddVal > 0), un divisor de al menos 3.
import type { Paso } from '../../../widgets/desarrollo';
import { fmt } from '../../../widgets/numeros';

export type Baudios = { dlm: number; dll: number; divAddVal: number; mulVal: number; real: number; error: number };

const velocidad = (fpclk: number, dl: number, d: number, m: number) => fpclk / (16 * dl * (1 + d / m));

/** Por qué no hay combinación válida: divisor demasiado pequeño (V muy alta) o demasiado grande (V muy baja). */
export const textoImposible = (dlEst: number) => dlEst > 0xFFFF
  ? 'El divisor pasa de 65535 (16 bits entre DLM y DLL): esta velocidad es demasiado baja para este F_PCLK.'
  : 'El divisor sale menor que 1: esta velocidad es demasiado alta para este F_PCLK.';

/** La combinación con menor error; a igualdad, sin fraccionario. null si no hay ninguna válida. */
export function calcularBaudios(fpclk: number, baudios: number): Baudios | null {
  let mejor: Baudios | null = null;
  for (let m = 1; m <= 15; m++) {
    for (let d = 0; d < m; d++) {
      const dl = Math.round(fpclk / (16 * baudios * (1 + d / m)));
      if (dl < (d > 0 ? 3 : 1) || dl > 0xFFFF) continue;
      const real = velocidad(fpclk, dl, d, m);
      const error = (real - baudios) / baudios;
      if (!mejor || Math.abs(error) < Math.abs(mejor.error) - 1e-12) {
        mejor = { dlm: dl >> 8, dll: dl & 0xFF, divAddVal: d, mulVal: m, real, error };
      }
    }
  }
  return mejor;
}

/** El desarrollo: divisor sin fraccionario, el fraccionario si mejora, y el error final. */
export function pasosBaudios(fpclk: number, baudios: number): Paso[] {
  const r = calcularBaudios(fpclk, baudios);
  const est = fpclk / (16 * baudios);
  const pasos: Paso[] = [
    { texto: 'Divisor sin fraccionario (DivAddVal = 0):', formula: `DL_{est} = \\frac{F_{PCLK}}{16\\cdot V} = \\frac{${fmt(fpclk / 1e6, 4)}\\,\\text{MHz}}{16\\cdot ${baudios}} = ${fmt(est, 3)}` },
  ];
  if (!r) {
    pasos.push({ texto: textoImposible(est) });
    return pasos;
  }
  const dl = 256 * r.dlm + r.dll;
  if (r.divAddVal > 0) {
    pasos.push({ texto: `Redondear DL_est da demasiado error, así que se usa el fraccionario. Con DivAddVal = ${r.divAddVal} y MulVal = ${r.mulVal}:`, formula: `FR = 1 + \\frac{${r.divAddVal}}{${r.mulVal}} = ${fmt(1 + r.divAddVal / r.mulVal, 4)} \\quad DL = \\frac{F_{PCLK}}{16\\cdot V\\cdot FR} \\approx ${dl}` });
  } else {
    pasos.push({ texto: 'Se redondea al entero más cercano:', formula: `DL = ${dl}` });
  }
  pasos.push({ texto: 'Se reparte en dos registros de 8 bits:', formula: `DLM = \\lfloor DL/256 \\rfloor = ${r.dlm} \\quad DLL = DL \\bmod 256 = ${r.dll}` });
  const fr = r.divAddVal > 0 ? `\\cdot ${fmt(1 + r.divAddVal / r.mulVal, 4)}` : ''; // sin fraccionario, FR = 1
  pasos.push({ texto: `Velocidad real y error (${fmt(r.error * 100, 3)} %):`, formula: `V_{real} = \\frac{F_{PCLK}}{16\\cdot ${dl}${fr}} = ${fmt(r.real, 1)}\\ \\text{bit/s}` });
  return pasos;
}
