// Widgets de «ver lo real» de Conmutación: ARFCN ↔ frecuencia y la red GSM clicable.
import { describe, expect, test } from 'vitest';
import { arfcnAFrecuencia, frecuenciaAArfcn, pasosArfcn } from '../src/asignaturas/conmutacion/widgets/bandas';
import { ENLACES, NODOS } from '../src/asignaturas/conmutacion/widgets/red';

const cerca = (r: ReturnType<typeof arfcnAFrecuencia>, banda: string, subida: number, bajada: number) => {
  expect(r).not.toBeNull();
  expect(r!.banda).toBe(banda);
  expect(r!.subidaMHz).toBeCloseTo(subida, 6);
  expect(r!.bajadaMHz).toBeCloseTo(bajada, 6);
};

describe('arfcnAFrecuencia', () => {
  test('GSM 900 (P-GSM, 1 a 124)', () => {
    cerca(arfcnAFrecuencia(1), 'GSM 900', 890.2, 935.2);
    cerca(arfcnAFrecuencia(124), 'GSM 900', 914.8, 959.8);
  });
  test('E-GSM (0 y 975 a 1023)', () => {
    cerca(arfcnAFrecuencia(0), 'E-GSM', 890, 935);
    cerca(arfcnAFrecuencia(975), 'E-GSM', 880.2, 925.2);
  });
  test('DCS 1800 (512 a 885)', () => {
    cerca(arfcnAFrecuencia(512), 'DCS 1800', 1710.2, 1805.2);
    cerca(arfcnAFrecuencia(885), 'DCS 1800', 1784.8, 1879.8);
  });
  test('fuera de las bandas: null', () => {
    expect(arfcnAFrecuencia(125)).toBeNull();
    expect(arfcnAFrecuencia(1.5)).toBeNull();
  });
});

describe('frecuenciaAArfcn', () => {
  test('subida y bajada de cada banda', () => {
    expect(frecuenciaAArfcn(935.2)).toEqual({ arfcn: 1, banda: 'GSM 900', sentido: 'bajada' });
    expect(frecuenciaAArfcn(880.2)).toEqual({ arfcn: 975, banda: 'E-GSM', sentido: 'subida' });
    expect(frecuenciaAArfcn(1805.2)).toEqual({ arfcn: 512, banda: 'DCS 1800', sentido: 'bajada' });
  });
  test('una frecuencia fuera de la rejilla de 200 kHz o de las bandas: null', () => {
    expect(frecuenciaAArfcn(900.1)).toBeNull();
    expect(frecuenciaAArfcn(2100)).toBeNull();
  });
});

describe('pasosArfcn', () => {
  test('explica la banda, la subida y la bajada', () => {
    const pasos = pasosArfcn(975);
    expect(pasos).toHaveLength(3);
    expect(pasos[0].texto).toContain('E-GSM');
    expect(pasos[1].formula).toContain('880{,}2');
    expect(pasos[2].formula).toContain('925{,}2');
  });
  test('un número sin portadora: un único paso que lo dice', () => {
    expect(pasosArfcn(300)).toEqual([{ texto: expect.stringContaining('no es una portadora') }]);
  });
});

describe('red GSM', () => {
  test('están los elementos del plan', () => {
    const ids = NODOS.map((n) => n.id);
    for (const id of ['MS', 'BTS', 'BSC', 'MSC', 'VLR', 'HLR', 'AuC', 'EIR', 'GMSC']) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('cada enlace une dos elementos que existen', () => {
    const ids = new Set(NODOS.map((n) => n.id));
    for (const e of ENLACES) {
      expect(ids.has(e.a), `${e.a}–${e.b}`).toBe(true);
      expect(ids.has(e.b), `${e.a}–${e.b}`).toBe(true);
    }
    expect(ENLACES.map((e) => e.interfaz)).toEqual(expect.arrayContaining(['Um', 'Abis', 'A', 'B', 'C', 'D', 'E', 'F', 'H']));
  });
});
