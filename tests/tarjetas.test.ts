// Mazo de tarjetas: preguntas de la «Autoevaluación» de cada tema y su orden de repaso.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { extraerPreguntas, ordenarMazo, textoTarjeta } from '../src/widgets/tarjetas';

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
  test('también lee la sección «Preguntas de repaso» (Radiación)', () => {
    const md = '## Preguntas de repaso\n\n<details>\n<summary>¿Qué es la PIRE?</summary>\n\nPt − Lt + Gt.\n\n</details>\n';
    expect(extraerPreguntas(md)).toEqual([{ pregunta: '¿Qué es la PIRE?', respuesta: 'Pt − Lt + Gt.' }]);
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

describe('mazo compartido entre asignaturas', () => {
  test('también lee la sección «Preguntas de examen» (Ópticas)', () => {
    const md = `
## Preguntas de examen

<details>
<summary>¿Por qué el LED no sirve para DWDM?</summary>

Su espectro es demasiado ancho.

</details>

<details>
<summary>¿Qué es la electroluminiscencia?</summary>

Luz a partir de una corriente.

</details>
`;
    expect(extraerPreguntas(md).map((p) => p.pregunta)).toEqual([
      '¿Por qué el LED no sirve para DWDM?', '¿Qué es la electroluminiscencia?',
    ]);
  });
  test('Conmutación conserva sus 60 preguntas (46 + 6 de conexiones + 8 de GPRS)', () => {
    let n = 0;
    for (const f of readdirSync('contenido/conmutacion/temas')) {
      n += extraerPreguntas(readFileSync(`contenido/conmutacion/temas/${f}`, 'utf8')).length;
    }
    expect(n).toBe(60);
  });
});
