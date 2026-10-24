// Modo examen: fórmulas y flujos por tipo de problema de una asignatura
// (contenido/<slug>/examen.yaml). Dos formatos: el de MATLAB (fórmulas con su función
// y enlace al repo) y la hoja (`tipo: hoja`: fórmulas, registros y pasos por tipo de
// problema, sin código enlazado). El esquema lo usa la colección `examenes`;
// validarExamen comprueba lo que zod no ve (referencias y lo que puede ser público).
// Todo es puro: se prueba con Vitest sin Astro.
import { z } from 'astro/zod';

const id = z.string().regex(/^[a-z0-9-]+$/, 'solo minúsculas, cifras y guiones');

const esquemaMatlab = z.object({
  // Base de los enlaces «ver código», p. ej. https://github.com/<usuario>/<repo>/blob/main/
  repo: z.string().startsWith('https://github.com/', 'el repo debe estar en https://github.com/'),
  formulas: z.array(z.object({
    id,
    tema: z.string().min(1),
    prueba: z.enum(['PEI1', 'PEI2']),
    nombre: z.string().min(1),
    tex: z.string().min(1),
    funcion: z.string().min(1),
    llamada: z.string().min(1),
    archivo: z.string().min(1),
    notas: z.string().min(1).optional(),
  })).min(1),
  flujos: z.array(z.object({
    id,
    titulo: z.string().min(1),
    cuando: z.string().min(1),
    // Plantilla del repo que resuelve este tipo de problema entero (opcional)
    plantilla: z.string().min(1).optional(),
    pasos: z.array(z.object({
      formula: z.string().min(1),
      nota: z.string().min(1).optional(),
    })).min(1),
  })),
});

const esquemaHoja = z.object({
  tipo: z.literal('hoja'),
  formulas: z.array(z.object({
    id,
    tema: z.string().min(1),
    nombre: z.string().min(1),
    tex: z.string().min(1),
    notas: z.string().min(1).optional(),
  })).min(1),
  // Las mismas filas que las tablas Registro de los temas (`que` admite <b> y <code>)
  registros: z.array(z.object({
    tema: z.string().min(1),
    nombre: z.string().min(1),
    descripcion: z.string().min(1),
    campos: z.array(z.object({ bits: z.string().min(1), nombre: z.string().min(1), que: z.string().min(1) })).min(1),
  })).min(1),
  // Lista de pasos por tipo de problema
  problemas: z.array(z.object({
    id,
    titulo: z.string().min(1),
    cuando: z.string().min(1),
    pasos: z.array(z.string().min(1)).min(1),
  })).min(1),
});

// La hoja primero: los datos de MATLAB no tienen `tipo` y caen en el segundo
export const esquemaExamen = z.union([esquemaHoja, esquemaMatlab]);

export type ExamenMatlab = z.infer<typeof esquemaMatlab>;
export type ExamenHoja = z.infer<typeof esquemaHoja>;
export type Examen = ExamenMatlab | ExamenHoja;
export type Formula = ExamenMatlab['formulas'][number];
export type Flujo = ExamenMatlab['flujos'][number];
export type Paso = Flujo['pasos'][number];

// Solo se puede enlazar código de estas carpetas del repo privado
const CARPETAS_PUBLICAS = ['funciones/', 'plantillas/'];
// Restos de exámenes de otros años que no pueden acabar en la web
const PROHIBIDO = ['pei 1 radio', '2025-2026'];

export function esHoja(e: Examen): e is ExamenHoja {
  return 'tipo' in e && e.tipo === 'hoja';
}

/** Lanza un error con el archivo y el id si los datos tienen una referencia rota o algo que no puede ser público. */
export function validarExamen(e: Examen, archivo: string): void {
  const errores: string[] = [];
  if (esHoja(e)) validarHoja(e, errores);
  else validarMatlab(e, errores);
  const texto = JSON.stringify(e).toLowerCase();
  for (const palabra of PROHIBIDO) {
    if (texto.includes(palabra)) errores.push(`el texto contiene "${palabra}" (material de exámenes antiguos)`);
  }
  if (errores.length) throw new Error(`${archivo}:\n- ${errores.join('\n- ')}`);
}

function validarHoja(e: ExamenHoja, errores: string[]): void {
  const vistos = new Set<string>();
  for (const { id } of [...e.formulas, ...e.problemas]) {
    if (vistos.has(id)) errores.push(`el id "${id}" está repetido`);
    vistos.add(id);
  }
}

function validarMatlab(e: ExamenMatlab, errores: string[]): void {
  const vistos = new Set<string>();
  for (const f of e.formulas) {
    if (vistos.has(f.id)) errores.push(`la fórmula "${f.id}" está repetida`);
    vistos.add(f.id);
    if (!CARPETAS_PUBLICAS.some((c) => f.archivo.startsWith(c)) || f.archivo.includes('..')) {
      errores.push(`la fórmula "${f.id}" enlaza "${f.archivo}": solo se permiten rutas dentro de funciones/ o plantillas/`);
    }
  }
  for (const flujo of e.flujos) {
    if (flujo.plantilla !== undefined && (!flujo.plantilla.startsWith('plantillas/') || flujo.plantilla.includes('..'))) {
      errores.push(`el flujo "${flujo.id}" enlaza la plantilla "${flujo.plantilla}": solo se permiten rutas dentro de plantillas/`);
    }
    flujo.pasos.forEach((p, i) => {
      if (!vistos.has(p.formula)) errores.push(`el flujo "${flujo.id}" (paso ${i + 1}) cita la fórmula "${p.formula}", que no existe`);
    });
  }
}

/** Fórmulas agrupadas por tema, en el orden en que aparece cada tema por primera vez. */
export function porTema<T extends { tema: string }>(formulas: T[]): { tema: string; formulas: T[] }[] {
  const grupos = new Map<string, T[]>();
  for (const f of formulas) {
    if (!grupos.has(f.tema)) grupos.set(f.tema, []);
    grupos.get(f.tema)!.push(f);
  }
  return [...grupos].map(([tema, fs]) => ({ tema, formulas: fs }));
}

/** Enlace «ver código» de una fórmula. */
export function enlace(e: ExamenMatlab, f: Formula): string {
  return e.repo + f.archivo;
}

/** Fórmulas con esos ids, en el mismo orden (en cualquiera de los dos formatos). Lanza un error que nombra cada id que no existe. */
export function formulasPorId(e: Examen, ids: string[]): Examen['formulas'][number][] {
  const lista: Examen['formulas'][number][] = e.formulas;
  const porId = new Map(lista.map((f) => [f.id, f]));
  const faltan = ids.filter((i) => !porId.has(i));
  if (faltan.length) throw new Error(`EnExamen: no existe${faltan.length > 1 ? 'n' : ''} ${faltan.map((i) => `la fórmula «${i}»`).join(', ')} en examen.yaml`);
  return ids.map((i) => porId.get(i)!);
}
