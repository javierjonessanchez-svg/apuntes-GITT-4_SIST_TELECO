// Texto con fórmulas para pistas, soluciones y desarrollos: el texto se escapa
// y cada trozo entre $…$ se pasa por KaTeX. Sirve en la construcción y en el
// navegador (los pasos de una calculadora se generan al pulsar).
import katex from 'katex';

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Una fórmula KaTeX suelta (sin los $). Si está mal escrita, se muestra como texto. */
export function formula(tex: string, bloque = false): string {
  try {
    return katex.renderToString(tex, { displayMode: bloque, throwOnError: true, output: 'html' });
  } catch {
    return `<code>${escapar(tex)}</code>`;
  }
}

/** **negrita** y *cursiva* de Markdown en un trozo de texto ya escapado. */
function enfasis(html: string): string {
  return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/** Texto con trozos $…$ (y **negrita** o *cursiva* fuera de ellos): devuelve HTML seguro. */
export function conMates(texto: string): string {
  return texto
    .split(/(\$[^$]+\$)/)
    .map((trozo) => (/^\$[^$]+\$$/.test(trozo) ? formula(trozo.slice(1, -1)) : enfasis(escapar(trozo))))
    .join('');
}
