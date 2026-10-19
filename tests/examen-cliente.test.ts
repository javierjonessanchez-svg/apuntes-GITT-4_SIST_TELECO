// Resumen del modo examen: cuántas fórmulas (de las visibles) salen a mano y en MATLAB.
import { describe, expect, test } from 'vitest';
import { resumen } from '../src/comun/cliente/examen';

describe('resumen', () => {
  test('cuenta solo los ids pedidos', () => {
    const marcas = { a: { mano: true, matlab: true }, b: { mano: true, matlab: false }, c: { mano: true, matlab: true } };
    expect(resumen(marcas, ['a', 'b'])).toEqual({ mano: 2, matlab: 1, total: 2 });
  });
  test('ids sin marcas cuentan como no hechos', () => {
    expect(resumen({}, ['a', 'b', 'c'])).toEqual({ mano: 0, matlab: 0, total: 3 });
  });
  test('sin ids: todo a 0', () => {
    expect(resumen({ a: { mano: true, matlab: true } }, [])).toEqual({ mano: 0, matlab: 0, total: 0 });
  });
});
