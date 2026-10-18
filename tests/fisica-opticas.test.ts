// Física de los widgets de Ópticas: valores de los apuntes y comportamiento (qué sube, qué baja).
import { describe, expect, test } from 'vitest';
import {
  acoploLambert, canalesCWDM, canalesDWDM, curvaFP, derivaLambda, detecta, estadoCanal, finezaMedida,
  lambdaDeGHz, lambdaPozo, picosModos, potenciaPI, retrasoEncendido, sumaFasores, umbral,
} from '../src/asignaturas/comunicaciones-opticas/widgets/fisica';

describe('emisores', () => {
  test('el LED acopla ≈ 1 % en una fibra de AN 0,1', () => {
    expect(acoploLambert(0.1)).toBeCloseTo(0.01, 10);
    expect(acoploLambert(2)).toBe(1);
  });
  test('fases iguales suman 1; opuestas, 0', () => {
    expect(sumaFasores([0, 0, 0])).toBeCloseTo(1, 10);
    expect(sumaFasores([0, Math.PI])).toBeCloseTo(0, 10);
    expect(sumaFasores([])).toBe(0);
  });
  test('Fabry-Pérot: más reflectividad, picos más finos', () => {
    expect(finezaMedida(curvaFP(0.9, 1, 600))).toBeGreaterThan(finezaMedida(curvaFP(0.5, 1, 600)));
    expect(finezaMedida(curvaFP(0.9, 1, 600))).toBeGreaterThan(finezaMedida(curvaFP(0.9, 0, 600)));
  });
  test('el umbral sube con la temperatura', () => {
    expect(umbral(20)).toBeCloseTo(10, 10);
    expect(umbral(50)).toBeGreaterThan(umbral(20));
  });
  test('la curva P-I es continua en el umbral y más pendiente por encima', () => {
    expect(potenciaPI(10 - 1e-9, 10)).toBeCloseTo(potenciaPI(10, 10), 6);
    expect(potenciaPI(20, 10) - potenciaPI(19, 10)).toBeGreaterThan(potenciaPI(5, 10) - potenciaPI(4, 10));
  });
  test('retardo de encendido: nulo si se polariza por encima del umbral; infinito si no se supera', () => {
    expect(retrasoEncendido(20, 12, 10)).toBe(0);
    expect(retrasoEncendido(9, 0, 10)).toBe(Infinity);
    expect(retrasoEncendido(20, 0, 10)).toBeGreaterThan(0);
  });
  test('un pozo más estrecho emite a λ más corta', () => {
    expect(lambdaPozo(5)).toBeLessThan(lambdaPozo(10));
  });
  test('modos: el FP tiene varios; DBR y DFB, uno', () => {
    expect(picosModos('FP').length).toBeGreaterThan(1);
    expect(picosModos('DFB')).toHaveLength(1);
    expect(picosModos('DBR')).toHaveLength(1);
  });
});

describe('WDM', () => {
  test('100 GHz a 1550 nm son ≈ 0,8 nm', () => {
    expect(lambdaDeGHz(100, 1550)).toBeCloseTo(0.8, 2);
  });
  test('CWDM: 18 canales de 1271 a 1611 nm cada 20 nm', () => {
    const c = canalesCWDM();
    expect(c).toHaveLength(18);
    expect(c[0]).toBe(1271);
    expect(c[17]).toBe(1611);
  });
  test('DWDM: canales crecientes separados ≈ 0,8 nm alrededor de 1550 nm', () => {
    const c = canalesDWDM(1550, 100, 8);
    expect(c).toHaveLength(8);
    for (let i = 1; i < c.length; i++) expect(c[i] - c[i - 1]).toBeCloseTo(0.8, 1);
    expect(c[0]).toBeLessThan(1550);
    expect(c[7]).toBeGreaterThan(1550);
  });
  test('deriva térmica y choque con el canal vecino', () => {
    expect(derivaLambda(10)).toBeCloseTo(1, 10);
    expect(estadoCanal(0.1)).toBe('ok');
    expect(estadoCanal(0.3)).toBe('peligro');
    expect(estadoCanal(-0.5)).toBe('choque');
  });
});

describe('detectores', () => {
  test('el silicio solo ve la 1.ª ventana; Ge e InGaAs, las tres (gráfica de T31)', () => {
    expect(detecta('Si', 850)).toBe(true);
    expect(detecta('Si', 1310)).toBe(false);
    for (const nm of [1310, 1550]) {
      expect(detecta('Ge', nm)).toBe(true);
      expect(detecta('InGaAs', nm)).toBe(true);
    }
    expect(detecta('InGaAs', 1750)).toBe(false);
  });
});
