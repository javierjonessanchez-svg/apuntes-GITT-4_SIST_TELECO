// Pasos de un cálculo («desarrollo»): texto con $…$ y una fórmula en bloque.
// Lo usan Desarrollo.astro (pasos fijos) y las calculadoras (pasos al pulsar).
import { conMates, formula } from './mates';

export type Paso = { texto: string; formula?: string /* KaTeX */ };

/** HTML de un paso: el texto y, debajo, su fórmula. */
export function htmlPaso(p: Paso): string {
  return `<p>${conMates(p.texto)}</p>${p.formula ? formula(p.formula, true) : ''}`;
}

/** Sustituye los pasos de una lista <ol data-desarrollo>. */
export function pintarDesarrollo(ol: HTMLElement, pasos: Paso[]): void {
  ol.innerHTML = pasos.map((p) => `<li>${htmlPaso(p)}</li>`).join('');
}
