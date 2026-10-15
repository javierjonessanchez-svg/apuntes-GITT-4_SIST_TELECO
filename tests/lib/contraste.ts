// Contraste WCAG 2.x entre colores y lectura de los tokens de una hoja de tema.
// Lo usan las pruebas y el comprobador (node tests/comprobar-hub.mjs), que lo
// importa directamente: Node 24 quita los tipos de TypeScript, así que aquí no
// puede haber enum ni namespace.

export type Tokens = Record<string, string>;

function canal(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((x) => x + x).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Relación de contraste entre dos colores '#RRGGBB' o '#RGB' (de 1 a 21). */
export function ratio(hexA: string, hexB: string): number {
  const [claro, oscuro] = [luminancia(hexA), luminancia(hexB)].sort((x, y) => y - x);
  return Math.round(((claro + 0.05) / (oscuro + 0.05)) * 1000) / 1000;
}

/** Tokens de color (--nombre: #hex) de los bloques claro, oscuro y su copia en @media. */
export function leerTokens(css: string): { claro: Tokens; oscuro: Tokens; oscuroMedia: Tokens } {
  const salida = { claro: {} as Tokens, oscuro: {} as Tokens, oscuroMedia: {} as Tokens };
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, selector, cuerpo] of sinComentarios.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const colores: Tokens = {};
    for (const [, nombre, valor] of cuerpo.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;?/g)) colores[nombre] = valor;
    if (!Object.keys(colores).length) continue;
    const destino = selector.includes(':not([data-tema="claro"])') ? 'oscuroMedia'
      : selector.includes('[data-tema="oscuro"]') ? 'oscuro' : 'claro';
    Object.assign(salida[destino], colores);
  }
  return salida;
}

type Regla = { par: string; valor: number; minimo: number; pasa: boolean };

// [texto, fondo, mínimo]: 4,5 para texto normal; 3 para texto grande y partes de la interfaz
const PARES: [string, string, number][] = [
  ['texto', 'fondo', 4.5],
  ['texto', 'superficie', 4.5],
  ['suave', 'fondo', 4.5],
  ['suave', 'superficie', 4.5],
  ['sobre-primario', 'primario', 4.5],
  ['sobre-resalte', 'resalte', 4.5],
  ['primario', 'fondo', 3],
  ['primario', 'superficie', 3],
  ['acento', 'fondo', 3],
  ['acento2', 'fondo', 3],
];
// Pares propios de algunos mundos: solo se comprueban si el mundo define ambos tokens
const PARES_OPCIONALES: [string, string, number][] = [
  ['sobre-marco', 'marco', 4.5],
  ['texto', 'esmalte', 4.5],
  ['suave', 'esmalte', 4.5],
];

/** Aplica las reglas de contraste a un juego de tokens. Un token que falta cuenta como fallo. */
export function reglasContraste(t: Tokens): Regla[] {
  const reglas: Regla[] = [];
  const pares = [...PARES, ...PARES_OPCIONALES.filter(([a, b]) => t[a] && t[b])];
  for (const [a, b, minimo] of pares) {
    const valor = t[a] && t[b] ? ratio(t[a], t[b]) : 0;
    reglas.push({ par: `${a}/${b}`, valor, minimo, pasa: valor >= minimo });
  }
  return reglas;
}
