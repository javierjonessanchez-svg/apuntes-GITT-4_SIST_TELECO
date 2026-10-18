// Modo examen: fórmulas y flujos por tipo de problema de una asignatura
// (contenido/<slug>/examen.yaml). El esquema lo usa la colección `examenes`;
// validarExamen comprueba lo que zod no ve (referencias y lo que puede ser público).
// Todo es puro: se prueba con Vitest sin Astro.
import { z } from 'astro/zod';

const id = z.string().regex(/^[a-z0-9-]+$/, 'solo minúsculas, cifras y guiones');

export const esquemaExamen = z.object({
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
    pasos: z.array(z.object({
      formula: z.string().min(1),
      nota: z.string().min(1).optional(),
    })).min(1),
  })),
});

export type Examen = z.infer<typeof esquemaExamen>;
export type Formula = Examen['formulas'][number];
export type Flujo = Examen['flujos'][number];
export type Paso = Flujo['pasos'][number];

// Solo se puede enlazar código de estas carpetas del repo privado
const CARPETAS_PUBLICAS = ['funciones/', 'plantillas/'];
// Restos de exámenes de otros años que no pueden acabar en la web
const PROHIBIDO = ['pei 1 radio', '2025-2026'];

/** Lanza un error con el archivo y el id si los datos tienen una referencia rota o algo que no puede ser público. */
export function validarExamen(e: Examen, archivo: string): void {
  const errores: string[] = [];
  const vistos = new Set<string>();
  for (const f of e.formulas) {
    if (vistos.has(f.id)) errores.push(`la fórmula "${f.id}" está repetida`);
    vistos.add(f.id);
    if (!CARPETAS_PUBLICAS.some((c) => f.archivo.startsWith(c)) || f.archivo.includes('..')) {
      errores.push(`la fórmula "${f.id}" enlaza "${f.archivo}": solo se permiten rutas dentro de funciones/ o plantillas/`);
    }
  }
  for (const flujo of e.flujos) {
    flujo.pasos.forEach((p, i) => {
      if (!vistos.has(p.formula)) errores.push(`el flujo "${flujo.id}" (paso ${i + 1}) cita la fórmula "${p.formula}", que no existe`);
    });
  }
  const texto = JSON.stringify(e).toLowerCase();
  for (const palabra of PROHIBIDO) {
    if (texto.includes(palabra)) errores.push(`el texto contiene "${palabra}" (material de exámenes antiguos)`);
  }
  if (errores.length) throw new Error(`${archivo}:\n- ${errores.join('\n- ')}`);
}

/** Fórmulas agrupadas por tema, en el orden en que aparece cada tema por primera vez. */
export function porTema(formulas: Formula[]): { tema: string; formulas: Formula[] }[] {
  const grupos = new Map<string, Formula[]>();
  for (const f of formulas) {
    if (!grupos.has(f.tema)) grupos.set(f.tema, []);
    grupos.get(f.tema)!.push(f);
  }
  return [...grupos].map(([tema, fs]) => ({ tema, formulas: fs }));
}

/** Enlace «ver código» de una fórmula. */
export function enlace(e: Examen, f: Formula): string {
  return e.repo + f.archivo;
}
