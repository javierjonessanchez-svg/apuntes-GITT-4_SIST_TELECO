// Ayudas para dibujar los widgets de Ópticas: cada función devuelve texto SVG.
// Los colores van con variables CSS (tokens del mundo), así que valen en claro y oscuro.
import { colorDe, paradas } from '../../../widgets/espectro';

/** Lo que devuelve cada widget al dibujarse: el SVG y la frase que lo explica. */
export type Dibujo = { svg: string; info: string };

// Colores de los dibujos (se definen en tema.css, con su versión oscura)
export const COL = {
  texto: 'var(--texto)', suave: 'var(--suave)', linea: 'var(--linea)', fondo: 'var(--fondo)', superficie: 'var(--superficie)',
  primario: 'var(--primario)', naranja: 'var(--op-naranja)', azul: 'var(--op-azul)', verde: 'var(--op-verde)',
  rojo: 'var(--op-rojo)', violeta: 'var(--op-violeta)',
} as const;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

type Trazo = { col?: string; w?: number; dash?: string; op?: number };

/** Texto. */
export function t(x: number, y: number, txt: string, o: { ancla?: 'start' | 'middle' | 'end'; tam?: number; peso?: number; col?: string; rot?: number } = {}): string {
  const { ancla = 'start', tam = 13, peso = 400, col = COL.texto, rot = 0 } = o;
  const giro = rot ? ` transform="rotate(${rot} ${n1(x)} ${n1(y)})"` : '';
  return `<text x="${n1(x)}" y="${n1(y)}" text-anchor="${ancla}" font-size="${tam}" font-weight="${peso}" fill="${col}"${giro}>${esc(txt)}</text>`;
}

/** Línea recta. */
export function l(x1: number, y1: number, x2: number, y2: number, o: Trazo = {}): string {
  const { col = COL.texto, w = 1.5, dash = '', op = 1 } = o;
  return `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${col}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}${op < 1 ? ` opacity="${op}"` : ''}/>`;
}

/** Rectángulo. */
export function r(x: number, y: number, w: number, h: number, o: { fill?: string; stroke?: string; sw?: number; rx?: number; op?: number } = {}): string {
  const { fill = 'none', stroke = 'none', sw = 1.5, rx = 0, op = 1 } = o;
  return `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
}

/** Círculo. */
export function c(cx: number, cy: number, radio: number, o: { fill?: string; stroke?: string; sw?: number; op?: number } = {}): string {
  const { fill = 'none', stroke = 'none', sw = 1.5, op = 1 } = o;
  return `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${radio}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
}

/** Trazado libre (d de un <path>). */
export function p(d: string, o: Trazo & { fill?: string; cls?: string } = {}): string {
  const { fill = 'none', col = COL.texto, w = 1.5, dash = '', op = 1, cls = '' } = o;
  return `<path d="${d}" fill="${fill}" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}${op < 1 ? ` opacity="${op}"` : ''}${cls ? ` class="${cls}"` : ''}/>`;
}

/** Línea con punta de flecha en el extremo final. */
export function flecha(x1: number, y1: number, x2: number, y2: number, o: Trazo & { tam?: number } = {}): string {
  const { col = COL.texto, w = 1.8, dash = '', tam = 8, op = 1 } = o;
  const a = Math.atan2(y2 - y1, x2 - x1), ca = Math.cos(a), sa = Math.sin(a);
  const bx = x2 - ca * tam, by = y2 - sa * tam;
  const p1 = `${n1(bx - sa * tam * 0.45)},${n1(by + ca * tam * 0.45)}`, p2 = `${n1(bx + sa * tam * 0.45)},${n1(by - ca * tam * 0.45)}`;
  return `<g${op < 1 ? ` opacity="${op}"` : ''}>${l(x1, y1, bx + ca, by + sa, { col, w, dash })}<polygon points="${n1(x2)},${n1(y2)} ${p1} ${p2}" fill="${col}"/></g>`;
}

/** Flecha de doble punta (una cota). */
export function cota(x1: number, y1: number, x2: number, y2: number, o: Trazo & { tam?: number } = {}): string {
  return flecha(x1, y1, x2, y2, o) + flecha(x2, y2, x1, y1, o);
}

/** d de una onda senoidal horizontal: «ciclos» periodos en «ancho», amplitud amp y fase en radianes. */
export function onda(x0: number, y0: number, ancho: number, amp: number, ciclos: number, fase = 0, n = 90): string {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = x0 + ancho * i / n, y = y0 - amp * Math.sin(2 * Math.PI * ciclos * i / n + fase);
    d += `${i ? 'L' : 'M'}${n1(x)},${n1(y)}`;
  }
  return d;
}

/** Un fotón: flecha ondulada de (x1, y1) a (x2, y2). */
export function foton(x1: number, y1: number, x2: number, y2: number, col: string, o: { dash?: string; amp?: number; largo?: number; w?: number } = {}): string {
  const { dash = '', amp = 4, largo = 14, w = 2 } = o;
  const L = Math.hypot(x2 - x1, y2 - y1) - 7, a = Math.atan2(y2 - y1, x2 - x1);
  const n = Math.max(12, Math.round(L / 2)), ciclos = L / largo;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const u = L * i / n, v = amp * Math.sin(2 * Math.PI * ciclos * i / n);
    d += `${i ? 'L' : 'M'}${n1(x1 + u * Math.cos(a) - v * Math.sin(a))},${n1(y1 + u * Math.sin(a) + v * Math.cos(a))}`;
  }
  return p(d, { col, w, dash }) + flecha(x1 + (L - 2) * Math.cos(a), y1 + (L - 2) * Math.sin(a), x2, y2, { col, w: 0.1, tam: 9 });
}

/** Color con el que se pinta la luz de λ nm: el visible con su color; el infrarrojo, que no se ve, en gris. */
export function colorLuz(nm: number): string {
  return nm >= 380 && nm <= 750 ? colorDe(nm) : COL.suave;
}

/** Nombre de la zona del espectro de λ nm. */
export function nombreLuz(nm: number): string {
  if (nm < 380) return 'ultravioleta';
  if (nm < 450) return 'violeta';
  if (nm < 495) return 'azul';
  if (nm < 570) return 'verde';
  if (nm < 590) return 'amarillo';
  if (nm < 620) return 'naranja';
  if (nm <= 750) return 'rojo';
  if (nm < 1400) return 'infrarrojo cercano';
  return 'infrarrojo';
}

/** Barra de espectro de «desde» a «hasta» nm en (x, y, w, h). id: único en la página. */
export function barraEspectro(id: string, x: number, y: number, w: number, h: number, desde: number, hasta: number) {
  const stops = paradas(desde, hasta).map((s) => `<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${s.color}"/>`).join('');
  return {
    svg: `<defs><linearGradient id="${id}">${stops}</linearGradient></defs>` + r(x, y, w, h, { fill: `url(#${id})`, rx: 3 }),
    x: (nm: number) => x + w * Math.min(1, Math.max(0, (nm - desde) / (hasta - desde))),
  };
}

/** Marca triangular que apunta hacia abajo, con la punta en (x, y). */
export function marcaAbajo(x: number, y: number, col = COL.texto): string {
  return `<path d="M${n1(x)},${n1(y)} l-6,-9 l12,0 z" fill="${col}"/>`;
}
