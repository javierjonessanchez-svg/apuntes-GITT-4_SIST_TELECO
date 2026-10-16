// Widgets de «entender» de Conmutación: racimo celular, tiempos TDMA, flujos de mensajes y escalera de tiempos.
import { describe, expect, test } from 'vitest';
import { ciDb, distanciaReuso, esTamanoValido, etiquetas, ijDe } from '../src/asignaturas/conmutacion/widgets/celulas';
import { MULTI26_MS, MULTI51_MS, RANURA_US, TRAMA_MS, canalEnTrama } from '../src/asignaturas/conmutacion/widgets/tdma';
import { FLUJOS } from '../src/asignaturas/conmutacion/widgets/flujos';
import { NIVELES } from '../src/asignaturas/conmutacion/widgets/jerarquia';

describe('células', () => {
  test('tamaños de racimo válidos: N = i² + ij + j²', () => {
    expect(esTamanoValido(7) && !esTamanoValido(5)).toBe(true);
    expect([1, 3, 4, 7, 9, 12, 13].every(esTamanoValido)).toBe(true);
    expect(ijDe(7)).toEqual([2, 1]);
    expect(ijDe(4)).toEqual([2, 0]);
  });
  test('distancia de reúso y C/I', () => {
    expect(Math.abs(distanciaReuso(1, 7) - Math.sqrt(21))).toBeLessThan(1e-12);
    expect(Math.abs(ciDb(7) - 18.66)).toBeLessThan(0.01);
  });
  test('cada racimo usa N etiquetas, y las cocanal están a D = R·√(3N)', () => {
    // celdas en coordenadas axiales (q, r) de un hexágono de radio 4
    const celdas: [number, number][] = [];
    for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) if (Math.abs(q + r) <= 4) celdas.push([q, r]);
    for (const N of [3, 4, 7, 12]) {
      const et = etiquetas(celdas, N);
      expect(new Set(et).size).toBe(N);
      const [i, j] = ijDe(N)!;
      const centro = et[celdas.findIndex(([q, r]) => q === 0 && r === 0)];
      // desplazamiento (i, j) en axiales: misma etiqueta; un paso al lado: otra
      expect(et[celdas.findIndex(([q, r]) => q === i && r === j)]).toBe(centro);
      expect(et[celdas.findIndex(([q, r]) => q === 1 && r === 0)]).not.toBe(centro);
    }
  });
});

describe('tiempos TDMA', () => {
  test('ranura, trama y multitramas', () => {
    expect(Math.abs(TRAMA_MS - (8 * RANURA_US) / 1000)).toBeLessThan(0.001);
    expect(Math.abs(MULTI26_MS - 26 * TRAMA_MS)).toBeLessThan(0.01);
    expect(Math.abs(MULTI51_MS - 235.4)).toBeLessThan(0.05);
  });
  test('multitrama de 26 (combinación I)', () => {
    expect(canalEnTrama(0, 26)).toBe('TCH');
    expect(canalEnTrama(12, 26)).toBe('SACCH');
    expect(canalEnTrama(25, 26)).toBe('libre');
  });
  test('multitrama de 51 (combinación IV, bajada)', () => {
    expect([0, 1, 2, 6, 10, 11, 12, 50].map((t) => canalEnTrama(t, 51))).toEqual(['FCCH', 'SCH', 'BCCH', 'CCCH', 'FCCH', 'SCH', 'CCCH', 'libre']);
  });
});

describe('flujos de mensajes', () => {
  test('cada mensaje va entre actores del flujo', () => {
    expect(FLUJOS.length).toBeGreaterThanOrEqual(3);
    for (const f of FLUJOS) {
      for (const m of f.mensajes) {
        expect(f.actores, `${f.id}: ${m.texto}`).toContain(m.de);
        expect(f.actores, `${f.id}: ${m.texto}`).toContain(m.a);
      }
    }
  });
  test('están los tres del plan: actualización de posición, establecimiento de llamada y traspaso', () => {
    const ids = FLUJOS.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['actualizacion-a', 'llamada-entrante', 'traspaso-bsc']));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('escalera de tiempos', () => {
  test('de la ráfaga a la hipertrama, cada nivel más largo que el anterior', () => {
    expect(NIVELES.map((n) => n.nombre)[0]).toMatch(/Ráfaga/);
    expect(NIVELES.at(-1)!.nombre).toBe('Hipertrama');
    for (let k = 1; k < NIVELES.length; k++) expect(NIVELES[k].ms).toBeGreaterThan(NIVELES[k - 1].ms);
    expect(Math.abs(NIVELES.at(-1)!.ms / 1000 - 12533.76)).toBeLessThan(0.01);
  });
});
