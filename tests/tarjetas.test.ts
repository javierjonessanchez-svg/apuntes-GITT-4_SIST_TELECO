// Mazo de tarjetas: preguntas de la «Autoevaluación» de cada tema y su orden de repaso.
import { describe, expect, test } from 'vitest';
import { extraerPreguntas, ordenarMazo, textoTarjeta } from '../src/asignaturas/conmutacion/widgets/tarjetas';

const mdx = `
## Algo

<details>
<summary>No es de autoevaluación</summary>

Fuera.

</details>

## Autoevaluación

<details>
<summary>¿Qué guarda el HLR?</summary>

A **todos** los abonados.

</details>

<details>
<summary>¿Y el VLR?</summary>

Solo los de su zona, con SRES<sub>A</sub>.

</details>
`;

describe('extraerPreguntas', () => {
  test('solo las de la sección Autoevaluación, en orden', () => {
    expect(extraerPreguntas(mdx)).toEqual([
      { pregunta: '¿Qué guarda el HLR?', respuesta: 'A **todos** los abonados.' },
      { pregunta: '¿Y el VLR?', respuesta: 'Solo los de su zona, con SRES<sub>A</sub>.' },
    ]);
  });
  test('un tema sin autoevaluación no da tarjetas', () => {
    expect(extraerPreguntas('## Nada\n\nTexto.')).toEqual([]);
  });
});

describe('textoTarjeta', () => {
  test('quita el Markdown y pasa los subíndices a fórmula', () => {
    expect(textoTarjeta('A **todos**, `0101` y SRES<sub>A</sub>.')).toBe('A todos, 0101 y SRES$_{A}$.');
  });
});

describe('ordenarMazo', () => {
  test('primero las nunca vistas, luego las peor sabidas; empates en su orden', () => {
    const mazo = ['a', 'b', 'c', 'd'].map((pregunta) => ({ pregunta }));
    const notas = { a: 2 as const, b: 0 as const, d: 1 as const };
    expect(ordenarMazo(mazo, notas).map((t) => t.pregunta)).toEqual(['c', 'b', 'd', 'a']);
  });
});
