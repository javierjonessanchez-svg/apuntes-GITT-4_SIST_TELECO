// Validación de las pruebas: si una prueba cita un tema que no existe, la
// construcción debe fallar con un mensaje que diga el archivo y el tema.
import { describe, expect, test } from 'vitest';
import { validarPruebas } from '../src/comun/datos';

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
