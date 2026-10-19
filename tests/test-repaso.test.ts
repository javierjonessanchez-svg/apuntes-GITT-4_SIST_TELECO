import { describe, expect, it } from 'vitest';
import { barajar, elegirSimulacro, idPregunta, mezclarOpciones, notaTest, resumenPorTema, type ItemDesarrollo, type ItemTest } from '../src/widgets/test';

// Generador fijo para que los tests no dependan del azar
function semilla(n: number) {
  return () => { n = (n * 1103515245 + 12345) % 2 ** 31; return n / 2 ** 31; };
}

describe('preguntas tipo test', () => {
  it('idPregunta es estable y distingue enunciados', () => {
    expect(idPregunta('led', '¿Qué es el gap?')).toBe(idPregunta('led', '¿Qué es el gap?'));
    expect(idPregunta('led', '¿Qué es el gap?')).not.toBe(idPregunta('led', '¿Qué es la λ?'));
    expect(idPregunta('led', 'x')).toMatch(/^led-[0-9a-z]+$/);
  });

  it('barajar no pierde ni repite elementos y no cambia el original', () => {
    const xs = [1, 2, 3, 4, 5, 6];
    const b = barajar(xs, semilla(7));
    expect([...b].sort()).toEqual(xs);
    expect(xs).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('mezclarOpciones marca una sola correcta, la del índice c', () => {
    const r = mezclarOpciones({ p: '?', o: ['a', 'b', 'c'], c: 1 }, semilla(3));
    expect(r.filter((x) => x.correcta).map((x) => x.texto)).toEqual(['b']);
  });

  it('notaTest: todo bien da 10; un fallo con 4 opciones resta 1/3 de pregunta', () => {
    const bien = { opciones: 4, acierto: true };
    expect(notaTest([bien, bien, bien])).toBe(10);
    expect(notaTest([bien, bien, { opciones: 4, acierto: false }])).toBeCloseTo(5.6, 1);
    expect(notaTest([bien, bien, { opciones: 4, acierto: false }], false)).toBeCloseTo(6.7, 1);
    expect(notaTest([bien, { opciones: 4, acierto: null }])).toBe(5);
  });

  it('notaTest nunca baja de 0 y con lista vacía es 0', () => {
    expect(notaTest([{ opciones: 2, acierto: false }])).toBe(0);
    expect(notaTest([])).toBe(0);
  });

  it('elegirSimulacro reparte el desarrollo entre temas distintos', () => {
    const d = (tema: string, i: number): ItemDesarrollo => ({ tema, titulo: tema, pregunta: tema + i, respuesta: '' });
    const t = (i: number): ItemTest => ({ id: 't' + i, tema: 'x', titulo: 'x', p: 'p' + i, o: ['a', 'b'], c: 0 });
    const r = elegirSimulacro([t(1), t(2), t(3)], [d('a', 1), d('a', 2), d('a', 3), d('b', 1)], 2, 2, semilla(1));
    expect(r.test).toHaveLength(2);
    expect(new Set(r.desarrollo.map((x) => x.tema))).toEqual(new Set(['a', 'b']));
  });

  it('elegirSimulacro no pide más de las que hay', () => {
    const r = elegirSimulacro([], [{ tema: 'a', titulo: 'a', pregunta: 'q', respuesta: '' }], 10, 3, semilla(2));
    expect(r.test).toHaveLength(0);
    expect(r.desarrollo).toHaveLength(1);
  });

  it('resumenPorTema pone primero el tema peor sabido', () => {
    const r = resumenPorTema([
      { tema: 'a', titulo: 'A', acierto: true }, { tema: 'b', titulo: 'B', acierto: false }, { tema: 'a', titulo: 'A', acierto: true },
    ]);
    expect(r.map((x) => [x.tema, x.bien, x.total])).toEqual([['b', 0, 1], ['a', 2, 2]]);
  });
});
