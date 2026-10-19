// Dibujos de los widgets de la fibra (temas 1 a 5).
// Mismo contrato que dibujos-emisores.ts: estado de los controles → SVG + frase.
import { COL, c, cota, flecha, l, onda, p, r, t, type Dibujo } from './dibujo';
import {
  anguloCritico, aperturaNumerica, atenuacionFibra, dispersionD, ensanchamiento, productosFWM, rayleigh, retardoOtdr, snell,
} from './fisica-fibra';
import { VENTANAS } from '../../../widgets/espectro';
import { fmt } from '../../../widgets/numeros';

const mezcla = (col: string, pct: number, con: string = COL.superficie) => `color-mix(in srgb,${col} ${pct}%,${con})`;
const RAD = Math.PI / 180;

/** d de una campana de Gauss sobre la base y, de x0 a x1. */
function campana(cx: number, base: number, sigma: number, alto: number, x0: number, x1: number): string {
  let d = '';
  for (let x = x0; x <= x1; x += 2) d += `${d ? 'L' : 'M'}${x},${(base - alto * Math.exp(-(((x - cx) / sigma) ** 2) / 2)).toFixed(1)}`;
  return d;
}

// ---------- Tema 1: reflexión total interna ----------
export type EstadoReflexion = { angulo: number; n1: number };
export const N2_RECUBRIMIENTO = 1.44;

/** Un rayo que llega a la frontera núcleo-recubrimiento: se refracta y sale, o se refleja entero si θ ≥ θc. */
export function dibujarReflexion({ angulo, n1 }: EstadoReflexion): Dibujo {
  const n2 = N2_RECUBRIMIENTO, tc = anguloCritico(n1, n2), sale = snell(angulo, n1, n2), na = aperturaNumerica(n1, n2);
  const Y = 116, PX = 240, L = 112, s = Math.sin(angulo * RAD), co = Math.cos(angulo * RAD);
  let h = r(20, 20, 440, Y - 20, { fill: mezcla(COL.azul, 8) }) + r(20, Y, 440, 120, { fill: mezcla(COL.primario, 16) });
  h += l(20, Y, 460, Y, { col: COL.linea });
  h += t(30, 40, `recubrimiento · n₂ = ${fmt(n2, 2)}`, { tam: 12, col: COL.suave });
  h += t(30, Y + 110, `núcleo · n₁ = ${fmt(n1, 2)}`, { tam: 12, col: COL.suave });
  h += l(PX, 26, PX, Y + 116, { col: COL.suave, w: 1, dash: '4 4' }) + t(PX + 6, 36, 'normal', { tam: 11, col: COL.suave });
  // Ángulo crítico, como referencia
  const sc = Math.sin(tc * RAD), cc = Math.cos(tc * RAD);
  h += l(PX, Y, PX - 100 * sc, Y + 100 * cc, { col: COL.naranja, w: 1.4, dash: '5 4' });
  h += t(PX - 104 * sc - 4, Y + 104 * cc + 4, 'θc', { ancla: 'end', tam: 12, peso: 700, col: COL.naranja });
  // Rayo que llega, su ángulo y lo que sale
  h += p(`M${PX},${Y + 40} A40 40 0 0 1 ${(PX - 40 * s).toFixed(1)},${(Y + 40 * co).toFixed(1)}`, { col: COL.texto, w: 1.2 });
  h += t(PX - 50 * Math.sin(angulo * RAD / 2) - 4, Y + 56 * Math.cos(angulo * RAD / 2) + 4, 'θ', { ancla: 'end', tam: 12, peso: 700 });
  h += flecha(PX - L * s, Y + L * co, PX, Y, { col: COL.primario, w: 2.4 });
  h += flecha(PX, Y, PX + L * s, Y + L * co, { col: COL.primario, w: sale === null ? 2.4 : 1.4, op: sale === null ? 1 : 0.45 });
  if (sale !== null) {
    const L2 = 88;
    h += flecha(PX, Y, PX + L2 * Math.sin(sale * RAD), Y - L2 * Math.cos(sale * RAD), { col: COL.rojo, w: 2.2 });
  }
  h += t(452, 40, sale === null ? 'reflexión total' : 'se escapa al recubrimiento', { ancla: 'end', tam: 13, peso: 700, col: sale === null ? COL.verde : COL.rojo });
  h += t(20, 258, `θc = arcsen(n₂/n₁) = ${fmt(tc, 1)}°   ·   NA = √(n₁² − n₂²) = ${fmt(na, 2)}`, { tam: 12, col: COL.suave });
  const cono = Math.asin(Math.min(1, na)) / RAD;
  const info = (sale === null
    ? `θ = ${fmt(angulo, 0)}° supera θc = ${fmt(tc, 1)}°: <b>reflexión total</b>, la luz se queda en el núcleo.`
    : `θ = ${fmt(angulo, 0)}° no llega a θc = ${fmt(tc, 1)}°: parte de la luz <b>se refracta y sale</b> del núcleo.`)
    + ` Con n₁ = ${fmt(n1, 2)}, la luz puede entrar con hasta ≈ ${fmt(cono, 0)}° respecto al eje.`;
  return { svg: h, info };
}

// ---------- Tema 1: salto de índice, índice gradual y monomodo ----------
export type TipoFibra = 'salto' | 'gradual' | 'monomodo';

/** Perfil de índice, caminos de la luz y cuánto se ensancha un pulso en cada tipo de fibra. */
export function dibujarTipos({ tipo }: { tipo: TipoFibra }): Dibujo {
  const X0 = 96, X1 = 460, YC = 104, a = tipo === 'monomodo' ? 8 : 46;
  let h = t(20, 26, 'perfil n(r)', { tam: 11, col: COL.suave }) + t(X0, 26, 'corte longitudinal: caminos de la luz', { tam: 11, col: COL.suave });
  h += r(X0, YC - 64, X1 - X0, 128, { fill: mezcla(COL.azul, 8), stroke: COL.linea, sw: 1 });
  if (tipo === 'gradual') {
    for (let k = 5; k >= 0; k--) h += r(X0, YC - ((k + 1) * a) / 6, X1 - X0, ((k + 1) * a) / 3, { fill: mezcla(COL.primario, 7, 'transparent') });
  } else h += r(X0, YC - a, X1 - X0, 2 * a, { fill: mezcla(COL.primario, 22) });
  // Perfil de índice: el radio en vertical y n hacia la derecha
  h += l(24, YC - 64, 24, YC + 64, { col: COL.suave, w: 1 });
  const nb = 40, na = 70;
  const perfil = tipo === 'gradual'
    ? `M${nb},${YC - 64} V${YC - a} ` + Array.from({ length: 21 }, (_, i) => {
      const y = -a + (2 * a * i) / 20;
      return `L${(nb + (na - nb) * (1 - (y / a) ** 2)).toFixed(1)},${(YC + y).toFixed(1)}`;
    }).join(' ') + ` V${YC + 64}`
    : `M${nb},${YC - 64} V${YC - a} H${na} V${YC + a} H${nb} V${YC + 64}`;
  h += p(perfil, { col: COL.primario, w: 2 });
  h += t(nb, YC + 80, 'n₂', { ancla: 'middle', tam: 11, col: COL.suave }) + t(na, YC + 80, 'n₁', { ancla: 'middle', tam: 11, col: COL.suave });
  // Caminos de la luz
  const cols = [COL.verde, COL.naranja, COL.rojo];
  if (tipo === 'salto') {
    [0, 0.32, 0.75].forEach((pend, i) => {
      let x = X0, y = YC, dir = -1, d = `M${x},${y}`;
      if (pend === 0) d += ` L${X1},${YC}`;
      else while (x < X1) {
        const destino = YC + dir * a, dx = Math.abs(destino - y) / pend;
        const xs = Math.min(X1, x + dx);
        y += dir * pend * (xs - x); x = xs; d += ` L${x.toFixed(1)},${y.toFixed(1)}`; dir = -dir;
      }
      h += p(d, { col: cols[i], w: 1.8 });
    });
  } else if (tipo === 'gradual') {
    [0, 0.5, 0.88].forEach((amp, i) => { h += p(onda(X0, YC, X1 - X0, amp * a, 2.5, Math.PI), { col: cols[i], w: 1.8 }); });
  } else h += l(X0, YC, X1, YC, { col: COL.verde, w: 2 });
  // El pulso a la entrada y a la salida
  const ensancha = { salto: 4, gradual: 1.8, monomodo: 1.1 }[tipo], YB = 238, s0 = 7;
  h += p(campana(150, YB, s0, 40, 110, 190), { col: COL.primario, w: 2 }) + l(100, YB, 200, YB, { col: COL.linea, w: 1 });
  h += flecha(214, YB - 16, 262, YB - 16, { col: COL.suave, w: 1.4 });
  h += p(campana(370, YB, s0 * ensancha, 40 / ensancha, 280, 460), { col: COL.primario, w: 2 }) + l(280, YB, 460, YB, { col: COL.linea, w: 1 });
  h += t(150, YB + 18, 'pulso que entra', { ancla: 'middle', tam: 11, col: COL.suave }) + t(370, YB + 18, 'pulso que sale', { ancla: 'middle', tam: 11, col: COL.suave });
  const info = {
    salto: 'Salto de índice multimodo: cada modo sigue un camino distinto. El que va recto llega antes que el que rebota, y el pulso se ensancha: <b>dispersión modal</b>.',
    gradual: 'Índice gradual: n baja hacia el borde, así que los rayos que se alejan del eje van más rápido (v = c/n) y compensan su camino más largo. <b>Mucho menos ensanchamiento</b>.',
    monomodo: 'Monomodo: núcleo de ≈ 8 µm, solo viaja un modo. <b>No hay dispersión modal</b>; queda la cromática (tema 3).',
  }[tipo];
  return { svg: h, info };
}

// ---------- Tema 2: curva de atenuación ----------
export type EstadoAtenuacion = { lambda: number; fibra: 'clasica' | 'g652d' };

/** Atenuación (dB/km) frente a λ: Rayleigh, pico del agua e infrarrojo, con las tres ventanas. */
export function dibujarAtenuacion({ lambda, fibra }: EstadoAtenuacion): Dibujo {
  const XA = 56, XB = 460, YT = 24, YB = 206, DESDE = 800, HASTA = 1700, TOPE = 2.5;
  const x = (nm: number) => XA + ((nm - DESDE) / (HASTA - DESDE)) * (XB - XA);
  const y = (db: number) => YB - (Math.min(db, TOPE) / TOPE) * (YB - YT);
  const pico = fibra === 'clasica';
  let h = '';
  for (let db = 0.5; db <= TOPE; db += 0.5) h += l(XA, y(db), XB, y(db), { col: COL.linea, w: 1 }) + t(XA - 6, y(db) + 4, fmt(db, 1), { ancla: 'end', tam: 11, col: COL.suave });
  h += l(XA, YB, XB, YB, { col: COL.suave }) + t(16, (YT + YB) / 2, 'dB/km', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  for (let nm = 800; nm <= 1600; nm += 200) h += t(x(nm), YB + 16, fmt(nm, 0), { ancla: 'middle', tam: 11, col: COL.suave });
  h += t(XB, YB + 16, 'nm', { ancla: 'end', tam: 11, col: COL.suave });
  VENTANAS.forEach((nm) => { h += l(x(nm), YT, x(nm), YB, { col: COL.suave, w: 1, dash: '4 4' }) + t(x(nm), YB + 34, `${nm}`, { ancla: 'middle', tam: 12, peso: 700, col: COL.suave }); });
  let dr = '', dt = '';
  for (let nm = DESDE; nm <= HASTA; nm += 4) {
    dr += `${dr ? 'L' : 'M'}${x(nm).toFixed(1)},${y(rayleigh(nm)).toFixed(1)}`;
    dt += `${dt ? 'L' : 'M'}${x(nm).toFixed(1)},${y(atenuacionFibra(nm, pico)).toFixed(1)}`;
  }
  h += p(dr, { col: COL.naranja, w: 1.6, dash: '6 4' }) + p(dt, { col: COL.primario, w: 2.6 });
  h += t(x(930), y(rayleigh(930)) - 10, 'Rayleigh ∝ 1/λ⁴', { tam: 12, peso: 600, col: COL.naranja });
  if (pico) h += t(x(1383), y(atenuacionFibra(1383)) - 8, 'pico del agua (OH⁻)', { ancla: 'middle', tam: 11, peso: 600, col: COL.rojo });
  h += t(x(1690), y(atenuacionFibra(1690)) - 8, 'infrarrojo', { ancla: 'end', tam: 11, col: COL.suave });
  const a = atenuacionFibra(lambda, pico);
  h += l(x(lambda), YT, x(lambda), YB, { col: COL.texto, w: 1.2 }) + c(x(lambda), y(a), 6, { fill: COL.primario, stroke: COL.superficie, sw: 2 });
  h += t(x(lambda) + (lambda > 1450 ? -10 : 10), YT + 12, `${fmt(a, 2)} dB/km`, { ancla: lambda > 1450 ? 'end' : 'start', tam: 13, peso: 700 });
  let extra = '';
  if (lambda < 950) extra = ' Es la 1.ª ventana: atenúa mucho, solo sirve para distancias cortas.';
  else if (pico && Math.abs(lambda - 1383) < 30) extra = ' Estás encima del pico del agua: las fibras G.652.D casi lo eliminan.';
  else if (lambda >= 1520 && lambda <= 1580) extra = ' Es la zona de mínima atenuación.';
  const info = `En ${fmt(lambda, 0)} nm la fibra pierde ≈ ${fmt(a, 2)} dB/km: la mitad de la potencia (3 dB) cada ≈ ${fmt(3 / a, 0)} km.${extra}`;
  return { svg: h, info };
}

// ---------- Tema 3: ensanchamiento del pulso ----------
export type Fuente = 'led' | 'fp' | 'dfb';
export const ANCHO_FUENTE: Record<Fuente, number> = { led: 50, fp: 4, dfb: 0.1 };
const NOMBRE_FUENTE: Record<Fuente, string> = { led: 'LED', fp: 'láser Fabry-Pérot', dfb: 'láser DFB' };
export const D_1550 = 17;
export type EstadoEnsanchamiento = { fuente: Fuente; km: number; gbps: number };

const tiempo = (ps: number) => (ps >= 1000 ? `${fmt(ps / 1000, ps >= 10000 ? 0 : 1)} ns` : `${fmt(ps, ps < 10 ? 1 : 0)} ps`);

/** Una ristra de bits antes y después de L km: Δτ = D·L·Δλ frente al periodo de bit. */
export function dibujarEnsanchamiento({ fuente, km, gbps }: EstadoEnsanchamiento): Dibujo {
  const dl = ANCHO_FUENTE[fuente], dt = ensanchamiento(D_1550, km, dl), T = 1000 / gbps, ratio = dt / T;
  const BITS = [1, 0, 1, 1, 0, 1], XA = 40, TB = 70, s0 = 0.15 * TB;
  const sigma = Math.min(4 * TB, Math.hypot(s0, ((ratio * TB) / 2.355)));
  const fila = (base: number, sg: number) => {
    let d = '';
    for (let xx = XA; xx <= XA + 6 * TB; xx += 2) {
      const v = BITS.reduce((s, b, i) => s + (b ? (s0 / sg) * Math.exp(-(((xx - XA - (i + 0.5) * TB) / sg) ** 2) / 2) : 0), 0);
      d += `${d ? 'L' : 'M'}${xx},${(base - 52 * Math.min(v, 1.6)).toFixed(1)}`;
    }
    return p(d, { col: COL.primario, w: 2.2 }) + l(XA, base, XA + 6 * TB, base, { col: COL.linea, w: 1 });
  };
  let h = '';
  for (let i = 0; i <= 6; i++) h += l(XA + i * TB, 30, XA + i * TB, 214, { col: COL.linea, w: 1, dash: '3 4' });
  BITS.forEach((b, i) => { h += t(XA + (i + 0.5) * TB, 24, String(b), { ancla: 'middle', tam: 13, peso: 700, col: COL.suave }); });
  h += fila(100, s0) + fila(206, sigma);
  h += t(XA + 4, 44, 'a la entrada', { tam: 11, col: COL.suave }) + t(XA + 4, 150, `tras ${fmt(km, 0)} km`, { tam: 11, col: COL.suave });
  const [txt, col] = ratio < 0.3 ? ['los bits se distinguen', COL.verde] : ratio < 0.7 ? ['empiezan a pisarse', COL.naranja] : ['se pisan: interferencia entre símbolos', COL.rojo];
  h += t(460, 150, txt, { ancla: 'end', tam: 12, peso: 700, col });
  h += t(240, 236, `Δτ = D·L·Δλ = ${D_1550} · ${fmt(km, 0)} · ${fmt(dl, 1)} ≈ ${tiempo(dt)}   ·   bit = ${tiempo(T)}`, { ancla: 'middle', tam: 12, peso: 600 });
  const info = `Con un ${NOMBRE_FUENTE[fuente]} (Δλ ≈ ${fmt(dl, 1)} nm), cada pulso se ensancha ≈ ${tiempo(dt)} en ${fmt(km, 0)} km, frente a un bit de ${tiempo(T)}: ${txt}.`
    + (ratio >= 0.7 ? ' Más km, más Δλ o más velocidad, peor.' : '');
  return { svg: h, info };
}

// ---------- Tema 3: dispersión material + guía de onda = cromática ----------
export type TipoD = 'g652' | 'g653' | 'g655';
export const CERO_D: Record<TipoD, number> = { g652: 1310, g653: 1550, g655: 1500 };

/** D(λ) de la fibra elegida, separada en su parte material y su parte de guía de onda. */
export function dibujarCurvaD({ fibra }: { fibra: TipoD }): Dibujo {
  const XA = 56, XB = 460, YT = 26, YB = 206, DESDE = 1200, HASTA = 1650, TOPE = 25;
  const x = (nm: number) => XA + ((nm - DESDE) / (HASTA - DESDE)) * (XB - XA);
  const y = (d: number) => (YT + YB) / 2 - (Math.max(-TOPE, Math.min(TOPE, d)) / TOPE) * ((YB - YT) / 2);
  const l0 = CERO_D[fibra], material = (nm: number) => dispersionD(nm, 1270), total = (nm: number) => dispersionD(nm, l0);
  let h = '';
  for (const d of [-20, -10, 10, 20]) h += l(XA, y(d), XB, y(d), { col: COL.linea, w: 1 }) + t(XA - 6, y(d) + 4, fmt(d, 0), { ancla: 'end', tam: 11, col: COL.suave });
  h += l(XA, y(0), XB, y(0), { col: COL.suave }) + t(XA - 6, y(0) + 4, '0', { ancla: 'end', tam: 11, col: COL.suave });
  h += t(16, (YT + YB) / 2, 'D (ps/(nm·km))', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  for (const nm of [1310, 1550]) h += l(x(nm), YT, x(nm), YB, { col: COL.suave, w: 1, dash: '4 4' }) + t(x(nm), YB + 18, `${nm} nm`, { ancla: 'middle', tam: 12, peso: 700, col: COL.suave });
  let dm = '', dg = '', dt = '';
  for (let nm = DESDE; nm <= HASTA; nm += 5) {
    const X = x(nm).toFixed(1), pre = nm === DESDE ? 'M' : 'L';
    dm += `${pre}${X},${y(material(nm)).toFixed(1)}`;
    dg += `${pre}${X},${y(total(nm) - material(nm)).toFixed(1)}`;
    dt += `${pre}${X},${y(total(nm)).toFixed(1)}`;
  }
  h += p(dm, { col: COL.naranja, w: 1.6, dash: '6 4' }) + p(dg, { col: COL.azul, w: 1.6, dash: '6 4' }) + p(dt, { col: COL.primario, w: 2.6 });
  h += t(x(1640), y(material(1640)) - 8, 'material', { ancla: 'end', tam: 12, peso: 600, col: COL.naranja });
  h += t(x(1640), y(total(1640) - material(1640)) + 16, 'guía de onda', { ancla: 'end', tam: 12, peso: 600, col: COL.azul });
  h += t(x(1210), y(total(1210)) - 10, 'cromática = suma', { tam: 12, peso: 700, col: COL.primario });
  h += c(x(l0), y(0), 6, { fill: COL.primario, stroke: COL.superficie, sw: 2 });
  const d1550 = total(1550);
  const info = {
    g652: `Fibra estándar (G.652): la dispersión cromática se anula en ≈ 1310 nm. En 1550 nm, la ventana de mínima atenuación, D ≈ ${fmt(d1550, 0)} ps/(nm·km).`,
    g653: 'Dispersión desplazada (G.653): cambiando el dopado y el perfil del núcleo, la guía de onda lleva el cero a 1550 nm. Mínima atenuación y mínima dispersión juntas, pero con D = 0 los canales WDM van en fase y aparece la <b>mezcla de cuatro ondas</b> (tema 4).',
    g655: `Dispersión desplazada no nula (G.655): deja un poco de dispersión en 1550 nm (D ≈ ${fmt(d1550, 0)}). Poco ensanchamiento y los canales no van en fase: <b>sin mezcla de cuatro ondas</b>.`,
  }[fibra];
  return { svg: h, info };
}

// ---------- Tema 4: mezcla de cuatro ondas ----------
export type EstadoFwm = { potencia: 'alta' | 'baja'; fibra: 'nula' | 'nonula'; sep: 'dwdm' | 'cwdm' };
const CANALES = [0, 1, 2, 3];

/** Cuatro canales y los productos fi + fj − fk que salen de mezclarlos; los que caen encima de un canal, diafonía. */
export function dibujarFwm({ potencia, fibra, sep }: EstadoFwm): Dibujo {
  const prod = productosFWM(CANALES), Y = 196, x = (pos: number) => 156 + pos * 40;
  const factor = (potencia === 'alta' ? 1 : 0.12) * (fibra === 'nula' ? 1 : 0.15) * (sep === 'dwdm' ? 1 : 0.03);
  let h = l(24, Y, 456, Y, { col: COL.suave }) + t(456, Y + 18, 'frecuencia →', { ancla: 'end', tam: 11, col: COL.suave });
  CANALES.forEach((f, i) => {
    h += r(x(f) - 6, Y - 130, 12, 130, { fill: mezcla(COL.primario, 70), rx: 2 });
    h += t(x(f), Y + 18, `f${i + 1}`, { ancla: 'middle', tam: 12, peso: 700, col: COL.primario });
  });
  let total = 0, sobre = 0;
  for (const [pos, n] of prod) {
    total += n; if (CANALES.includes(pos)) sobre += n;
    const alto = Math.min(110, 16 * n * factor);
    // Los que caen encima de un canal se dibujan a su lado para que se vean
    if (alto >= 1) h += r(x(pos) + (CANALES.includes(pos) ? 8 : -3), Y - alto, 6, alto, { fill: COL.rojo, rx: 1 });
  }
  h += t(24, 26, 'canales', { tam: 12, peso: 700, col: COL.primario }) + t(88, 26, 'productos de mezcla', { tam: 12, peso: 700, col: COL.rojo });
  const despreciable = factor < 0.05;
  if (despreciable) h += t(240, Y - 150, 'productos despreciables', { ancla: 'middle', tam: 13, peso: 700, col: COL.verde });
  const info = `Con 4 canales salen ${total} productos fi + fj − fk, y ${sobre} caen justo encima de un canal: <b>diafonía</b> y trasvase de potencia.`
    + (despreciable
      ? ' Aquí son despreciables: hace falta potencia alta, canales muy juntos y en fase (D ≈ 0) a la vez.'
      : ' Para reducirlos: bajar la potencia y no dejar D = 0 (fibra de dispersión desplazada no nula).');
  return { svg: h, info };
}

// ---------- Tema 4: líneas del esparcimiento ----------
export type TipoEsparcimiento = 'rayleigh' | 'raman' | 'brillouin';

/** Espectro de la luz esparcida: la línea elástica (Rayleigh) y las inelásticas, Stokes y anti-Stokes. */
export function dibujarEsparcimiento({ tipo }: { tipo: TipoEsparcimiento }): Dibujo {
  const Y = 200, X = 240, sep = tipo === 'raman' ? 150 : 34;
  let h = l(24, Y, 456, Y, { col: COL.suave }) + t(456, Y + 18, 'frecuencia →', { ancla: 'end', tam: 11, col: COL.suave });
  h += r(X - 4, Y - 140, 8, 140, { fill: COL.verde, rx: 2 }) + t(X, Y - 148, 'Rayleigh: misma f (elástico)', { ancla: 'middle', tam: 12, peso: 700, col: COL.verde });
  if (tipo !== 'rayleigh') {
    h += r(X - sep - 4, Y - 70, 8, 70, { fill: COL.rojo, rx: 2 }) + r(X + sep - 4, Y - 30, 8, 30, { fill: COL.violeta, rx: 2 });
    h += t(X - sep - 10, Y - 78, 'Stokes: f ↓', { ancla: 'end', tam: 12, peso: 700, col: COL.rojo });
    h += t(X - sep - 10, Y - 62, 'cede energía', { ancla: 'end', tam: 11, col: COL.suave });
    // En Raman la línea queda cerca del borde: el texto va encima, centrado
    const [ax, ay, ancla] = tipo === 'raman' ? [X + sep, Y - 56, 'middle' as const] : [X + sep + 10, Y - 38, 'start' as const];
    h += t(ax, ay, 'anti-Stokes: f ↑', { ancla, tam: 12, peso: 700, col: COL.violeta });
    h += t(ax, ay + 16, 'gana energía', { ancla, tam: 11, col: COL.suave });
    h += cota(X - sep, Y + 30, X, Y + 30, { col: COL.texto, w: 1.2, tam: 6 });
    h += t(X - sep / 2, Y + 48, tipo === 'raman' ? 'THz: fonones ópticos (> 100 GHz)' : 'GHz: fonones acústicos (< 100 GHz)', { ancla: tipo === 'raman' ? 'middle' : 'end', tam: 12, peso: 600 });
  }
  const info = {
    rayleigh: 'Choque <b>elástico</b>: la luz cambia de dirección pero no de frecuencia. Es la causa principal de la atenuación (tema 2) y no se puede eliminar.',
    raman: 'Raman: choque <b>inelástico</b> con la vibración de las moléculas (fonones ópticos). Las líneas salen a THz de distancia. Estimulado, sirve para <b>amplificar</b> (amplificador Raman).',
    brillouin: 'Brillouin: choque <b>inelástico</b> con ondas de sonido en el vidrio (fonones acústicos). Las líneas quedan a solo GHz. Se usa en <b>filtros y demoduladores</b>.',
  }[tipo];
  return { svg: h, info };
}

// ---------- Tema 5: traza del OTDR ----------
export type EventoOtdr = 'fusion' | 'conector' | 'rotura';
export type EstadoOtdr = { evento: EventoOtdr; km: number };
const LARGO_OTDR = 25, EJE_OTDR = 30, ALFA_OTDR = 0.2;

/** Traza del OTDR (potencia retrodispersada frente a distancia) con un evento a «km» km. */
export function dibujarOtdr({ evento, km }: EstadoOtdr): Dibujo {
  const XA = 56, XB = 460, YT = 30, YB = 206;
  const x = (k: number) => XA + (k / EJE_OTDR) * (XB - XA);
  const y = (db: number) => YT + ((3 - db) / 15) * (YB - YT);
  const fin = evento === 'rotura' ? km : LARGO_OTDR, salto = { fusion: 0.3, conector: 0.6, rotura: 0 }[evento];
  const nivel = (k: number) => -1 - ALFA_OTDR * k - (k > km ? salto : 0);
  const ruido = (k: number) => -10.6 + 0.35 * Math.sin(k * 7.3) + 0.2 * Math.sin(k * 17.1);
  let h = '';
  for (let k = 0; k <= EJE_OTDR; k += 5) h += t(x(k), YB + 16, fmt(k, 0), { ancla: 'middle', tam: 11, col: COL.suave });
  h += l(XA, YB, XB, YB, { col: COL.suave }) + t(XB, YB + 32, 'distancia (km)', { ancla: 'end', tam: 11, col: COL.suave });
  h += l(XA, YT, XA, YB, { col: COL.suave }) + t(18, (YT + YB) / 2, 'potencia retrodispersada (dB)', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  // Pico de la conexión del OTDR (zona muerta) y la recta de Rayleigh
  let d = `M${x(0)},${y(2)} L${x(0.5)},${y(-1)}`;
  const reflexivo = evento === 'conector'; // la rotura se dibuja como el final de la fibra
  for (let k = 0.5; k <= fin; k += 0.25) {
    if (reflexivo && Math.abs(k - km) < 0.13) d += ` L${x(km).toFixed(1)},${y(nivel(km) + 3).toFixed(1)}`;
    d += ` L${x(k).toFixed(1)},${y(nivel(k)).toFixed(1)}`;
  }
  // Fin de la fibra: reflexión de Fresnel y después solo ruido
  d += ` L${x(fin).toFixed(1)},${y(nivel(fin) + 3).toFixed(1)} L${x(fin + 0.3).toFixed(1)},${y(ruido(fin + 0.3)).toFixed(1)}`;
  for (let k = fin + 0.5; k <= EJE_OTDR; k += 0.25) d += ` L${x(k).toFixed(1)},${y(ruido(k)).toFixed(1)}`;
  h += p(d, { col: COL.primario, w: 2 });
  h += t(x(0.6), y(2) + 4, 'conexión (zona muerta)', { tam: 11, col: COL.suave });
  if (km > 6) h += t(x(km / 2), y(nivel(km / 2)) + 20, 'pendiente = atenuación', { ancla: 'middle', tam: 11, col: COL.suave });
  const nombre = { fusion: 'empalme de fusión', conector: 'conector', rotura: 'rotura' }[evento];
  h += t(x(km), y(nivel(km) + 3) - 10, nombre, { ancla: 'middle', tam: 12, peso: 700, col: evento === 'rotura' ? COL.rojo : COL.texto });
  if (evento !== 'rotura') h += t(x(LARGO_OTDR) - 4, y(nivel(LARGO_OTDR) + 3) - 10, 'fin de fibra', { ancla: 'end', tam: 11, peso: 600 });
  h += t(XB - 4, y(-9.2), 'ruido', { ancla: 'end', tam: 11, col: COL.suave });
  const tus = retardoOtdr(km);
  const info = `El eco del ${nombre} vuelve a los ≈ ${fmt(tus, 0)} µs: d = v·t/2 = ${fmt(km, 0)} km (v = c/n ≈ 2·10⁸ m/s). `
    + {
      fusion: 'Un empalme de fusión es un <b>escalón pequeño sin pico</b>: no refleja, solo pierde un poco.',
      conector: 'Un conector da un <b>pico de Fresnel</b> (cambio brusco de n) y un escalón de pérdida.',
      rotura: 'Una rotura da un pico de Fresnel y <b>después solo ruido</b>: ahí acaba la fibra que ve el OTDR.',
    }[evento];
  return { svg: h, info };
}
