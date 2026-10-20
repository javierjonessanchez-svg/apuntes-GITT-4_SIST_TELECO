// Calculadora de baudios de SEDA: divisor (DLM, DLL) y fraccionario (DivAddVal, MulVal) de la UART.
import { describe, expect, test } from 'vitest';
import { calcularBaudios, pasosBaudios } from '../src/asignaturas/seda/widgets/uart';

describe('calcularBaudios', () => {
  test('115 200 bit/s a 25 MHz: error menor que el 1,1 %', () => {
    const r = calcularBaudios(25e6, 115200)!;
    expect(Math.abs(r.error)).toBeLessThan(0.011);
    expect(r.real).toBeCloseTo(25e6 / (16 * (256 * r.dlm + r.dll) * (1 + r.divAddVal / r.mulVal)), 6);
  });
  test('si el divisor sale exacto, sin fraccionario', () => {
    expect(calcularBaudios(25e6, 15625)).toMatchObject({ dll: 100, dlm: 0, divAddVal: 0, mulVal: 1, error: 0 });
  });
  test('divisores mayores que 255 van repartidos entre DLM y DLL', () => {
    const r = calcularBaudios(25e6, 1200)!; // 25e6/(16·1200) ≈ 1302
    expect(r.dlm).toBeGreaterThan(0);
    expect(r.dll).toBeLessThanOrEqual(255);
    expect(256 * r.dlm + r.dll).toBeGreaterThan(255);
  });
  test('respeta los límites del manual: MulVal 1–15, DivAddVal < MulVal y DLL ≥ 3 con fraccionario', () => {
    for (const baudios of [300, 9600, 57600, 115200, 230400, 460800]) {
      const r = calcularBaudios(25e6, baudios)!;
      expect(r.mulVal).toBeGreaterThanOrEqual(1);
      expect(r.mulVal).toBeLessThanOrEqual(15);
      expect(r.divAddVal).toBeLessThan(r.mulVal);
      if (r.divAddVal > 0) expect(256 * r.dlm + r.dll).toBeGreaterThanOrEqual(3);
    }
  });
  test('velocidad imposible: null', () => {
    expect(calcularBaudios(25e6, 25e6)).toBeNull();
  });
  test('velocidad demasiado baja: el divisor no cabe en 16 bits, y los pasos lo dicen', () => {
    expect(calcularBaudios(25e6, 10)).toBeNull(); // DL ≈ 156 250 > 65 535
    expect(pasosBaudios(25e6, 10).at(-1)!.texto).toMatch(/65\s?535/);
    expect(pasosBaudios(25e6, 25e6).at(-1)!.texto).toMatch(/menor que 1/);
  });
  test('sin fraccionario, la velocidad real no lleva el factor ·1', () => {
    expect(pasosBaudios(25e6, 15625).at(-1)!.formula).not.toMatch(/\\cdot 1\}/);
  });
  test('los pasos acaban en el error', () => {
    expect(pasosBaudios(25e6, 115200).at(-1)!.texto).toMatch(/error/i);
  });
});
