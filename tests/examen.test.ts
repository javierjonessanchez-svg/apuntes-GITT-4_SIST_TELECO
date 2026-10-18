// Datos del modo examen (contenido/<asig>/examen.yaml): esquema, referencias
// entre flujos y fórmulas, y el guardián de lo público (solo funciones/ y plantillas/).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';
import { enlace, esquemaExamen, porTema, validarExamen, type Examen } from '../src/comun/examen';
import { formula } from '../src/widgets/mates';

const FIXTURE = 'tests/fixtures/examen-ejemplo.yaml';
const leer = (ruta: string): Examen => esquemaExamen.parse(parse(readFileSync(ruta, 'utf8')));
// Copia del ejemplo para estropearla en cada prueba
const ejemplo = (): Examen => structuredClone(leer(FIXTURE));

describe('validarExamen', () => {
  test('valida el ejemplo', () => {
    expect(() => validarExamen(ejemplo(), FIXTURE)).not.toThrow();
  });
  test('falla con paso a id inexistente', () => {
    const e = ejemplo();
    e.flujos[0].pasos.push({ formula: 'no-existe' });
    expect(() => validarExamen(e, FIXTURE)).toThrow(/no-existe/);
    expect(() => validarExamen(e, FIXTURE)).toThrow(FIXTURE);
  });
  test('falla con id repetido', () => {
    const e = ejemplo();
    e.formulas.push({ ...e.formulas[0] });
    expect(() => validarExamen(e, FIXTURE)).toThrow(new RegExp(e.formulas[0].id));
  });
  test('falla con archivo fuera de funciones/plantillas', () => {
    const e = ejemplo();
    e.formulas[0].archivo = 'examen/ejercicios/E1.md';
    expect(() => validarExamen(e, FIXTURE)).toThrow(/examen\/ejercicios\/E1\.md/);
  });
  test('falla con una ruta que sale de funciones/ con ..', () => {
    const e = ejemplo();
    e.formulas[0].archivo = 'funciones/../docs/apuntes.md';
    expect(() => validarExamen(e, FIXTURE)).toThrow(/\.\./);
  });
  test('falla con texto de examen antiguo', () => {
    const e = ejemplo();
    e.formulas[1].notas = 'Como en la PEI 1 RADIO del curso 2025-2026';
    expect(() => validarExamen(e, FIXTURE)).toThrow(FIXTURE);
    const f = ejemplo();
    f.flujos[0].cuando = 'enunciado de 2025-2026';
    expect(() => validarExamen(f, FIXTURE)).toThrow(/2025-2026/);
  });
});

describe('esquemaExamen', () => {
  test('rechaza un repo que no es de GitHub', () => {
    const datos = parse(readFileSync(FIXTURE, 'utf8'));
    datos.repo = 'https://example.com/';
    expect(esquemaExamen.safeParse(datos).success).toBe(false);
  });
  test('rechaza un id con mayúsculas o espacios', () => {
    const datos = parse(readFileSync(FIXTURE, 'utf8'));
    datos.formulas[0].id = 'Mi fórmula';
    expect(esquemaExamen.safeParse(datos).success).toBe(false);
  });
});

describe('ayudas', () => {
  test('porTema conserva el orden', () => {
    const grupos = porTema(ejemplo().formulas);
    expect(grupos.map((g) => g.tema)).toEqual(['Propagación', 'Antenas']);
    expect(grupos[0].formulas.map((f) => f.id)).toEqual(['pire', 'lb-espacio-libre', 'prx']);
  });
  test('enlace concatena repo y archivo', () => {
    const e = ejemplo();
    expect(enlace(e, e.formulas[0])).toBe(
      'https://github.com/javierjonessanchez-svg/radiacion-radiocom/blob/main/funciones/propagacion/Calcular_PIRE.m',
    );
  });
  test('un TeX mal escrito sale como <code>, sin romper', () => {
    expect(formula('\\frac{1}{', true)).toMatch(/^<code>/);
  });
});

// Los archivos reales también pasan el guardián (además de la validación al construir)
test('todos los contenido/*/examen.yaml son válidos y públicos', () => {
  const rutas = readdirSync('contenido').map((a) => `contenido/${a}/examen.yaml`).filter((r) => existsSync(r));
  for (const ruta of rutas) expect(() => validarExamen(leer(ruta), ruta)).not.toThrow();
});
