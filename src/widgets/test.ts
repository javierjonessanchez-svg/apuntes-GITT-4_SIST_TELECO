// Preguntas tipo test y simulacro de examen. Las preguntas salen del campo «test» de
// cada tema: enunciado (p), opciones (o), índice de la correcta (c) y una explicación (e).
// Aquí solo está la lógica pura (barajar, puntuar, elegir); los componentes la usan.

export type PreguntaTest = { p: string; o: string[]; c: number; e?: string };

/** Una pregunta lista para usar: con su tema y un id estable para guardar las falladas. */
export type ItemTest = PreguntaTest & { id: string; tema: string; titulo: string };

/** Una pregunta de desarrollo (de la sección «Preguntas de examen»). */
export type ItemDesarrollo = { pregunta: string; respuesta: string; tema: string; titulo: string };

/** Id corto y estable de una pregunta: el slug del tema y un hash del enunciado. */
export function idPregunta(tema: string, enunciado: string): string {
  let h = 5381;
  for (const ch of enunciado) h = ((h * 33) ^ ch.codePointAt(0)!) >>> 0;
  return `${tema}-${h.toString(36)}`;
}

/** Copia barajada (Fisher-Yates). «azar» se puede fijar en los tests. */
export function barajar<T>(xs: readonly T[], azar: () => number = Math.random): T[] {
  const r = [...xs];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Opciones en orden aleatorio, marcando cuál es la correcta. */
export function mezclarOpciones(q: PreguntaTest, azar: () => number = Math.random): { texto: string; correcta: boolean }[] {
  return barajar(q.o.map((texto, i) => ({ texto, correcta: i === q.c })), azar);
}

/** Resultado de una respuesta: null si se dejó en blanco. */
export type Respuesta = { opciones: number; acierto: boolean | null };

/**
 * Nota sobre 10 de un test. Con penalización, cada fallo resta 1/(k−1) de pregunta
 * (k = número de opciones), lo habitual en un tipo test; en blanco no suma ni resta.
 */
export function notaTest(respuestas: Respuesta[], penaliza = true): number {
  if (!respuestas.length) return 0;
  const puntos = respuestas.reduce((s, r) =>
    s + (r.acierto === true ? 1 : r.acierto === false && penaliza ? -1 / (r.opciones - 1) : 0), 0);
  return Math.max(0, Math.round((puntos / respuestas.length) * 100) / 10);
}

/** Preguntas de un simulacro: «nTest» de tipo test y «nDesarrollo» de desarrollo, repartidas entre temas. */
export function elegirSimulacro(
  test: ItemTest[], desarrollo: ItemDesarrollo[], nTest: number, nDesarrollo: number, azar: () => number = Math.random,
): { test: ItemTest[]; desarrollo: ItemDesarrollo[] } {
  // Desarrollo: como mucho una por tema mientras haya temas distintos
  const porTema = new Map<string, ItemDesarrollo[]>();
  for (const d of barajar(desarrollo, azar)) porTema.set(d.tema, [...(porTema.get(d.tema) ?? []), d]);
  const largas: ItemDesarrollo[] = [];
  for (let ronda = 0; largas.length < nDesarrollo && largas.length < desarrollo.length; ronda++) {
    for (const lista of barajar([...porTema.values()], azar)) {
      if (lista[ronda] && largas.length < nDesarrollo) largas.push(lista[ronda]);
    }
  }
  return { test: barajar(test, azar).slice(0, nTest), desarrollo: largas };
}

/** Aciertos y total por tema, para el resumen del final. */
export function resumenPorTema(items: { tema: string; titulo: string; acierto: boolean | null }[]): { tema: string; titulo: string; bien: number; total: number }[] {
  const m = new Map<string, { tema: string; titulo: string; bien: number; total: number }>();
  for (const it of items) {
    const r = m.get(it.tema) ?? { tema: it.tema, titulo: it.titulo, bien: 0, total: 0 };
    r.total++;
    if (it.acierto) r.bien++;
    m.set(it.tema, r);
  }
  return [...m.values()].sort((x, y) => x.bien / x.total - y.bien / y.total);
}
