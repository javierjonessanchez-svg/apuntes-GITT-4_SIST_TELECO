// Calculadora de Timer del LPC1768: el TC cuenta a F_PCLK/(PR+1) y, al llegar a MR0,
// interrumpe y se reinicia (MR0I y MR0R en TnMCR). Por eso el periodo es
// T = (PR+1)·(MR0+1)/F_PCLK, y con PR = 0 queda MR0 = F_PCLK·T − 1.
import type { Paso } from '../../../widgets/desarrollo';
import { fmt } from '../../../widgets/numeros';

const MAX32 = 2 ** 32; // TC, PR y MR0 son registros de 32 bits

export type Timer = { pr: number; mr0: number; tReal: number };

/** PR y MR0 para un periodo t (s) con un reloj de periférico fpclk (Hz). */
export function calcularTimer(fpclk: number, t: number): Timer {
  const cuentas = Math.max(1, Math.round(fpclk * t));
  // El menor prescaler con el que MR0 cabe en 32 bits (casi siempre PR = 0)
  const pr = Math.ceil(cuentas / MAX32) - 1;
  const mr0 = Math.max(0, Math.round(cuentas / (pr + 1)) - 1);
  return { pr, mr0, tReal: ((pr + 1) * (mr0 + 1)) / fpclk };
}

/** El desarrollo que se escribe en el examen, paso a paso. */
export function pasosTimer(fpclk: number, t: number): Paso[] {
  const { pr, mr0, tReal } = calcularTimer(fpclk, t);
  const cuentas = Math.max(1, Math.round(fpclk * t)); // igual que en calcularTimer
  const pasos: Paso[] = [
    { texto: 'Cuentas del TC en un periodo:', formula: `N = F_{PCLK}\\cdot T = ${fmt(fpclk / 1e6, 4)}\\,\\text{MHz}\\cdot ${fmt(t * 1e3, 6)}\\,\\text{ms} = ${cuentas}` },
  ];
  if (pr > 0) {
    pasos.push({ texto: `N no cabe en 32 bits (máximo ${MAX32 - 1}): el prescaler divide el reloj.`, formula: `PR = \\lceil N/2^{32}\\rceil - 1 = ${pr}` });
  }
  if (Math.abs(tReal - t) > 1e-12 * Math.max(1, t)) {
    pasos.push({ texto: 'Al redondear, el periodo real queda en', formula: `T_{real} = \\frac{(PR+1)(MR0+1)}{F_{PCLK}} = ${fmt(tReal * 1e3, 6)}\\,\\text{ms}` });
  }
  pasos.push({ texto: 'El TC cuenta de 0 a MR0 (MR0 + 1 estados), así que:', formula: pr > 0 ? `MR0 = \\frac{N}{PR+1} - 1 = ${mr0}` : `MR0 = N - 1 = ${mr0}` });
  return pasos;
}
