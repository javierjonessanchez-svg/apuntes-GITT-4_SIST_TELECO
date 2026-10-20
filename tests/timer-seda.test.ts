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
  test('con un periodo menor que un tic, avisa de que MR0 = 0 da T_real = 1/F_PCLK', () => {
    const pasos = pasosTimer(25e6, 1e-8);
    const aviso = pasos.find((p) => /menor que un tic/.test(p.texto));
    expect(aviso).toBeDefined();
    expect(aviso!.formula).toContain('MR0 = 0');
    expect(pasos.at(-1)!.formula).toContain('MR0 = N - 1 = 0');
  });
  test('con un periodo de al menos un tic no hay aviso', () => {
    expect(pasosTimer(25e6, 1e-3).some((p) => /menor que un tic/.test(p.texto))).toBe(false);
    expect(pasosTimer(25e6, 4e-8).some((p) => /menor que un tic/.test(p.texto))).toBe(false); // justo 1 tic
  });
  test('los pasos acaban en el valor de MR0', () => {
    const pasos = pasosTimer(25e6, 1e-3);
    expect(pasos.length).toBeGreaterThan(0);
    expect(pasos.at(-1)!.formula).toContain('24999');
  });
});
