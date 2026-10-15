// Erlang B y C, dimensionado y los pasos que enseña la calculadora.
import { describe, expect, test } from 'vitest';
import { canalesPara, erlangB, erlangC, pasosDimensionado, pasosErlangB, pasosErlangC } from '../src/asignaturas/conmutacion/widgets/erlang';

describe('erlangB', () => {
  test('valores conocidos', () => {
    expect(erlangB(1, 1)).toBe(0.5);
    expect(Math.abs(erlangB(10, 5) - 0.018385)).toBeLessThan(1e-5);
  });
  test('estable con muchos canales', () => {
    const b = erlangB(400, 380);
    expect(Number.isFinite(b)).toBe(true);
    expect(b).toBeGreaterThan(0);
    expect(b).toBeLessThan(1);
  });
});

describe('erlangC', () => {
  test('valores conocidos', () => {
    expect(Math.abs(erlangC(2, 1) - 1 / 3)).toBeLessThan(1e-12);
  });
  test('con A ≥ N toda llamada espera', () => {
    expect(erlangC(5, 5)).toBe(1);
    expect(erlangC(5, 7)).toBe(1);
  });
});

describe('canalesPara', () => {
  test('el menor N con bloqueo por debajo del objetivo', () => {
    expect(canalesPara(5, 0.02)).toBe(10);
  });
});

describe('pasosErlangB', () => {
  test('termina con el resultado y usa coma decimal', () => {
    const pasos = pasosErlangB(10, 5);
    expect(pasos.length).toBeGreaterThan(2);
    expect(pasos.at(-1)!.texto).toContain('0,0184');
  });
  test('con muchos canales no lista todos los pasos', () => {
    expect(pasosErlangB(400, 380).length).toBeLessThan(15);
  });
});

describe('pasosErlangC', () => {
  test('da la probabilidad de espera y, con la duración media, el retardo', () => {
    const pasos = pasosErlangC(2, 1, 3);
    expect(pasos.at(-2)!.texto).toContain('0,3333');
    // E[W] = (1/μ)·C/(N − A) = 3 · (1/3) / 1 = 1
    expect(pasos.at(-1)!.texto).toContain('1 min');
  });
});

describe('pasosDimensionado', () => {
  test('usuarios × tráfico por usuario → canales para el bloqueo objetivo', () => {
    // 250 usuarios × 20 mE = 5 E; al 2 % hacen falta 10 canales (B = 0,0184)
    const pasos = pasosDimensionado(250, 20, 2);
    expect(pasos[0].texto).toContain('5 E');
    expect(pasos.at(-1)!.texto).toContain('10 canales');
    expect(pasos.at(-1)!.texto).toContain('1,84 %');
  });
});
