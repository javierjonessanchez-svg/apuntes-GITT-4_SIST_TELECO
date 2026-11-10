// Esquema del contenido: Astro lo comprueba al construir. Si falta un campo o
// tiene un tipo equivocado, la construcción falla y dice el archivo y el campo.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { esquemaExamen } from './comun/examen';

// Una asignatura por carpeta: contenido/<slug>/asignatura.md
const asignaturas = defineCollection({
  loader: glob({ base: './contenido', pattern: '*/asignatura.md' }),
  schema: z.object({
    nombre: z.string().min(1),
    // nombre corto para el selector de la barra (cabe en un móvil)
    corto: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'solo minúsculas, cifras y guiones'),
    estado: z.enum(['activa', 'pendiente']),
    orden: z.number(),
    descripcion: z.string().min(1),
    nota: z.string().min(1).optional(),
    pruebas: z.array(z.object({
      fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'formato AAAA-MM-DD'),
      nombre: z.string().min(1),
      peso: z.string().optional(),
      temas: z.array(z.string()),
      confirmar: z.boolean().optional(),
    })),
    // Temas aún sin apuntes: la portada los enseña como «En preparación», sin enlace
    proximos: z.array(z.object({
      titulo: z.string().min(1),
      orden: z.number(),
      bloque: z.string().min(1),
    })).optional(),
  }),
});

// Un tema por archivo: contenido/<slug>/temas/<tema>.mdx
// Capa SOLO LOCAL: contenido/<slug>/privado/*.mdx (exámenes del profesor, con enunciados,
// figuras y soluciones oficiales). Está en .gitignore y aquí se excluye cuando se construye en
// GitHub Actions (variable GITHUB_ACTIONS) o con APUNTES_SIN_PRIVADO=1, así que nunca llega a
// la web pública. Ver contenido/README-privado.md.
const sinPrivado = process.env.GITHUB_ACTIONS === 'true' || process.env.APUNTES_SIN_PRIVADO === '1';
const patronesTemas = sinPrivado ? ['*/temas/*.mdx'] : ['*/temas/*.mdx', '*/privado/*.mdx'];

const temas = defineCollection({
  loader: glob({ base: './contenido', pattern: patronesTemas }),
  schema: z.object({
    titulo: z.string().min(1),
    orden: z.number(),
    bloque: z.string().min(1),
    resumen: z.string().min(1),
    saber: z.array(z.string().min(1)).min(1, 'la lista "saber" necesita al menos un punto'),
    fuentes: z.array(z.string()).optional(),
    // Preguntas tipo test: enunciado, opciones, índice de la correcta y explicación
    test: z.array(z.object({
      p: z.string().min(1),
      o: z.array(z.string().min(1)).min(2).max(4),
      c: z.number().int().min(0),
      e: z.string().optional(),
    }).refine((q) => q.c < q.o.length, { message: 'test: el índice «c» de la correcta se sale de las opciones' })).optional(),
  }),
});

// Modo examen (opcional): contenido/<slug>/examen.yaml con fórmulas y flujos
const examenes = defineCollection({
  loader: glob({ base: './contenido', pattern: '*/examen.yaml' }),
  schema: esquemaExamen,
});

export const collections = { asignaturas, temas, examenes };
