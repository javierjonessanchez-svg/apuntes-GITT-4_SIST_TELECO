// Validación de las pruebas: si una prueba cita un tema que no existe, la
// construcción debe fallar con un mensaje que diga el archivo y el tema.
import { describe, expect, test } from 'vitest';
import { validarProximos, validarPruebas } from '../src/comun/datos';

const asig = (temasPrueba: string[]) => [{
  slug: 'conmutacion',
  archivo: 'contenido/conmutacion/asignatura.md',
  pruebas: [{ fecha: '2026-10-19', nombre: 'Entrega PS5', temas: temasPrueba }],
}];
const temas = [{ asignatura: 'conmutacion', slug: 'trafico-colas' }];

describe('validarPruebas', () => {
  test('un tema inexistente da un mensaje con el archivo y el tema', () => {
    const errores = validarPruebas(asig(['no-existe']), temas);
    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain('conmutacion');
    expect(errores[0]).toContain('no-existe');
  });
  test('datos válidos: sin errores', () => {
    expect(validarPruebas(asig(['trafico-colas']), temas)).toEqual([]);
  });
  test('un tema de otra asignatura no vale', () => {
    const otros = [{ asignatura: 'seda', slug: 'trafico-colas' }];
    expect(validarPruebas(asig(['trafico-colas']), otros)).toHaveLength(1);
  });
});

// Temas próximos (aún sin apuntes): su número no puede coincidir con el de un tema real
describe('validarProximos', () => {
  const asigP = (ordenes: number[]) => [{
    slug: 'comunicaciones-opticas',
    archivo: 'contenido/comunicaciones-opticas/asignatura.md',
    proximos: ordenes.map((orden) => ({ titulo: `Tema ${orden}`, orden, bloque: 'Fibra' })),
  }];
  const reales = [{ asignatura: 'comunicaciones-opticas', slug: 'led', orden: 6 }];

  test('un próximo con el número de un tema real da un error con el archivo y el número', () => {
    const errores = validarProximos(asigP([1, 6]), reales);
    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain('comunicaciones-opticas');
    expect(errores[0]).toContain('6');
  });
  test('dos próximos con el mismo número también fallan', () => {
    expect(validarProximos(asigP([2, 2]), reales)).toHaveLength(1);
  });
  test('sin choques ni campo proximos: sin errores', () => {
    expect(validarProximos(asigP([1, 2, 13]), reales)).toEqual([]);
    expect(validarProximos([{ slug: 'seda', archivo: 'x', proximos: undefined }], reales)).toEqual([]);
  });
});
