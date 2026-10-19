// Progreso del estudiante, guardado en el navegador (localStorage).
// Todo acceso al almacén pasa por aquí y va dentro de try/catch: en modo privado
// o con el almacén lleno, la web sigue funcionando, solo que sin guardar.
//
// Claves nuevas:
//   gitt-<asig>-<tema>         nivel del tema: 0 nada, 1 leído, 2 repasado, 3 dominado
//   gitt-<asig>-<tema>-saber   checklist "Lo que tienes que saber": JSON boolean[]
//   gitt-<asig>-tarjetas       notas de las tarjetas: JSON { pregunta: 0|1|2 }
//   gitt-<asig>-examen         marcas del modo examen: JSON { id: { mano: bool, matlab: bool } }
//   gitt-importado-cx          '1' cuando ya se ofreció traer el avance antiguo
//   gitt-tema                  'claro' u 'oscuro' (sin clave: lo que diga el sistema)
//
// Claves de la web antigua de Conmutación (mismo origen github.io). Se leen,
// nunca se escriben ni se borran:
//   cx-seen   JSON string[]: temas abiertos, con o sin "p-" delante ("p-arq" o "arq")
//   cx-done   JSON string[]: temas que el estudiante marcó como hechos
//   cx-know   JSON { pregunta: 0|1 }: 1 = «La sabía», 0 = «Repasar» (aquí pasan a 2 y 0)

export type Nivel = 0 | 1 | 2 | 3;

/** Lo que trae importarCx(): temas que subieron de nivel y notas de tarjetas copiadas. */
export interface Importado { temas: number; tarjetas: number }

/** Mensaje tras «Traer mi avance», p. ej. «Hecho: 1 tema y 5 tarjetas traídos.» */
export function textoImportado({ temas, tarjetas }: Importado): string {
  const t = `${temas} ${temas === 1 ? 'tema' : 'temas'}`;
  if (tarjetas === 0) return `Hecho: ${t} ${temas === 1 ? 'traído' : 'traídos'}.`;
  return `Hecho: ${t} y ${tarjetas} ${tarjetas === 1 ? 'tarjeta' : 'tarjetas'} traídos.`;
}

// Temas antiguos → temas nuevos de Conmutación
const MAPA_CX: Record<string, string> = {
  arq: 'arquitectura-gsm',
  um: 'interfaz-aerea',
  enlace: 'capa-enlace',
  rr: 'capa-red-rr',
  mm: 'gestion-movilidad',
  trafico: 'trafico-colas',
  problemas: 'problemas-guiados',
};

/** Marca de una fórmula en el modo examen. */
export interface MarcaExamen { mano: boolean; matlab: boolean }

export function crearProgreso(almacen: Storage | null) {
  function leer(clave: string): string | null {
    try { return almacen ? almacen.getItem(clave) : null; } catch { return null; }
  }
  function escribir(clave: string, valor: string): void {
    try { almacen?.setItem(clave, valor); } catch { /* bloqueado o lleno: no se guarda */ }
  }
  function leerJson<T>(clave: string, porDefecto: T): T {
    try {
      const v = leer(clave);
      return v === null ? porDefecto : (JSON.parse(v) as T);
    } catch { return porDefecto; }
  }

  // Probamos a escribir y borrar una clave para saber si se puede guardar
  let disponible = false;
  try {
    if (almacen) {
      almacen.setItem('gitt-prueba', '1');
      almacen.removeItem('gitt-prueba');
      disponible = true;
    }
  } catch { disponible = false; }

  function nivel(asig: string, tema: string): Nivel {
    const n = Number(leer(`gitt-${asig}-${tema}`));
    return n === 1 || n === 2 || n === 3 ? n : 0;
  }

  /** Sube el nivel. Para bajarlo (botón "Desmarcar") hay que pasar forzar = true. */
  function marcar(asig: string, tema: string, n: Nivel, forzar = false): void {
    if (forzar || n > nivel(asig, tema)) escribir(`gitt-${asig}-${tema}`, String(n));
  }

  function checklist(asig: string, tema: string, n: number): boolean[] {
    const guardada = leerJson<unknown>(`gitt-${asig}-${tema}-saber`, []);
    const lista = Array.isArray(guardada) ? guardada : [];
    return Array.from({ length: n }, (_, i) => lista[i] === true);
  }

  function marcarSaber(asig: string, tema: string, i: number, valor: boolean): void {
    const guardada = leerJson<unknown>(`gitt-${asig}-${tema}-saber`, []);
    const largo = Math.max(i + 1, Array.isArray(guardada) ? guardada.length : 0);
    const lista = checklist(asig, tema, largo);
    lista[i] = valor;
    escribir(`gitt-${asig}-${tema}-saber`, JSON.stringify(lista));
  }

  function tarjetas(asig: string): Record<string, 0 | 1 | 2> {
    const t = leerJson<unknown>(`gitt-${asig}-tarjetas`, {});
    return t && typeof t === 'object' && !Array.isArray(t) ? (t as Record<string, 0 | 1 | 2>) : {};
  }

  function guardarTarjeta(asig: string, pregunta: string, valor: 0 | 1 | 2): void {
    escribir(`gitt-${asig}-tarjetas`, JSON.stringify({ ...tarjetas(asig), [pregunta]: valor }));
  }

  /** Marcas del modo examen: por cada fórmula, si ya sale «a mano» y «en MATLAB». */
  function examen(asig: string): Record<string, MarcaExamen> {
    const e = leerJson<unknown>(`gitt-${asig}-examen`, {});
    return e && typeof e === 'object' && !Array.isArray(e) ? (e as Record<string, MarcaExamen>) : {};
  }

  function marcarExamen(asig: string, id: string, campo: keyof MarcaExamen, valor: boolean): void {
    const todas = examen(asig);
    const marca = { mano: todas[id]?.mano === true, matlab: todas[id]?.matlab === true, [campo]: valor };
    escribir(`gitt-${asig}-examen`, JSON.stringify({ ...todas, [id]: marca }));
  }

  // Lista de temas antiguos ya traducida a los nuevos; ignora lo que no se entienda
  function temasCx(clave: string): string[] {
    const lista = leerJson<unknown>(clave, []);
    if (!Array.isArray(lista)) return [];
    return lista
      .map((id) => (typeof id === 'string' ? MAPA_CX[id.replace(/^p-/, '')] : undefined))
      .filter((t): t is string => Boolean(t));
  }

  /** ¿Hay avance antiguo y aún no se ha ofrecido traerlo? */
  function cxPendiente(): boolean {
    if (leer('gitt-importado-cx') !== null) return false;
    return ['cx-seen', 'cx-done', 'cx-know'].some((k) => leer(k) !== null);
  }

  /** Trae el avance antiguo sin bajar ningún nivel. Devuelve cuántos temas y tarjetas trajo. */
  function importarCx(): Importado {
    if (!disponible) return { temas: 0, tarjetas: 0 };
    const objetivo = new Map<string, Nivel>();
    for (const t of temasCx('cx-seen')) objetivo.set(t, 1);
    for (const t of temasCx('cx-done')) objetivo.set(t, 3);
    let cambiados = 0;
    for (const [t, n] of objetivo) {
      if (n > nivel('conmutacion', t)) { marcar('conmutacion', t, n); cambiados++; }
    }
    // La web antigua solo tenía «La sabía» (1) y «Repasar» (0): pasan a 2 y 0.
    // Las notas nuevas mandan sobre las antiguas.
    let traidas = 0;
    const antiguas = leerJson<unknown>('cx-know', {});
    if (antiguas && typeof antiguas === 'object' && !Array.isArray(antiguas)) {
      const nuevas = tarjetas('conmutacion');
      const limpias: Record<string, 0 | 2> = {};
      for (const [q, v] of Object.entries(antiguas)) {
        if ((v === 0 || v === 1) && !(q in nuevas)) { limpias[q] = v === 1 ? 2 : 0; traidas++; }
      }
      escribir('gitt-conmutacion-tarjetas', JSON.stringify({ ...limpias, ...nuevas }));
    }
    escribir('gitt-importado-cx', '1');
    return { temas: cambiados, tarjetas: traidas };
  }

  /** "No, gracias": no se vuelve a ofrecer. */
  function rechazarCx(): void {
    escribir('gitt-importado-cx', '1');
  }

  /** Tema claro/oscuro elegido por el estudiante, o null para seguir al sistema. */
  function tema(): 'claro' | 'oscuro' | null {
    const t = leer('gitt-tema');
    return t === 'claro' || t === 'oscuro' ? t : null;
  }

  function guardarTema(t: 'claro' | 'oscuro'): void {
    escribir('gitt-tema', t);
  }

  return { disponible, nivel, marcar, checklist, marcarSaber, tarjetas, guardarTarjeta, examen, marcarExamen, cxPendiente, importarCx, rechazarCx, tema, guardarTema };
}

export type Progreso = ReturnType<typeof crearProgreso>;

/**
 * El localStorage del navegador, o null si no hay (al construir en Node) o si
 * está bloqueado: con los datos de sitios bloqueados, solo leerlo ya lanza.
 */
export function almacenDelNavegador(g: { localStorage?: Storage } = globalThis): Storage | null {
  try { return g.localStorage ?? null; } catch { return null; }
}

// El progreso de este navegador
const progreso = crearProgreso(almacenDelNavegador());
export default progreso;
