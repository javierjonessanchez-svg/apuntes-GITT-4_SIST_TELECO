// Modo examen: fórmulas y flujos por tipo de problema de una asignatura
// (contenido/<slug>/examen.yaml). Dos formatos: el de MATLAB (fórmulas con su función
// y enlace al repo) y la hoja (`tipo: hoja`: fórmulas, registros y pasos por tipo de
// problema, sin código enlazado). El esquema lo usa la colección `examenes`;
// validarExamen comprueba lo que zod no ve (referencias y lo que puede ser público).
// Todo es puro: se prueba con Vitest sin Astro.
import { z } from 'astro/zod';

const id = z.string().regex(/^[a-z0-9-]+$/, 'solo minúsculas, cifras y guiones');

// Guía «¿qué tipo de problema es?»: árbol de decisión, tabla «me dan → me piden → función»
// e índice de funciones. Solo nombres de función y descripciones genéricas.
const nombreFuncion = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'nombre de función de MATLAB');
const esquemaGuia = z.object({
  arbol: z.object({
    inicio: id,
    nodos: z.array(z.object({
      id,
      pregunta: z.string().min(1),
      ayuda: z.string().min(1).optional(),
      opciones: z.array(z.object({
        texto: z.string().min(1),
        // Cada opción lleva a otra pregunta (`a`) o termina en un resultado
        a: id.optional(),
        resultado: z.object({
          titulo: z.string().min(1),
          texto: z.string().min(1),
          funciones: z.array(nombreFuncion).min(1),
          // true = no hay función programada para este caso
          pendiente: z.boolean().optional(),
        }).optional(),
      })).min(2),
    })).min(1),
  }),
  filas: z.array(z.object({
    tema: z.string().min(1),
    dan: z.string().min(1),
    piden: z.string().min(1),
    funciones: z.array(nombreFuncion),
    // hecho = hay función; mano = es una resta o cuenta directa; pendiente = sin programar
    estado: z.enum(['hecho', 'mano', 'pendiente']),
    nota: z.string().min(1).optional(),
  })).min(1),
  indice: z.array(z.object({
    tema: z.string().min(1),
    funcion: nombreFuncion,
    que: z.string().min(1),
    archivo: z.string().min(1),
  })).min(1),
});

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
  guia: esquemaGuia.optional(),
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
export type Guia = NonNullable<ExamenMatlab['guia']>;

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

function rutaPublica(archivo: string): boolean {
  return CARPETAS_PUBLICAS.some((c) => archivo.startsWith(c)) && !archivo.includes('..');
}

/** Comprueba la guía: el árbol no tiene huecos ni ciclos y cada función citada está en el índice. */
function validarGuia(g: Guia, errores: string[]): void {
  const funciones = new Set<string>();
  for (const i of g.indice) {
    if (funciones.has(i.funcion)) errores.push(`guía: la función "${i.funcion}" está repetida en el índice`);
    funciones.add(i.funcion);
    if (!rutaPublica(i.archivo)) errores.push(`guía: "${i.funcion}" enlaza "${i.archivo}": solo se permiten rutas dentro de funciones/ o plantillas/`);
  }
  const citar = (donde: string, lista: string[]) => {
    for (const f of lista) if (!funciones.has(f)) errores.push(`guía: ${donde} cita la función "${f}", que no está en el índice`);
  };
  g.filas.forEach((f, i) => {
    citar(`la fila ${i + 1} (${f.piden})`, f.funciones);
    if (f.estado === 'hecho' && !f.funciones.length && !f.nota) errores.push(`guía: la fila ${i + 1} (${f.piden}) está «hecho» sin función ni nota`);
    if (f.estado === 'pendiente' && f.funciones.length) errores.push(`guía: la fila ${i + 1} (${f.piden}) está pendiente pero cita funciones`);
  });

  const nodos = new Map(g.arbol.nodos.map((n) => [n.id, n]));
  if (nodos.size !== g.arbol.nodos.length) errores.push('guía: hay ids de nodo repetidos en el árbol');
  if (!nodos.has(g.arbol.inicio)) errores.push(`guía: el nodo de inicio "${g.arbol.inicio}" no existe`);
  for (const n of g.arbol.nodos) {
    n.opciones.forEach((o, i) => {
      const donde = `el nodo "${n.id}" (opción ${i + 1})`;
      if ((o.a === undefined) === (o.resultado === undefined)) errores.push(`guía: ${donde} debe tener o «a» o «resultado», no los dos ni ninguno`);
      if (o.a !== undefined && !nodos.has(o.a)) errores.push(`guía: ${donde} salta a "${o.a}", que no existe`);
      if (o.resultado) citar(donde, o.resultado.funciones);
    });
  }
  // Todo nodo se alcanza desde el inicio, y sin vueltas atrás (si no, el árbol no acaba)
  const alcanzados = new Set<string>();
  const camino: string[] = [];
  const visitar = (id: string) => {
    if (camino.includes(id)) { errores.push(`guía: el árbol da una vuelta: ${[...camino, id].join(' → ')}`); return; }
    alcanzados.add(id);
    const n = nodos.get(id);
    if (!n) return;
    camino.push(id);
    for (const o of n.opciones) if (o.a !== undefined) visitar(o.a);
    camino.pop();
  };
  visitar(g.arbol.inicio);
  for (const id of nodos.keys()) if (!alcanzados.has(id)) errores.push(`guía: el nodo "${id}" no se alcanza desde el inicio`);
}

function validarMatlab(e: ExamenMatlab, errores: string[]): void {
  const vistos = new Set<string>();
  for (const f of e.formulas) {
    if (vistos.has(f.id)) errores.push(`la fórmula "${f.id}" está repetida`);
    vistos.add(f.id);
    if (!rutaPublica(f.archivo)) {
      errores.push(`la fórmula "${f.id}" enlaza "${f.archivo}": solo se permiten rutas dentro de funciones/ o plantillas/`);
    }
  }
  if (e.guia) validarGuia(e.guia, errores);
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
