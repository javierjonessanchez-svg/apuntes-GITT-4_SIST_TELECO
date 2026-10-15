// Contraste WCAG de cada mundo, en claro y en oscuro: texto ≥ 4,5:1,
// acentos (partes de la interfaz y texto grande) ≥ 3:1.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { leerTokens, ratio, reglasContraste } from './lib/contraste';

describe('ratio', () => {
  test('negro sobre blanco es 21', () => {
    expect(ratio('#000000', '#FFFFFF')).toBe(21);
  });
  test('es simétrico y acepta #abc', () => {
    expect(ratio('#fff', '#777777')).toBeCloseTo(ratio('#777777', '#FFFFFF'), 10);
    expect(ratio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
});

describe('reglasContraste', () => {
  test('el anillo de foco necesita 3:1 sobre el esmalte y, el del marco, sobre el marco', () => {
    const fallos = reglasContraste({ foco: '#A87A2E', esmalte: '#D6DCD3', 'foco-marco': '#A87A2E', marco: '#2E4038' })
      .filter((r) => !r.pasa).map((r) => r.par);
    expect(fallos).toContain('foco/esmalte');
    expect(fallos).toContain('foco-marco/marco');
  });
});

describe('leerTokens', () => {
  const css = `
    html[data-asignatura="x"] { --fondo: #FFFFFF; --texto: #000000; --otra: 3px; }
    html[data-asignatura="x"][data-tema="oscuro"] { --fondo: #000000; --texto: #FFFFFF; }
    @media (prefers-color-scheme: dark) {
      html[data-asignatura="x"]:not([data-tema="claro"]) { --fondo: #000000; --texto: #EEEEEE; }
    }`;
  test('separa claro, oscuro y la copia del @media', () => {
    const t = leerTokens(css);
    expect(t.claro).toEqual({ fondo: '#FFFFFF', texto: '#000000' });
    expect(t.oscuro).toEqual({ fondo: '#000000', texto: '#FFFFFF' });
    expect(t.oscuroMedia).toEqual({ fondo: '#000000', texto: '#EEEEEE' });
  });
});

// Hojas con tokens: el esqueleto y cada mundo (src/asignaturas/*/tema.css)
const hojas = [
  'src/comun/esqueleto.css',
  ...readdirSync('src/asignaturas', { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(`src/asignaturas/${d.name}/tema.css`))
    .map((d) => `src/asignaturas/${d.name}/tema.css`),
];

describe.each(hojas)('%s', (hoja) => {
  const tokens = leerTokens(readFileSync(hoja, 'utf8'));
  test('el oscuro del @media es una copia exacta del [data-tema=oscuro]', () => {
    expect(tokens.oscuroMedia).toEqual(tokens.oscuro);
  });
  test.each(['claro', 'oscuro'] as const)('contraste en %s', (modo) => {
    const fallos = reglasContraste(tokens[modo]).filter((r) => !r.pasa).map((r) => `${r.par}: ${r.valor.toFixed(2)} < ${r.minimo}`);
    expect(fallos).toEqual([]);
  });
});

test('Conmutación tiene su mundo con tokens propios', () => {
  const t = leerTokens(readFileSync('src/asignaturas/conmutacion/tema.css', 'utf8'));
  for (const k of ['esmalte', 'placa', 'laton', 'lampara', 'cable', 'marco', 'sobre-marco', 'foco', 'foco-marco']) {
    expect(t.claro[k], k).toBeTruthy();
    expect(t.oscuro[k], k).toBeTruthy();
  }
});
