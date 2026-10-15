// Fechas de las pruebas: siempre en hora local (en España, 'AAAA-MM-DD' como UTC
// puede mover el día), y nunca una cuenta de días negativa.
import { describe, expect, test } from 'vitest';
import { diasHasta, leerFecha, proximaPrueba, textoDias } from '../src/comun/fechas';

describe('leerFecha', () => {
  test('da la medianoche local del día indicado', () => {
    const d = leerFecha('2026-10-20');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 20, 0]);
  });
});

describe('diasHasta', () => {
  test('cuenta días enteros aunque sea casi medianoche', () => {
    expect(diasHasta('2026-10-20', new Date(2026, 9, 15, 23, 30))).toBe(5);
  });
  test('el mismo día es 0', () => {
    expect(diasHasta('2026-10-15', new Date(2026, 9, 15, 0, 1))).toBe(0);
  });
  test('una fecha pasada es negativa (proximaPrueba la descarta)', () => {
    expect(diasHasta('2026-10-13', new Date(2026, 9, 15, 12))).toBe(-2);
  });
});

describe('proximaPrueba', () => {
  const hoy = new Date(2026, 9, 15, 10);
  test('todas pasadas: null', () => {
    expect(proximaPrueba([{ fecha: '2026-10-01' }, { fecha: '2026-10-14' }], hoy)).toBeNull();
  });
  test('fechas mezcladas y desordenadas: la futura más cercana', () => {
    const pruebas = [{ fecha: '2026-11-03', n: 'PS6' }, { fecha: '2026-10-13', n: 'PS4' }, { fecha: '2026-10-19', n: 'PS5' }];
    expect(proximaPrueba(pruebas, hoy)?.n).toBe('PS5');
  });
  test('una prueba de hoy cuenta como próxima, con 0 días', () => {
    const p = proximaPrueba([{ fecha: '2026-10-15' }], hoy);
    expect(p).not.toBeNull();
    expect(diasHasta(p!.fecha, hoy)).toBe(0);
  });
  test('nunca devuelve una prueba con días negativos', () => {
    const pruebas = ['2026-10-10', '2026-10-14', '2026-10-16', '2026-12-01'].map((fecha) => ({ fecha }));
    const p = proximaPrueba(pruebas, hoy);
    expect(diasHasta(p!.fecha, hoy)).toBeGreaterThanOrEqual(0);
  });
});

describe('textoDias', () => {
  test('hoy, mañana y en N días', () => {
    expect(textoDias(0)).toBe('hoy');
    expect(textoDias(1)).toBe('mañana');
    expect(textoDias(5)).toBe('en 5 días');
  });
});
