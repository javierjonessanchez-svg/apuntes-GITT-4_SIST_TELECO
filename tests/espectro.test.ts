// Regla de longitudes de onda: posición en la barra, color de cada λ y λ de un gap.
import { describe, expect, test } from 'vitest';
import { VENTANAS, colorDe, nmDeEv, posicion } from '../src/widgets/espectro';

describe('posicion', () => {
  test('los extremos de la regla son 0 y 1', () => {
    expect(posicion(380)).toBe(0);
    expect(posicion(1700)).toBe(1);
  });
  test('fuera de la regla se queda en el borde, nunca NaN', () => {
    expect(posicion(2000)).toBe(1);
    expect(posicion(100)).toBe(0);
    expect(posicion(NaN)).toBe(0);
  });
  test('crece con la longitud de onda y acepta otro rango', () => {
    expect(posicion(1310)).toBeGreaterThan(posicion(850));
    expect(posicion(1550, 1500, 1600)).toBeCloseTo(0.5, 10);
  });
});

describe('colorDe', () => {
  test('el infrarrojo es el gris de la regla', () => {
    expect(colorDe(1550)).toBe('#5B5470');
  });
  test('470 nm es azul: el canal azul es el mayor', () => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(colorDe(470).slice(i, i + 2), 16));
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });
});

test('las tres ventanas', () => {
  expect([...VENTANAS]).toEqual([850, 1310, 1550]);
});

test('λ de un gap: GaAs (1,42 eV) emite cerca de 0,87 µm', () => {
  expect(nmDeEv(1.42)).toBeCloseTo(873, 0);
});
