// Calculadora de Timer de SEDA: MR0 (y PR si hace falta) a partir del periodo y de F_PCLK.
import { describe, expect, test } from 'vitest';
import { calcularTimer, pasosTimer } from '../src/asignaturas/seda/widgets/timer';

describe('calcularTimer', () => {
  test('1 ms a 25 MHz: PR = 0 y MR0 = 24 999', () => {
    expect(calcularTimer(25e6, 1e-3)).toEqual({ pr: 0, mr0: 24999, tReal: 1e-3 });
  });
  test('si MR0 no cabe en 32 bits, usa el prescaler', () => {
    const r = calcularTimer(25e6, 200); // 5·10⁹ cuentas
    expect(r.pr).toBe(1);
    expect(r.mr0).toBe(2_499_999_999);
    expect(r.mr0).toBeLessThanOrEqual(0xFFFFFFFF);
  });
  test('redondea al número entero de cuentas más cercano', () => {
    expect(calcularTimer(25e6, 1 / 3000).mr0).toBe(8332); // 8333,3 cuentas
  });
  test('con un periodo menor que un tic, los pasos usan N = 1 como el cálculo', () => {
    expect(pasosTimer(25e6, 1e-8)[0].formula).toMatch(/= 1$/); // 0,25 cuentas → 1
  });
  test('los pasos acaban en el valor de MR0', () => {
    const pasos = pasosTimer(25e6, 1e-3);
    expect(pasos.length).toBeGreaterThan(0);
    expect(pasos.at(-1)!.formula).toContain('24999');
  });
});
