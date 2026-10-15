// Pone el nivel guardado (0–3) en cada elemento [data-avance]. Cada mundo
// decide cómo se dibuja a partir de data-nivel (barras, lámparas, LEDs…).
import progreso from '../progreso';

const TEXTOS = ['Sin empezar', 'Leído', 'Repasado', 'Dominado'];

export function pintarAvance(raiz: ParentNode = document): void {
  for (const el of raiz.querySelectorAll<HTMLElement>('[data-avance]')) {
    const nivel = progreso.nivel(el.dataset.asig!, el.dataset.tema!);
    el.dataset.nivel = String(nivel);
    const texto = el.querySelector('[data-avance-texto]');
    if (texto) texto.textContent = TEXTOS[nivel];
  }
}

/** Barras de las tarjetas: cuántos temas de la asignatura están dominados. */
export function pintarBarras(raiz: ParentNode = document): void {
  for (const el of raiz.querySelectorAll<HTMLElement>('[data-avance-barra]')) {
    const temas = (el.dataset.temas ?? '').split(',').filter(Boolean);
    const dominados = temas.filter((t) => progreso.nivel(el.dataset.asig!, t) === 3).length;
    el.style.setProperty('--p', String(temas.length ? dominados / temas.length : 0));
    const texto = el.querySelector('[data-avance-barra-texto]');
    if (texto) texto.textContent = `${dominados} de ${temas.length} temas dominados`;
  }
}

pintarAvance();
pintarBarras();
