// Fechas de las pruebas: siempre en hora local (en España, 'AAAA-MM-DD' como UTC
// puede mover el día), y nunca una cuenta de días negativa.
import { describe, expect, test } from 'vitest';
import { diasHasta, estaSemana, fechaCorta, fraccion, hoyDe, isoDe, leerFecha, mensajeSemana, proximaPrueba, textoDias, textoRelativo } from '../src/comun/fechas';

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

describe('ayudas de la línea de tiempo', () => {
  test('isoDe usa la fecha local', () => {
    expect(isoDe(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05');
  });
  test('fraccion: posición entre dos fechas (0 a 1, fuera si se sale)', () => {
    expect(fraccion('2026-10-11', '2026-10-01', '2026-10-21')).toBe(0.5);
    expect(fraccion('2026-10-01', '2026-10-01', '2026-10-21')).toBe(0);
    expect(fraccion('2026-12-01', '2026-10-01', '2026-10-21')).toBeGreaterThan(1);
  });
  test('fechaCorta en español', () => {
    expect(fechaCorta('2026-10-19')).toBe('lun 19 oct');
    expect(fechaCorta('2026-11-03')).toBe('mar 3 nov');
  });
  test('estaSemana: de hoy a 7 días, ordenadas', () => {
    const hoy = new Date(2026, 9, 15, 9);
    const p = ['2026-10-23', '2026-10-22', '2026-10-14', '2026-10-15', '2026-10-30'].map((fecha) => ({ fecha }));
    expect(estaSemana(p, hoy).map((x) => x.fecha)).toEqual(['2026-10-15', '2026-10-22']);
  });
  test('hoyDe: ?hoy=AAAA-MM-DD solo en desarrollo', () => {
    expect(isoDe(hoyDe('?hoy=2026-12-01', true))).toBe('2026-12-01');
    expect(isoDe(hoyDe('?hoy=2026-12-01', false))).toBe(isoDe(new Date()));
    expect(isoDe(hoyDe('?hoy=basura', true))).toBe(isoDe(new Date()));
  });
});

describe('textos de la portada', () => {
  const hoy = new Date(2026, 9, 15, 9);
  test('textoRelativo: una prueba pasada dice "ya pasó"', () => {
    expect(textoRelativo(-3)).toBe('ya pasó');
    expect(textoRelativo(4)).toBe('en 4 días');
  });
  test('mensajeSemana: null si hay pruebas esta semana', () => {
    expect(mensajeSemana([{ fecha: '2026-10-19', nombre: 'PS5' }], hoy)).toBeNull();
  });
  test('mensajeSemana: nada esta semana, pero hay una más tarde', () => {
    expect(mensajeSemana([{ fecha: '2026-11-03', nombre: 'PS6' }], hoy)).toBe('Nada esta semana. La siguiente: PS6, en 19 días.');
  });
  test('mensajeSemana: todas pasadas → "Sin pruebas próximas."', () => {
    expect(mensajeSemana([{ fecha: '2026-10-13', nombre: 'PS4' }], hoy)).toBe('Sin pruebas próximas.');
    expect(mensajeSemana([], hoy)).toBe('Sin pruebas próximas.');
  });
});
