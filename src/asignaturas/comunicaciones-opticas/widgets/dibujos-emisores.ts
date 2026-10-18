// Dibujos de los widgets de los emisores (temas 6, 7 y 8). Cada función recibe el
// estado de los controles y devuelve el SVG (viewBox 480 de ancho) y la frase que lo
// explica. Son puras: se usan al construir (estado inicial) y en el navegador.
import { COL, barraEspectro, c, colorLuz, cota, flecha, foton, l, marcaAbajo, nombreLuz, onda, p, r, t, type Dibujo } from './dibujo';
import { anchoPico, curvaFP, finezaMedida, lambdaPozo, picosModos, potenciaPI, retrasoEncendido, sumaFasores, umbral } from './fisica';
import { nmDeEv } from '../../../widgets/espectro';
import { fmt } from '../../../widgets/numeros';

const mezcla = (col: string, pct: number, con: string = COL.superficie) => `color-mix(in srgb,${col} ${pct}%,${con})`;
const gauss = (x: number, mu: number, fwhm: number) => Math.exp(-4 * Math.LN2 * ((x - mu) / fwhm) ** 2);

// ---------- Tema 6: bandas de un LED ----------
export type EstadoBandas = { tipo: 'directo' | 'indirecto'; gap: number };

/** Electrón y hueco que se recombinan: con gap directo sale un fotón de energía = gap; con indirecto, calor. */
export function dibujarBandas({ tipo, gap }: EstadoBandas, uid = 'bandas'): Dibujo {
  const nm = nmDeEv(gap), directo = tipo === 'directo';
  const col = colorLuz(nm), ir = nm > 750;
  const gapPx = 44 + (gap - 0.6) / 2.4 * 96;
  const yCond = 34, yBordeC = yCond + 22, yVal = yBordeC + gapPx, yMed = (yBordeC + yVal) / 2;
  const barra = barraEspectro(`${uid}-esp`, 20, 252, 440, 14, 350, 2100);
  let h = barra.svg;
  h += r(20, yCond, 310, 22, { fill: mezcla(COL.azul, 18), stroke: COL.azul, rx: 4 });
  h += r(20, yVal, 310, 22, { fill: mezcla(COL.naranja, 18), stroke: COL.naranja, rx: 4 });
  h += t(28, yCond - 7, 'Banda de conducción', { peso: 600, col: COL.suave });
  h += t(28, yVal + 40, 'Banda de valencia', { peso: 600, col: COL.suave });
  h += flecha(66, yMed - 4, 66, yBordeC + 2, { w: 1.4, col: COL.suave, tam: 6 }) + flecha(66, yMed + 4, 66, yVal - 2, { w: 1.4, col: COL.suave, tam: 6 });
  h += t(74, yMed + 5, 'gap', { tam: 14, peso: 700 });
  const caida = Math.round(yVal - yBordeC - 18);
  h += `<g class="op-cae" style="--cae:${caida}px">${c(160, yBordeC + 11, 8, { fill: COL.azul })}${t(160, yBordeC + 15, '−', { ancla: 'middle', peso: 700, col: COL.superficie })}</g>`;
  h += c(160, yVal - 11, 8, { fill: COL.superficie, stroke: COL.naranja, sw: 2.4 }) + t(160, yVal - 7, '+', { ancla: 'middle', peso: 700, col: COL.naranja });
  h += t(176, yBordeC + 15, 'electrón', { tam: 12, col: COL.azul }) + t(176, yVal - 6, 'hueco', { tam: 12, col: COL.naranja });
  if (directo) {
    h += flecha(160, yBordeC + 22, 160, yVal - 21, { col: COL.suave, dash: '4 3', w: 1.5, tam: 6 });
    h += `<g class="op-luz">${foton(214, yMed, 322, yMed, col, { dash: ir ? '5 3' : '' })}</g>`;
    h += t(270, yMed - 12, 'fotón', { ancla: 'middle', peso: 600, col });
    h += t(270, yMed + 24, 'su energía = el gap', { ancla: 'middle', tam: 12, col: COL.suave });
    h += marcaAbajo(barra.x(nm), 251);
  } else {
    h += p(`M160,${yBordeC + 22} L190,${yMed - 4} L136,${yMed + 6} L160,${yVal - 21}`, { col: COL.suave, dash: '4 3', w: 1.5 });
    for (let i = 0; i < 3; i++) h += p(onda(206, yMed - 16 + i * 16, 100, 4, 3, i), { col: COL.rojo, w: 2, op: 0.85 });
    h += t(342, yMed + 5, 'calor, no luz', { tam: 14, peso: 700, col: COL.rojo });
  }
  h += t(barra.x(565), 284, 'luz visible', { ancla: 'middle', tam: 12, col: COL.suave });
  h += t(barra.x(1300), 284, 'infrarrojo →', { ancla: 'middle', tam: 12, col: COL.suave });
  const info = directo
    ? `λ = 1239,84 / ${fmt(gap, 2)} eV ≈ <b>${fmt(nm / 1000, 2)} µm</b>: ${nombreLuz(nm)}.`
    : 'Con gap indirecto (el silicio, por ejemplo) la recombinación da calor, no luz.';
  return { svg: h, info };
}

// ---------- Temas 6 y 7: forma del haz ----------
export type EstadoHaz = { fuente: 'led' | 'laser'; lente: boolean };

/** Rayos de un LED (lambertiano) o de un láser (cono estrecho) hacia el núcleo de una fibra. */
export function dibujarHaz({ fuente, lente }: EstadoHaz): Dibujo {
  const led = fuente === 'led', conLente = led && lente;
  const ex = 56, ey = 130, fx = 372, mitad = 24, lx = 160;
  const angulos = led ? [-80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80] : [-4, -2, 0, 2, 4];
  const col = led ? COL.naranja : COL.rojo;
  let h = '';
  if (led) h += c(ex + 54, ey, 54, { fill: mezcla(COL.naranja, 10, 'transparent'), stroke: COL.naranja, sw: 1, op: 0.5 });
  h += r(fx, ey - 46, 74, 92, { fill: COL.superficie, stroke: COL.linea, rx: 4 });
  h += r(fx, ey - mitad, 74, mitad * 2, { fill: mezcla(COL.primario, 22), stroke: COL.primario, sw: 1.4 });
  h += t(fx + 37, ey + 72, 'Fibra', { ancla: 'middle', peso: 600 });
  h += t(fx + 37, ey + 8, 'núcleo', { ancla: 'middle', tam: 12, col: COL.suave });
  if (conLente) {
    h += `<path d="M${lx},${ey - 58} Q${lx + 16},${ey} ${lx},${ey + 58} Q${lx - 16},${ey} ${lx},${ey - 58} Z" fill="${mezcla(COL.azul, 18)}" stroke="${COL.azul}" stroke-width="1.6"/>`;
    h += t(lx, ey + 76, 'lente', { ancla: 'middle', tam: 12, col: COL.azul });
  }
  for (const g of angulos) {
    const tg = Math.tan(g * Math.PI / 180);
    let pts: number[][], entra: boolean;
    if (conLente) {
      const yl = ey + tg * (lx - ex);
      if (Math.abs(yl - ey) <= 56) {
        const yf = ey + (yl - ey) * 0.11;
        pts = [[ex, ey], [lx, yl], [fx, yf]]; entra = Math.abs(yf - ey) <= mitad;
      } else { pts = [[ex, ey], [lx - 4, yl]]; entra = false; }
    } else {
      const y = ey + tg * (fx - ex);
      entra = Math.abs(y - ey) <= mitad;
      const k = Math.min(1, 118 / Math.abs(y - ey || 1));
      pts = [[ex, ey], [ex + (fx - ex) * k, ey + (y - ey) * k]];
    }
    const d = 'M' + pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L');
    h += p(d, { col: entra ? col : COL.suave, w: entra ? 2.2 : 1.1, dash: entra ? '' : '4 4', op: entra ? 1 : 0.55 });
  }
  h += c(ex, ey, 10, { fill: col }) + t(ex - 8, ey + 30, led ? 'LED' : 'Láser', { tam: 14, peso: 700, col });
  h += t(ex - 8, ey - 22, 'emisor', { tam: 12, col: COL.suave });
  const info = !led ? 'El láser emite en un cono estrecho: entra la mayor parte de la luz.'
    : conLente ? 'La lente (o el pigtail) concentra la luz y entra más, pero sigue siendo poca.'
    : 'Solo entra <b>≈ 1 %</b> de la luz del LED: emite en todo el hemisferio.';
  return { svg: h, info };
}

// ---------- Temas 6, 7 y 12: anchura espectral ----------
export type EstadoEspectros = { led: boolean; fp: boolean; dfb: boolean };

/** Espectro de un LED (≈ 50 nm), un láser FP (≈ 4 nm) y un DFB (< 1 nm) sobre canales DWDM de ≈ 0,8 nm. */
export function dibujarEspectros(ver: EstadoEspectros, uid = 'espectros'): Dibujo {
  const PX = 8.8, X0 = 240, BASE = 214;
  const canal = (i: number) => X0 + (i - 3.5) * 0.8 * PX;
  let h = `<defs><clipPath id="${uid}-clip"><rect x="14" y="30" width="452" height="190"/></clipPath></defs>`;
  let lx = 16;
  for (const [k, txt, col] of [['led', 'LED ≈ 50 nm', COL.naranja], ['fp', 'Láser FP ≈ 4 nm', COL.azul], ['dfb', 'Láser DFB < 1 nm', COL.verde]] as const) {
    if (!ver[k]) continue;
    h += c(lx + 5, 14, 5, { fill: col }) + t(lx + 14, 18, txt, { peso: 600 });
    lx += 26 + txt.length * 7.2;
  }
  h += `<g clip-path="url(#${uid}-clip)">`;
  if (ver.led) {
    let d = `M14,${BASE}`;
    for (let x = 14; x <= 466; x += 4) d += ` L${x},${(BASE - 112 * gauss(x, X0, 50 * PX)).toFixed(1)}`;
    h += p(`${d} L466,${BASE} Z`, { fill: mezcla(COL.naranja, 22, 'transparent'), col: COL.naranja, w: 2.4 });
  }
  if (ver.fp) {
    let env = `M${X0 - 90},${BASE}`;
    for (let x = X0 - 90; x <= X0 + 90; x += 3) env += ` L${x},${(BASE - 128 * gauss(x, X0, 4 * PX)).toFixed(1)}`;
    h += p(env, { col: COL.azul, w: 1.2, dash: '4 3', op: 0.7 });
    for (const m of picosModos('FP')) {
      const x = X0 + m * PX;
      h += l(x, BASE, x, BASE - 128 * gauss(x, X0, 4 * PX), { col: COL.azul, w: 2.4 });
    }
  }
  if (ver.dfb) h += l(canal(3), BASE, canal(3), BASE - 168, { col: COL.verde, w: 3 });
  h += '</g>';
  h += flecha(14, BASE, 466, BASE, { w: 1.4, tam: 7 });
  for (let i = 0; i < 8; i++) h += l(canal(i), BASE, canal(i), BASE + 14, { col: COL.suave, w: 2.2 });
  h += t(X0, BASE + 32, 'canales DWDM (≈ 0,8 nm)', { ancla: 'middle', col: COL.suave });
  h += t(464, BASE + 32, 'longitud de onda →', { ancla: 'end', tam: 12, col: COL.suave });
  const info = ver.dfb ? 'Una raya fina cabe en su canal: es lo que pide DWDM.'
    : ver.fp ? 'Un láser FP ocupa varios canales a la vez: no sirve para DWDM.'
    : ver.led ? 'Un LED ocuparía decenas de canales a la vez: no se puede multiplexar.'
    : 'Marca algún emisor para ver su espectro.';
  return { svg: h, info };
}

// ---------- Tema 7: coherencia ----------
export type EstadoCoherencia = { modo: 'espontanea' | 'estimulada' };
const FASES = [0, 2.1, 4.3, 1.2, 5.5, 3.3, 0.7, 4.9, 2.8, 5.9, 1.9, 3.9];

/** Doce fotones y la onda que resulta de sumarlos: en fase (estimulada) o con fases al azar (espontánea). */
export function dibujarCoherencia({ modo }: EstadoCoherencia, uid = 'coherencia'): Dibujo {
  const estimulada = modo === 'estimulada';
  const fases = estimulada ? FASES.map(() => 0.7) : FASES;
  const col = estimulada ? COL.naranja : COL.suave, L = 50;
  let h = `<defs><clipPath id="${uid}-a"><rect x="20" y="22" width="200" height="190"/></clipPath><clipPath id="${uid}-b"><rect x="262" y="22" width="200" height="190"/></clipPath></defs>`;
  h += t(120, 16, 'doce fotones', { ancla: 'middle', peso: 700 }) + t(362, 16, 'luz resultante (la suma)', { ancla: 'middle', peso: 700 });
  h += r(20, 22, 200, 190, { fill: COL.superficie, stroke: COL.linea, rx: 6 }) + r(262, 22, 200, 190, { fill: COL.superficie, stroke: COL.linea, rx: 6 });
  h += `<g clip-path="url(#${uid}-a)"><g class="op-viaja" style="--per:${L}px">`;
  fases.forEach((f, i) => { h += p(onda(-L, 36 + i * 15, 200 + 2 * L, 5.5, (200 + 2 * L) / L, -f, 160), { col, w: 1.8, op: 0.9 }); });
  h += '</g></g>';
  const N = 200;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const x = 262 - L + (200 + 2 * L) * i / N;
    let s = 0;
    for (const f of fases) s += Math.sin(2 * Math.PI * (x - 262) / L - f);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)},${(117 - 6.8 * s).toFixed(1)}`;
  }
  h += `<g clip-path="url(#${uid}-b)"><g class="op-viaja" style="--per:${L}px">${p(d, { col: COL.primario, w: 2.8 })}</g></g>`;
  h += l(262, 117, 462, 117, { col: COL.suave, w: 0.8, dash: '3 3' });
  h += t(362, 232, estimulada ? 'ondas en fase → suma grande' : 'fases al azar → suma pequeña', { ancla: 'middle', peso: 600, col: COL.primario });
  h += t(120, 232, estimulada ? 'todas en fase' : 'cada una con su fase', { ancla: 'middle', col: COL.suave });
  const amplitud = Math.round(sumaFasores(fases) * 100);
  const info = estimulada
    ? `Todos los fotones salen en fase y las ondas se suman (amplitud ${amplitud} % de la máxima): <b>luz coherente</b>.`
    : `Cada fotón sale con su propia fase y las ondas se cancelan en parte (amplitud ${amplitud} %): <b>luz incoherente</b>, sin información de fase.`;
  return { svg: h, info };
}

// ---------- Tema 7: resonador Fabry-Pérot ----------
export type EstadoResonador = { R: number; alineamiento: number };

/** Dos espejos con el rayo rebotando y la curva de transmisión (dos rangos espectrales libres). */
export function dibujarResonador({ R, alineamiento }: EstadoResonador): Dibujo {
  const inclina = (1 - alineamiento) * 12;
  const XL = 74, XR = 394, Y0 = 26, Y1 = 150;
  let h = r(XL, Y0, XR - XL, Y1 - Y0, { fill: mezcla(COL.primario, 7) });
  h += l(XL, Y0 - 6, XL, Y1 + 6, { w: 6 });
  const dx = Math.tan(inclina * Math.PI / 180) * (Y1 - Y0) / 2;
  h += l(XR + dx, Y0 - 6, XR - dx, Y1 + 6, { w: 6 });
  h += t(XL, Y1 + 24, 'espejo', { ancla: 'middle', col: COL.suave }) + t(XR, Y1 + 24, 'espejo', { ancla: 'middle', col: COL.suave });
  const maxRebotes = Math.round(2 + 10 * (R - 0.5) / 0.495);
  const dy = 4 + inclina * 2.4;
  let y = 52, x = XL, rebotes = 0, sale = false;
  h += flecha(20, 52, XL - 2, 52, { col: COL.primario, w: 2.4, tam: 7 });
  for (let k = 0; k < maxRebotes; k++) {
    const hacia = k % 2 === 0 ? XR : XL, yn = y + dy;
    if (yn > Y1 - 6) { sale = true; break; }
    h += l(x, y, hacia, yn, { col: COL.primario, w: 2.2, op: Math.max(0.28, R ** k) });
    x = hacia; y = yn; rebotes++;
  }
  if (sale) h += flecha(x, y, x + (x === XR ? 26 : -26), y + 18, { col: COL.rojo, w: 1.6, dash: '3 3', tam: 6 });
  h += t(XR + 16, 56, `${rebotes} rebotes`, { tam: 12, col: COL.suave });
  const curva = curvaFP(R, alineamiento, 240);
  const ancho = anchoPico(curva);
  const BASE = 262, ALTO = 68, XA = 40, PER = 200;
  let cv = `M${XA},${BASE}`;
  for (let k = 0; k < 2; k++) curva.forEach((v, i) => { cv += ` L${(XA + k * PER + PER * i / curva.length).toFixed(1)},${(BASE - ALTO * v).toFixed(1)}`; });
  h += p(`${cv} L${XA + 2 * PER},${BASE} Z`, { fill: mezcla(COL.primario, 22, 'transparent'), col: COL.primario, w: 2.4 });
  h += flecha(XA - 6, BASE, XA + 2 * PER + 14, BASE, { w: 1.3, tam: 6 });
  h += t(XA + 2 * PER + 14, BASE + 16, 'longitud de onda →', { ancla: 'end', tam: 12, col: COL.suave });
  const p1 = XA + PER / 2, p2 = XA + PER * 1.5;
  h += cota(p1, 286, p2, 286, { col: COL.naranja, w: 1.6, tam: 6 });
  h += t((p1 + p2) / 2, 301, 'rango espectral libre', { ancla: 'middle', col: COL.naranja, peso: 600 });
  const w = ancho * PER, yh = BASE - ALTO / 2;
  h += l(p1 - w / 2, yh, p1 + w / 2, yh, { col: COL.rojo, w: 2.2 }) + l(p1 - w / 2, yh - 5, p1 - w / 2, yh + 5, { col: COL.rojo, w: 2 }) + l(p1 + w / 2, yh - 5, p1 + w / 2, yh + 5, { col: COL.rojo, w: 2 });
  h += t(Math.max(12, p1 - w / 2 - 8), yh + 4, 'anchura', { ancla: 'end', col: COL.rojo, peso: 600 });
  const f = finezaMedida(curvaFP(R, alineamiento, 2000));
  const info = (f < 6 ? 'Picos anchos: <b>fineza baja</b> (Q bajo).' : f <= 30 ? 'Picos más finos: <b>fineza media</b>.' : 'Picos muy finos: <b>fineza alta</b> (Q alto).')
    + (alineamiento < 0.6 ? ' El desalineamiento los ensancha.' : '');
  return { svg: h, info };
}

// ---------- Tema 7: curva P-I ----------
export type EstadoCurvaPI = { vista: 'pi' | 'bits'; T: number; bias: number };

/** Curva P-I con la zona LED y la zona láser, o el tren de bits que sale con esa polarización. */
export function dibujarCurvaPI({ vista, T, bias }: EstadoCurvaPI): Dibujo {
  const Ith = umbral(T), Ib = Ith * bias / 100, Ipico = Ib + 15;
  const P = (i: number) => potenciaPI(i, Ith);
  const retraso = bias < 100, zonaLaser = Ib >= Ith;
  let h = '';
  if (vista === 'pi') {
    const PX0 = 56, PX1 = 452, PY0 = 36, PY1 = 232, IMAX = 40, PMAX = 10;
    const x = (i: number) => PX0 + i / IMAX * (PX1 - PX0), y = (q: number) => PY1 - q / PMAX * (PY1 - PY0);
    const xu = Math.min(x(Ith), PX1);
    h += r(x(0), PY0, xu - x(0), PY1 - PY0, { fill: mezcla(COL.suave, 14, 'transparent') });
    h += r(xu, PY0, PX1 - xu, PY1 - PY0, { fill: mezcla(COL.naranja, 11, 'transparent') });
    h += t(Math.max(x(0) + 4, (x(0) + xu) / 2 - 14), PY0 + 18, 'LED', { peso: 700, col: COL.suave });
    if (xu < PX1 - 30) h += t((xu + PX1) / 2, PY0 + 18, 'láser', { ancla: 'middle', peso: 700, col: COL.naranja });
    if (T - 20 > 4) {
      const i0 = umbral(20);
      h += l(x(i0), PY0, x(i0), PY1, { col: COL.suave, w: 1.2, dash: '4 4' }) + t(x(i0) - 4, PY1 - 8, 'a 20 °C', { ancla: 'end', tam: 12, col: COL.suave });
    }
    h += l(xu, PY0, xu, PY1, { w: 1.8, dash: '5 3' }) + t(xu, PY0 - 6, 'umbral', { ancla: 'middle', tam: 12, peso: 600 });
    let d = '';
    for (let i = 0; i <= IMAX; i += 0.5) d += `${i ? 'L' : 'M'}${x(i).toFixed(1)},${Math.max(PY0, y(P(i))).toFixed(1)}`;
    h += p(d, { col: COL.primario, w: 3 });
    h += flecha(PX0, PY1, PX1 + 14, PY1, { w: 1.4, tam: 7 }) + flecha(PX0, PY1, PX0, PY0 - 10, { w: 1.4, tam: 7 });
    h += t(PX1 + 14, PY1 + 18, 'corriente →', { ancla: 'end', tam: 12, col: COL.suave });
    h += t(PX0 - 14, (PY0 + PY1) / 2, 'potencia óptica', { ancla: 'middle', tam: 12, col: COL.suave, rot: -90 });
    if (Ib <= IMAX) {
      const yb = Math.max(PY0, y(P(Ib)));
      h += l(x(Ib), yb, x(Ib), PY1, { col: COL.rojo, w: 1.2, dash: '3 3' }) + c(x(Ib), yb, 6, { fill: COL.rojo, stroke: COL.superficie, sw: 2 });
      h += t(Math.min(x(Ib) + 10, 360), Math.max(PY0 + 34, yb - 10), 'punto de trabajo', { tam: 12, peso: 600, col: COL.rojo });
    }
    if (T > 50) h += t(240, 262, '¡Por encima de ≈ 50 °C la emisión se degrada!', { ancla: 'middle', tam: 14, peso: 700, col: COL.rojo });
  } else {
    const X0 = 70, BW = 74, bits = [1, 0, 1, 1, 0], FIN = X0 + BW * bits.length;
    const yi = (i: number) => 128 - Math.min(i, 60) / 60 * 92;
    h += t(10, 24, 'Corriente', { peso: 700 }) + t(10, 40, 'de excitación', { tam: 12, col: COL.suave });
    h += l(X0 - 10, yi(Ith), FIN + 6, yi(Ith), { w: 1.6, dash: '5 3' }) + t(FIN + 8, yi(Ith) + 4, 'umbral', { tam: 12, peso: 600 });
    let cc = '';
    bits.forEach((b, k) => { const yy = yi(b ? Ipico : Ib), xx = X0 + k * BW; cc += `${k ? 'L' : 'M'}${xx},${yy.toFixed(1)} L${xx + BW},${yy.toFixed(1)} `; });
    h += p(cc, { col: COL.azul, w: 2.6 });
    h += l(X0 - 10, yi(0), FIN + 6, yi(0), { col: COL.suave, w: 1, dash: '2 4' });
    const P1 = P(Ipico), P0 = P(Ib), escala = Math.max(P1, 3);
    const yp = (q: number) => 270 - q / escala * 96;
    const td = retrasoEncendido(Ipico, Ib, Ith), px = retraso ? Math.min(td, 6) / 6 * 26 : 0;
    h += t(10, 196, 'Luz', { peso: 700 }) + t(10, 212, 'a la salida', { tam: 12, col: COL.suave });
    h += l(X0 - 10, 270, FIN + 6, 270, { col: COL.suave, w: 1, dash: '2 4' }) + t(FIN + 8, 274, '0', { tam: 12, col: COL.suave });
    let o = '';
    bits.forEach((b, k) => {
      const xx = X0 + k * BW, prev = k ? bits[k - 1] : 0, y1 = yp(b ? P1 : P0), y0 = yp(prev ? P1 : P0);
      const subida = b && !prev ? px : 0;
      o += `${k ? 'L' : 'M'}${xx},${y0.toFixed(1)} L${xx + subida},${y0.toFixed(1)} L${xx + subida + 6},${y1.toFixed(1)} L${xx + BW},${y1.toFixed(1)} `;
    });
    h += p(o, { col: COL.naranja, w: 2.8 });
    if (retraso && px > 0) {
      h += flecha(X0 + 2 * BW, 168, X0 + 2 * BW + Math.max(px, 14), 168, { col: COL.rojo, w: 1.8, tam: 6 });
      h += t(X0 + 2 * BW - 6, 162, 'retardo (jitter)', { ancla: 'end', tam: 12, peso: 600, col: COL.rojo });
    }
    if (Ib > 0) h += t(X0 + BW + 6, yp(P0) - 6, 'el 0 no es «cero fotones»', { tam: 12, peso: 600, col: COL.rojo });
  }
  const info = (zonaLaser ? 'Por encima del umbral domina la <b>emisión estimulada</b>.' : 'Por debajo del umbral el láser actúa como un LED: poca luz y sin coherencia.')
    + (retraso ? ' Si se deja por debajo del umbral, tarda en volver a encender: <b>jitter</b>.' : '');
  return { svg: h, info };
}

// ---------- Tema 8: pozo cuántico ----------
export type EstadoPozo = { ancho: number };

/** Perfil de energía de un pozo cuántico: más estrecho → más confinamiento → más gap → λ más corta. */
export function dibujarPozo({ ancho }: EstadoPozo, uid = 'pozo'): Dibujo {
  const nm = lambdaPozo(ancho), col = colorLuz(nm);
  const w = 28 + (ancho - 3) / 17 * 150, xa = 250 - w / 2, xb = 250 + w / 2;
  const conf = Math.min(34, 200 * 6.35 / (ancho * ancho));
  const yC = 62, yCp = 104, yVp = 176, yV = 218, ye = yCp - conf, yh = yVp + conf;
  let h = '';
  h += r(40, yC - 18, 400, 18, { fill: mezcla(COL.azul, 10, 'transparent') }) + r(40, yV, 400, 18, { fill: mezcla(COL.naranja, 10, 'transparent') });
  h += p(`M40,${yC} L${xa},${yC} L${xa},${yCp} L${xb},${yCp} L${xb},${yC} L440,${yC}`, { col: COL.azul, w: 3 });
  h += p(`M40,${yV} L${xa},${yV} L${xa},${yVp} L${xb},${yVp} L${xb},${yV} L440,${yV}`, { col: COL.naranja, w: 3 });
  h += t(44, yC - 4, 'banda de conducción', { tam: 12, col: COL.azul, peso: 600 }) + t(44, yV + 14, 'banda de valencia', { tam: 12, col: COL.naranja, peso: 600 });
  h += t(80, yV - 14, 'barrera', { ancla: 'middle', col: COL.suave }) + t(400, yV - 14, 'barrera', { ancla: 'middle', col: COL.suave });
  h += t(250, yCp + 40, 'pozo', { ancla: 'middle', peso: 700, col: COL.primario });
  h += l(xa + 3, ye, xb - 3, ye, { col: COL.azul, w: 1.8, dash: '5 3' }) + l(xa + 3, yh, xb - 3, yh, { col: COL.naranja, w: 1.8, dash: '5 3' });
  let o = '';
  for (let i = 0; i <= 40; i++) o += `${i ? 'L' : 'M'}${(xa + (xb - xa) * i / 40).toFixed(1)},${(ye - 14 * Math.sin(Math.PI * i / 40)).toFixed(1)}`;
  h += p(o, { col: COL.azul, w: 2.2 }) + c(250, ye - 7, 6, { fill: COL.azul });
  h += c(250, yh + 7, 6, { fill: COL.superficie, stroke: COL.naranja, sw: 2.4 });
  h += flecha(250, ye + 4, 250, yh - 4, { col: COL.suave, w: 1.4, dash: '4 3', tam: 6 });
  h += foton(xb + 12, (ye + yh) / 2, 436, (ye + yh) / 2, col, { dash: nm > 750 ? '5 3' : '' });
  h += cota(xa, yVp + 46, xb, yVp + 46, { w: 1.4, tam: 6 });
  h += t(250, yVp + 64, 'anchura del pozo', { ancla: 'middle', tam: 12, col: COL.suave });
  const barra = barraEspectro(`${uid}-esp`, 40, 270, 400, 12, 350, 1000);
  h += barra.svg + marcaAbajo(barra.x(nm), 269);
  h += t(40, 296, '← más azul', { tam: 12, col: COL.suave }) + t(440, 296, 'más rojo →', { ancla: 'end', tam: 12, col: COL.suave });
  const info = `Más estrecho → más energía de confinamiento → más gap → λ más corta. Con esta anchura la luz sale en el <b>${nombreLuz(nm)}</b>.`;
  return { svg: h, info };
}

// ---------- Tema 8: FP, DBR y DFB ----------
export type EstadoDbrDfb = { tipo: 'FP' | 'DBR' | 'DFB' };

/** Cavidad con espejos (FP), con redes de Bragg en los extremos (DBR) o a lo largo de todo el medio (DFB), y su espectro. */
export function dibujarDbrDfb({ tipo }: EstadoDbrDfb): Dibujo {
  const red = (x0: number, x1: number, y0: number, y1: number) => { let s = ''; for (let x = x0; x <= x1; x += 8) s += r(x, y0, 4, y1 - y0, { fill: COL.violeta, op: 0.85 }); return s; };
  const Y0 = 52, Y1 = 118, XA = 84, XB = 396;
  let h = r(XA, Y0, XB - XA, Y1 - Y0, { fill: mezcla(COL.naranja, 14), stroke: COL.naranja, sw: 1.6, rx: 4 });
  h += t((XA + XB) / 2, (Y0 + Y1) / 2 + 5, 'medio activo', { ancla: 'middle', col: COL.suave, peso: 600 });
  if (tipo === 'FP') {
    h += l(XA, Y0 - 8, XA, Y1 + 8, { w: 6 }) + l(XB, Y0 - 8, XB, Y1 + 8, { w: 6 });
    h += t(XA, Y1 + 28, 'espejo', { ancla: 'middle', col: COL.suave }) + t(XB, Y1 + 28, 'espejo', { ancla: 'middle', col: COL.suave });
  } else if (tipo === 'DBR') {
    h += red(XA - 44, XA - 4, Y0 - 8, Y1 + 8) + red(XB + 4, XB + 44, Y0 - 8, Y1 + 8);
    h += t(XA - 22, Y1 + 28, 'red de Bragg', { ancla: 'middle', tam: 12, col: COL.violeta, peso: 600 }) + t(XB + 24, Y1 + 28, 'red de Bragg', { ancla: 'middle', tam: 12, col: COL.violeta, peso: 600 });
  } else {
    h += red(XA + 4, XB - 8, Y0 + 2, Y1 - 2);
    h += l(XA, Y0 - 8, XA, Y1 + 8, { w: 4 }) + l(XB, Y0 - 8, XB, Y1 + 8, { w: 4 });
    h += t((XA + XB) / 2, Y1 + 28, 'red de Bragg a lo largo de todo el medio activo', { ancla: 'middle', tam: 12, col: COL.violeta, peso: 600 });
  }
  h += flecha(XB + (tipo === 'DBR' ? 48 : 6), (Y0 + Y1) / 2, XB + 72, (Y0 + Y1) / 2, { col: COL.naranja, w: 2.6, tam: 8 });
  const PXN = 30, CXE = 240, BASE = 270;
  h += flecha(40, BASE, 450, BASE, { w: 1.4, tam: 7 }) + t(450, BASE + 20, 'longitud de onda →', { ancla: 'end', tam: 12, col: COL.suave });
  h += t(40, 178, 'Espectro de salida', { peso: 700 });
  const fp = tipo === 'FP', modos = picosModos(tipo);
  if (fp) {
    let env = '';
    for (let x = CXE - 130; x <= CXE + 130; x += 4) env += `${env ? 'L' : 'M'}${x},${(BASE - 78 * gauss(x, CXE, 4 * PXN)).toFixed(1)}`;
    h += p(env, { col: COL.suave, w: 1.2, dash: '4 3' });
  }
  for (const m of modos) {
    const x = CXE + m * PXN;
    h += l(x, BASE, x, BASE - (fp ? 78 * gauss(x, CXE, 4 * PXN) : 84), { col: fp ? COL.azul : COL.verde, w: fp ? 3 : 4 });
  }
  h += t(CXE + 150, 205, fp ? 'varios modos' : 'un solo modo', { peso: 700, col: fp ? COL.azul : COL.verde });
  const info = {
    FP: 'El Fabry-Pérot deja pasar varios modos longitudinales: no sirve para DWDM.',
    DBR: 'Los espejos se sustituyen por <b>redes de Bragg</b>, filtros que dejan pasar una única longitud de onda.',
    DFB: 'El propio medio activo hace de filtro, como un hojaldre de capas con distinto índice. Es el más usado en DWDM.',
  }[tipo];
  return { svg: h, info };
}

// ---------- Tema 8: modulación directa y externa ----------
export type EstadoModulacion = { modo: 'directa' | 'externa' };
const BITS = [1, 0, 1, 1, 0, 0, 1, 0];

/** Bits, montaje y potencia de salida: modulación directa (retardo, oscilaciones, chirp) o láser continuo + modulador. */
export function dibujarModulacion({ modo }: EstadoModulacion): Dibujo {
  const dir = modo === 'directa', X0 = 90, BW = 46, FIN = X0 + BW * BITS.length;
  const nivelEn = (x: number) => { const i = Math.floor((x - X0) / BW); return i < 0 || i >= BITS.length ? 0 : BITS[i]; };
  let h = '', d = '';
  BITS.forEach((b, i) => { const y = b ? 30 : 62, x = X0 + i * BW; d += `${i ? 'L' : 'M'}${x},${y} L${x + BW},${y} `; });
  h += t(14, 52, 'Bits', { tam: 14, peso: 700 }) + p(d, { w: 2.2 });
  BITS.forEach((b, i) => { h += t(X0 + i * BW + BW / 2, 22, String(b), { ancla: 'middle', col: COL.suave }); });
  h += l(X0, 76, FIN, 76, { col: COL.linea, w: 1 });
  const bloque = (x: number, w: number, txt: string, col: string) => r(x, 90, w, 32, { fill: mezcla(col, 14), stroke: col, rx: 7, sw: 1.8 }) + t(x + w / 2, 111, txt, { ancla: 'middle', peso: 600 });
  h += t(14, 111, 'Montaje', { col: COL.suave });
  if (dir) {
    h += bloque(X0, 96, 'Corriente', COL.azul) + flecha(X0 + 96, 106, X0 + 140, 106) + bloque(X0 + 140, 80, 'Láser', COL.naranja) + flecha(X0 + 220, 106, X0 + 266, 106);
    h += t(X0 + 274, 111, 'luz', { peso: 600, col: COL.naranja });
  } else {
    h += bloque(X0, 120, 'Láser continuo', COL.naranja) + flecha(X0 + 120, 106, X0 + 150, 106) + bloque(X0 + 150, 96, 'Modulador', COL.verde) + flecha(X0 + 246, 106, X0 + 290, 106);
    h += t(X0 + 298, 111, 'luz', { peso: 600, col: COL.naranja });
  }
  const base = 270, alto = 186, bajo = dir ? 238 : 262;
  h += t(14, 214, 'Potencia', { tam: 14, peso: 700 }) + t(14, 231, 'a la salida', { tam: 12, col: COL.suave });
  h += l(X0 - 10, base, FIN + 6, base, { col: COL.suave, w: 1, dash: '2 4' }) + t(FIN + 8, base + 4, '0', { tam: 12, col: COL.suave });
  if (dir) {
    // Respuesta de segundo orden poco amortiguada: retardo y oscilaciones tras cada flanco
    const om = 0.3, z = 0.5, retardo = 8;
    let y = bajo, v = 0, o = '';
    for (let x = X0 - 6; x <= FIN; x++) {
      const objetivo = nivelEn(x - retardo) ? alto : bajo;
      v += om * om * (objetivo - y) - 2 * z * om * v; y += v;
      o += `${o ? 'L' : 'M'}${x},${y.toFixed(1)}`;
    }
    h += p(o, { col: COL.naranja, w: 2.6 });
    const xe = X0 + 2 * BW;
    h += l(xe, 62, xe, 205, { col: COL.suave, w: 1, dash: '3 3' }) + flecha(xe, 200, xe + 16, 200, { w: 1.4, col: COL.rojo, tam: 5 });
    h += r(FIN - 218, 128, 218, 36, { fill: mezcla(COL.rojo, 8), stroke: COL.rojo, rx: 8, sw: 1.2 });
    h += t(FIN - 208, 143, 'retardo (jitter)', { peso: 600, col: COL.rojo }) + t(FIN - 208, 159, 'chirp: el espectro se ensancha', { tam: 12, col: COL.rojo });
    h += t(X0 + BW + 4, 256, 'el 0 no baja a cero', { tam: 12, col: COL.suave });
  } else {
    let o = `M${X0},${bajo}`;
    BITS.forEach((b, i) => { const x = X0 + i * BW, y = b ? alto : bajo; o += ` L${x},${y} L${x + BW},${y}`; });
    h += p(o, { col: COL.naranja, w: 2.6 });
    h += r(FIN - 218, 128, 218, 28, { fill: mezcla(COL.verde, 8), stroke: COL.verde, rx: 8, sw: 1.2 });
    h += t(FIN - 208, 147, 'láser siempre encendido: sin chirp', { peso: 600, col: COL.verde });
  }
  const info = dir ? 'Barata y sin elementos ópticos de más, pero introduce retardo y <b>chirp</b>, y estresa el láser.'
    : 'Hace falta un modulador externo (más caro), pero evita el chirp y permite mucha más velocidad.';
  return { svg: h, info };
}
