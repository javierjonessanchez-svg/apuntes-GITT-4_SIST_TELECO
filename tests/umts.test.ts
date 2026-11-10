import { describe, it, expect } from 'vitest';
import {
  ej1Canales, ej1Calidad, ej1Maximo, ej2, ej2Minimo, ej3,
  rellenarBits, quitarRelleno, DATOS_PS8, ensanchar, sumarSenales, desensanchar, WALSH, anchoLog, GENERACIONES,
} from '../src/asignaturas/conmutacion/widgets/umts';

describe('Ejercicio 1 (hoja del bloque 3)', () => {
  it('canales de señalización: λE≈348,7 y λS≈353,3, NT=468', () => {
    const r = ej1Canales(0.76, 0.09); // ocupaciones de la hoja (%)
    expect(r.lE).toBeCloseTo(348.7, 0);
    expect(r.lS).toBeCloseTo(353.3, 0);
    expect(Math.round(r.NT)).toBe(468);
  });
  it('calidad con NT=468 y SMS', () => {
    const q = ej1Calidad(468, 1);
    expect(q.pbS).toBeLessThan(1e-9);
    expect(q.pbT * 100).toBeCloseTo(5.11, 1);
    expect(q.pbA * 100).toBeCloseTo(0.62, 1);
    expect(q.cumple).toBe(false);
  });
  it('máximo de terminales: 411', () => {
    expect(ej1Maximo(1)).toBe(411);
  });
});

describe('Ejercicio 2: sectorización', () => {
  it('el mínimo es 60º (6 sectores)', () => {
    expect(ej2Minimo(100)?.grados).toBe(60);
  });
  it('tráfico TCH por sector', () => {
    expect(ej2(6, 100).at).toBeCloseTo(6.07, 1);
    expect(ej2(4, 100).at).toBeCloseTo(9.11, 1);
    expect(ej2(3, 100).at).toBeCloseTo(12.15, 1);
  });
});

describe('Ejercicio 3: GPRS', () => {
  it('oficial: 4,0 %, 27,55 E, 9,07 %, N_BR≈59,4', () => {
    const r = ej3(400);
    expect(r.pbS * 100).toBeCloseTo(4.0, 0);
    expect(r.AT).toBeCloseTo(27.55, 1);
    expect(r.pbT * 100).toBeCloseTo(9.07, 1);
    expect(r.BR / 12).toBeCloseTo(4.949, 1);
    expect(r.BR).toBeCloseTo(59.39, 0);
  });
});

describe('PS8', () => {
  it('relleno de bits da 35 bits', () => {
    const { bits } = rellenarBits(DATOS_PS8);
    expect(bits).toBe('01111101001010000011111010011111010'.replace(/\s/g, ''));
    expect(bits.length).toBe(35);
  });
  it('el receptor recupera los datos', () => {
    expect(quitarRelleno(rellenarBits(DATOS_PS8).bits)).toBe(DATOS_PS8);
  });
  it('la bandera sola se rellena a 011111010', () => {
    expect(rellenarBits('01111110').bits).toBe('011111010');
  });
});

describe('W-CDMA', () => {
  it('los códigos de Walsh son ortogonales y se separan dos usuarios', () => {
    const a = [1, 0, 1], b = [0, 0, 1];
    const s = sumarSenales(ensanchar(a, WALSH[1]), ensanchar(b, WALSH[2]));
    expect(desensanchar(s, WALSH[1])).toEqual([1, -1, 1]);
    expect(desensanchar(s, WALSH[2])).toEqual([-1, -1, 1]);
  });
  it('escala logarítmica creciente', () => {
    const w = GENERACIONES.map((g) => anchoLog(g.kbps));
    expect(w[0]).toBeLessThan(w[w.length - 1]);
  });
});
