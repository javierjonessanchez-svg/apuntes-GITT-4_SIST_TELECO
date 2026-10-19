// Física y dibujos de la fibra (temas 1 a 5): los números que se enseñan tienen que salir bien.
import { describe, expect, test } from 'vitest';
import {
  anguloCritico, aperturaNumerica, atenuacionFibra, dispersionD, ensanchamiento, productosFWM, retardoOtdr, snell,
} from '../src/asignaturas/comunicaciones-opticas/widgets/fisica-fibra';
import {
  dibujarAtenuacion, dibujarCurvaD, dibujarEnsanchamiento, dibujarEsparcimiento, dibujarFwm, dibujarOtdr, dibujarReflexion, dibujarTipos,
} from '../src/asignaturas/comunicaciones-opticas/widgets/dibujos-fibra';

describe('física de la fibra', () => {
  test('ángulo crítico: baja (desde la normal) si sube n1; la NA sube', () => {
    expect(anguloCritico(1.48, 1.44)).toBeCloseTo(76.6, 1);
    expect(anguloCritico(1.6, 1.44)).toBeLessThan(anguloCritico(1.48, 1.44));
    expect(aperturaNumerica(1.6, 1.44)).toBeGreaterThan(aperturaNumerica(1.48, 1.44));
  });
  test('Snell: por encima de θc no hay rayo refractado', () => {
    expect(snell(80, 1.48, 1.44)).toBeNull();
    expect(snell(30, 1.48, 1.44)).toBeCloseTo(30.9, 1);
  });
  test('atenuación: ≈ 0,2 dB/km en 1550, más en 1310 y mucho más en 850', () => {
    const a1550 = atenuacionFibra(1550);
    expect(a1550).toBeGreaterThan(0.15);
    expect(a1550).toBeLessThan(0.22);
    expect(atenuacionFibra(1310)).toBeGreaterThan(a1550);
    expect(atenuacionFibra(850)).toBeGreaterThan(1.5);
  });
  test('el pico del agua en 1383 nm desaparece en la G.652.D', () => {
    expect(atenuacionFibra(1383, true) - atenuacionFibra(1383, false)).toBeCloseTo(0.5, 2);
  });
  test('dispersión: cero en λ0; ≈ 17 ps/(nm·km) en 1550 para la fibra estándar', () => {
    expect(dispersionD(1310)).toBeCloseTo(0, 6);
    expect(dispersionD(1550)).toBeCloseTo(17.5, 0);
    expect(dispersionD(1550, 1550)).toBeCloseTo(0, 6);
  });
  test('Δτ = D·L·Δλ', () => {
    expect(ensanchamiento(17, 10, 4)).toBe(680);
  });
  test('mezcla de cuatro ondas: 4 canales dan N²(N−1)/2 = 24 productos', () => {
    const total = [...productosFWM([0, 1, 2, 3]).values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(24);
  });
  test('OTDR: un evento a 10 km vuelve a los 100 µs', () => {
    expect(retardoOtdr(10)).toBeCloseTo(100, 6);
  });
});

describe('dibujos de la fibra', () => {
  test('reflexión total por encima de θc; refracción por debajo', () => {
    expect(dibujarReflexion({ angulo: 80, n1: 1.48 }).info).toContain('reflexión total');
    expect(dibujarReflexion({ angulo: 40, n1: 1.48 }).info).toContain('se refracta y sale');
  });
  test('tipos de fibra: modal en salto de índice, sin modal en monomodo', () => {
    expect(dibujarTipos({ tipo: 'salto' }).info).toContain('dispersión modal');
    expect(dibujarTipos({ tipo: 'monomodo' }).info).toContain('No hay dispersión modal');
  });
  test('atenuación: avisa del pico del agua y de la mínima atenuación', () => {
    expect(dibujarAtenuacion({ lambda: 1383, fibra: 'clasica' }).info).toContain('pico del agua');
    expect(dibujarAtenuacion({ lambda: 1383, fibra: 'g652d' }).info).not.toContain('pico del agua');
    expect(dibujarAtenuacion({ lambda: 1550, fibra: 'g652d' }).info).toContain('mínima atenuación');
  });
  test('ensanchamiento: el DFB aguanta; el LED pisa los bits', () => {
    expect(dibujarEnsanchamiento({ fuente: 'dfb', km: 50, gbps: 1 }).info).toContain('se distinguen');
    expect(dibujarEnsanchamiento({ fuente: 'led', km: 10, gbps: 1 }).info).toContain('interferencia entre símbolos');
    expect(dibujarEnsanchamiento({ fuente: 'fp', km: 10, gbps: 1 }).svg).toContain('680 ps');
  });
  test('curva D: la G.653 avisa de la mezcla de cuatro ondas', () => {
    expect(dibujarCurvaD({ fibra: 'g653' }).info).toContain('mezcla de cuatro ondas');
    expect(dibujarCurvaD({ fibra: 'g652' }).info).toContain('1310');
  });
  test('FWM: despreciable con poca potencia y D no nula', () => {
    expect(dibujarFwm({ potencia: 'alta', fibra: 'nula', sep: 'dwdm' }).info).toContain('24 productos');
    expect(dibujarFwm({ potencia: 'baja', fibra: 'nonula', sep: 'dwdm' }).info).toContain('despreciables');
  });
  test('esparcimiento: Raman amplifica, Brillouin filtra', () => {
    expect(dibujarEsparcimiento({ tipo: 'raman' }).info).toContain('amplificar');
    expect(dibujarEsparcimiento({ tipo: 'brillouin' }).info).toContain('filtros');
    expect(dibujarEsparcimiento({ tipo: 'rayleigh' }).svg).not.toContain('Stokes');
  });
  test('OTDR: tiempo de ida y vuelta y tipo de evento', () => {
    expect(dibujarOtdr({ evento: 'conector', km: 10 }).info).toContain('100 µs');
    expect(dibujarOtdr({ evento: 'fusion', km: 10 }).info).toContain('sin pico');
    expect(dibujarOtdr({ evento: 'rotura', km: 12 }).svg).not.toContain('fin de fibra');
  });
});
