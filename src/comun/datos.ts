// Acceso a las asignaturas y temas de contenido/, ya ordenados y validados.
// validarPruebas es pura (se prueba sin Astro); las demás leen las colecciones.
import type { CollectionEntry } from 'astro:content';
import { validarExamen, type Examen } from './examen';

export type Prueba = {
  fecha: string;
  nombre: string;
  peso?: string;
  temas: string[];
  confirmar?: boolean;
};

/** Prueba con el nombre (corto) de su asignatura, para las líneas de tiempo. */
export type PruebaLinea = Prueba & { asignatura: string };

export type Asignatura = CollectionEntry<'asignaturas'>['data'] & { archivo: string };

export type Tema = CollectionEntry<'temas'>['data'] & {
  asignatura: string;
  slug: string;
  entrada: CollectionEntry<'temas'>;
};

/** Mensajes de error si alguna prueba cita un tema que no existe en su asignatura. */
export function validarPruebas(
  asigs: { slug: string; archivo: string; pruebas: Prueba[] }[],
  temas: { asignatura: string; slug: string }[],
): string[] {
  const errores: string[] = [];
  for (const a of asigs) {
    const propios = new Set(temas.filter((t) => t.asignatura === a.slug).map((t) => t.slug));
    a.pruebas.forEach((p, i) => {
      for (const t of p.temas) {
        if (!propios.has(t)) {
          errores.push(`${a.archivo}: la prueba "${p.nombre}" (pruebas[${i}]) cita el tema "${t}", que no existe en contenido/${a.slug}/temas/`);
        }
      }
    });
  }
  return errores;
}

export type Proximo = { titulo: string; orden: number; bloque: string };

/** Mensajes de error si un tema próximo repite el número de un tema real o de otro próximo. */
export function validarProximos(
  asigs: { slug: string; archivo: string; proximos?: Proximo[] }[],
  temas: { asignatura: string; slug: string; orden: number }[],
): string[] {
  const errores: string[] = [];
  for (const a of asigs) {
    const usados = new Set(temas.filter((t) => t.asignatura === a.slug).map((t) => t.orden));
    for (const p of a.proximos ?? []) {
      if (usados.has(p.orden)) {
        errores.push(`${a.archivo}: el tema próximo "${p.titulo}" usa el número ${p.orden}, que ya tiene otro tema`);
      }
      usados.add(p.orden);
    }
  }
  return errores;
}

// El id del cargador glob es "conmutacion/temas/arquitectura-gsm": nos quedamos
// con la asignatura (primera parte) y el tema (última parte).
function aTema(entrada: CollectionEntry<'temas'>): Tema {
  const partes = entrada.id.split('/');
  return { ...entrada.data, asignatura: partes[0], slug: partes[partes.length - 1], entrada };
}

async function todosLosTemas(): Promise<Tema[]> {
  // Importación dinámica: así validarPruebas se puede probar con Vitest sin Astro
  const { getCollection } = await import('astro:content');
  return (await getCollection('temas')).map(aTema);
}

/** Todas las asignaturas por su campo "orden". Lanza un error si alguna prueba es inválida. */
export async function asignaturasOrdenadas(): Promise<Asignatura[]> {
  const { getCollection } = await import('astro:content');
  const asigs = (await getCollection('asignaturas'))
    .map((e) => ({ ...e.data, archivo: e.filePath ?? `contenido/${e.id}.md` }))
    .sort((x, y) => x.orden - y.orden);
  const temas = await todosLosTemas();
  const errores = validarPruebas(asigs, temas);
  if (errores.length) throw new Error('Pruebas con temas inexistentes:\n' + errores.join('\n'));
  const choques = validarProximos(asigs, temas);
  if (choques.length) throw new Error('Temas próximos con número repetido:\n' + choques.join('\n'));
  return asigs;
}

/** Los temas de una asignatura, por su campo "orden". */
export async function temasDe(slug: string): Promise<Tema[]> {
  return (await todosLosTemas()).filter((t) => t.asignatura === slug).sort((x, y) => x.orden - y.orden);
}

/** Datos del modo examen de una asignatura (contenido/<slug>/examen.yaml), o undefined si no tiene. */
export async function examenDe(slug: string): Promise<Examen | undefined> {
  const { getCollection } = await import('astro:content');
  // El id del cargador glob es "<slug>/examen"
  const entrada = (await getCollection('examenes')).find((e) => e.id.split('/')[0] === slug);
  if (!entrada) return undefined;
  validarExamen(entrada.data, entrada.filePath ?? `contenido/${entrada.id}.yaml`);
  return entrada.data;
}
