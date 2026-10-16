// Progreso del estudiante, guardado en el navegador (localStorage).
// Todo acceso al almacén pasa por aquí y va dentro de try/catch: en modo privado
// o con el almacén lleno, la web sigue funcionando, solo que sin guardar.
//
// Claves nuevas:
//   gitt-<asig>-<tema>         nivel del tema: 0 nada, 1 leído, 2 repasado, 3 dominado
//   gitt-<asig>-<tema>-saber   checklist "Lo que tienes que saber": JSON boolean[]
//   gitt-<asig>-tarjetas       notas de las tarjetas: JSON { pregunta: 0|1|2 }
//   gitt-importado-cx          '1' cuando ya se ofreció traer el avance antiguo
//   gitt-tema                  'claro' u 'oscuro' (sin clave: lo que diga el sistema)
//
// Claves de la web antigua de Conmutación (mismo origen github.io). Se leen,
// nunca se escriben ni se borran:
//   cx-seen   JSON string[]: temas abiertos, con o sin "p-" delante ("p-arq" o "arq")
//   cx-done   JSON string[]: temas que el estudiante marcó como hechos
//   cx-know   JSON { pregunta: 0|1|2 }: notas del modo repaso (tarjetas)

export type Nivel = 0 | 1 | 2 | 3;

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

  /** Trae el avance antiguo sin bajar ningún nivel. Devuelve cuántos temas cambiaron. */
  function importarCx(): number {
    if (!disponible) return 0;
    const objetivo = new Map<string, Nivel>();
    for (const t of temasCx('cx-seen')) objetivo.set(t, 1);
    for (const t of temasCx('cx-done')) objetivo.set(t, 3);
    let cambiados = 0;
    for (const [t, n] of objetivo) {
      if (n > nivel('conmutacion', t)) { marcar('conmutacion', t, n); cambiados++; }
    }
    // Las notas nuevas mandan sobre las antiguas
    const antiguas = leerJson<unknown>('cx-know', {});
    if (antiguas && typeof antiguas === 'object' && !Array.isArray(antiguas)) {
      const limpias = Object.fromEntries(
        Object.entries(antiguas).filter(([, v]) => v === 0 || v === 1 || v === 2),
      ) as Record<string, 0 | 1 | 2>;
      escribir('gitt-conmutacion-tarjetas', JSON.stringify({ ...limpias, ...tarjetas('conmutacion') }));
    }
    escribir('gitt-importado-cx', '1');
    return cambiados;
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

  return { disponible, nivel, marcar, checklist, marcarSaber, tarjetas, guardarTarjeta, cxPendiente, importarCx, rechazarCx, tema, guardarTema };
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
