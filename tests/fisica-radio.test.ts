// Física de los dibujos de Radiación: valores conocidos de cada fórmula
// (mismas constantes que la biblioteca de MATLAB: c = 3e8, RT = 6371 km, T0 = 290 K).
import { describe, expect, test } from 'vitest';
import {
  lbf, prx, flecha, horizonte, k999, radioFresnel, nu, jNu, phiMin_mrad, ladDosRayos,
  gDesapuntado, fq, qDeFM, xpdLluvia, uEquipos, tPasiva, tCadena, umbral_dBm,
} from '../src/asignaturas/radiacion-radiocomunicacion/widgets/fisica-radio';

describe('tema 1: propagación', () => {
  test('Lbf de 1 km a 1 GHz ≈ 92,4 dB', () => {
    expect(lbf(1000, 1e9)).toBeCloseTo(92.44, 2);
  });
  test('Friis: Prx = PIRE − Lb + Gr − Lr', () => {
    expect(prx(63, 142, 35, 2)).toBe(-46);
  });
  test('flecha a mitad de un vano de 50 km con K = 4/3', () => {
    expect(flecha(25e3, 25e3, 4 / 3)).toBeCloseTo(36.79, 1);
  });
  test('horizonte radioeléctrico de un mástil de 100 m con K = 4/3', () => {
    expect(horizonte(100, 4 / 3) / 1000).toBeCloseTo(41.2, 1);
  });
  test('K superado el 99,9 % del tiempo en 50 km', () => {
    expect(k999(50)).toBeCloseTo(0.795, 3);
  });
  test('R1 en el centro de 10 km a 1 GHz', () => {
    expect(radioFresnel(5e3, 5e3, 1e9)).toBeCloseTo(27.39, 2);
  });
  test('ν = √2·c/R1', () => {
    expect(nu(10, 10 * Math.SQRT2)).toBeCloseTo(1, 10);
  });
  test('J(ν): 6 dB con despejamiento nulo y 0 por debajo de −0,78', () => {
    expect(jNu(0)).toBeCloseTo(6.03, 2);
    expect(jNu(-0.78)).toBe(0);
    expect(jNu(-2)).toBe(0);
  });
  test('ángulo rasante mínimo a 10 GHz', () => {
    expect(phiMin_mrad(10000)).toBeCloseTo(0.814, 3);
  });
  test('dos rayos: Δl = λ/2 suma (−6 dB) y Δl = λ anula (tope de 40 dB)', () => {
    expect(ladDosRayos(-1, 0.015, 1e10)).toBeCloseTo(-6.02, 2);
    expect(ladDosRayos(-1, 0.03, 1e10)).toBe(40);
  });
});

describe('tema 2: antenas', () => {
  test('desapuntar θ3dB/2 cuesta 3 dB', () => {
    expect(gDesapuntado(40, 2, 1)).toBeCloseTo(37, 6);
  });
});

describe('tema 3: lluvia y disponibilidad', () => {
  test('Fq(0,01 %) = F0,01', () => {
    expect(fq(30, 0.01, 8) / 30).toBeCloseTo(1, 2);
  });
  test('qDeFM deshace fq', () => {
    expect(qDeFM(fq(30, 0.1, 15), 30, 15)).toBeCloseTo(0.1, 4);
  });
  test('qDeFM y fq son finitos en todo el rango de los dibujos', () => {
    for (let fm = 1; fm <= 60; fm++) expect(Number.isFinite(qDeFM(fm, 30, 15)), `FM = ${fm}`).toBe(true);
    for (const q of [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1]) expect(Number.isFinite(fq(30, q, 15)), `q = ${q}`).toBe(true);
  });
  test('XPD por lluvia a 15 GHz con Fq = 10 dB', () => {
    expect(xpdLluvia(15, 10)).toBeCloseTo(28.87, 1);
  });
  test('indisponibilidad de dos equipos en serie', () => {
    expect(uEquipos([1e5, 1e5], 4)).toBeCloseTo(0.0080, 4);
  });
});

describe('tema 4: ruido', () => {
  test('Teq de un pasivo de 3 dB a 290 K', () => {
    expect(tPasiva(3)).toBeCloseTo(288.6, 1);
  });
  test('Friis de ruido: el cable antes del LNA cuesta mucho más', () => {
    expect(tCadena([tPasiva(3), 100], [-3, 30])).toBeCloseTo(488.2, 0);
    expect(tCadena([100, tPasiva(3)], [30, -3])).toBeCloseTo(100.29, 2);
  });
  test('umbral con T = 290 K, 1 Mbit/s y Eb/N0 = 10 dB', () => {
    expect(umbral_dBm(290, 1e6, 10, 0)).toBeCloseTo(-103.98, 2);
  });
});
