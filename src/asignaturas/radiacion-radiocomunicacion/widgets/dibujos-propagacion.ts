// Dibujos del tema 1 (propagación): cada función recibe el estado de los controles
// y devuelve { svg, info }. Ancho 480, como en Ópticas; colores solo de COL.
import { fmt } from '../../../widgets/numeros';
import { COL, t, l, r, c, p, flecha as fl, cota, type Dibujo } from './dibujo-radio';
import { lbf, prx, flecha, horizonte, radioFresnel, nu, jNu, ladDosRayos } from './fisica-radio';

const n1 = (v: number) => v.toFixed(1);
// Un decimal fijo («6,0 dB»), donde fmt quitaría el cero
const f1 = (v: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

// ---------- Balance del enlace: la escalera de potencias ----------
export type EstadoEscalera = { d_km: number; f_GHz: number };
// Estaciones fijas del dibujo (dBm, dB, dBi)
export const ESCALERA = { pt: 30, lt: 2, gt: 35, gr: 35, lr: 2 } as const;

/** Niveles de potencia del transmisor al receptor: Pt → PIRE → (−Lbf) → Prx. */
export function dibujarEscalera({ d_km, f_GHz }: EstadoEscalera): Dibujo {
  const { pt, lt, gt, gr, lr } = ESCALERA;
  const L = lbf(d_km * 1e3, f_GHz * 1e9);
  const pire = pt - lt + gt;
  const llega = pire - L;
  const rx = prx(pire, L, gr, lr);
  const YT = 26, YB = 206, VMAX = 80, VMIN = -120;
  const y = (v: number) => YT + ((VMAX - v) / (VMAX - VMIN)) * (YB - YT);
  let h = '';
  for (let v = VMIN; v <= VMAX; v += 20) {
    h += l(60, y(v), 466, y(v), { col: COL.linea, w: 1 }) + t(54, y(v) + 4, fmt(v), { ancla: 'end', tam: 11, col: COL.suave });
  }
  h += t(16, (YT + YB) / 2, 'dBm', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  // Tramos horizontales (nivel en cada punto de la cadena)
  const tramos = [
    { x0: 64, x1: 104, v: pt }, { x0: 104, x1: 136, v: pt - lt }, { x0: 136, x1: 186, v: pire },
    { x0: 356, x1: 392, v: llega }, { x0: 392, x1: 428, v: llega + gr }, { x0: 428, x1: 466, v: rx },
  ];
  // Saltos: pérdidas en rojo (bajan) y ganancias en verde (suben)
  const saltos = [
    { x: 104, de: pt, a: pt - lt, et: `−Lt ${lt}` }, { x: 136, de: pt - lt, a: pire, et: `+Gt ${gt}` },
    { x: 392, de: llega, a: llega + gr, et: `+Gr ${gr}`, izq: true }, { x: 428, de: llega + gr, a: rx, et: `−Lr ${lr}` },
  ];
  saltos.forEach((s) => {
    const col = s.a < s.de ? COL.rojo : COL.verde;
    h += l(s.x, y(s.de), s.x, y(s.a), { col, w: 2.5 });
    // Un salto corto no deja sitio al lado: su etiqueta va debajo del nivel más bajo
    const corto = Math.abs(y(s.a) - y(s.de)) < 16;
    const izq = 'izq' in s && s.izq;
    h += t(izq ? s.x - 5 : s.x + 5, corto ? Math.max(y(s.de), y(s.a)) + 15 : (y(s.de) + y(s.a)) / 2 + 4, s.et, { tam: 11, peso: 600, col, ancla: izq ? 'end' : 'start' });
  });
  tramos.forEach((s) => { h += l(s.x0, y(s.v), s.x1, y(s.v), { col: COL.primario, w: 3 }); });
  // El vano: la potencia cae Lbf
  h += l(186, y(pire), 356, y(llega), { col: COL.naranja, w: 2.5, dash: '7 5' });
  h += t(263, (y(pire) + y(llega)) / 2 + 16, `−Lbf ${fmt(L, 1)} dB`, { ancla: 'end', tam: 12, peso: 700, col: COL.naranja });
  // Niveles con nombre
  h += t(64, y(pt) - 8, `Pt ${fmt(pt)} dBm`, { tam: 12, peso: 600 });
  h += t(161, y(pire) - 8, `PIRE ${fmt(pire)} dBm`, { ancla: 'middle', tam: 12, peso: 700 });
  h += t(466, y(rx) - 8, `Prx ${fmt(rx, 1)} dBm`, { ancla: 'end', tam: 12, peso: 700 });
  // Dónde está cada cosa
  h += t(84, 232, 'Tx', { ancla: 'middle', tam: 11, col: COL.suave }) + t(161, 232, 'antena', { ancla: 'middle', tam: 11, col: COL.suave });
  h += t(271, 232, `vano de ${fmt(d_km, 0)} km a ${fmt(f_GHz, 1)} GHz`, { ancla: 'middle', tam: 11, col: COL.suave });
  h += t(447, 232, 'Rx', { ancla: 'middle', tam: 11, col: COL.suave });
  const info = `PIRE = <b>${fmt(pire)} dBm</b>. En ${fmt(d_km, 0)} km a ${fmt(f_GHz, 1)} GHz se pierden Lbf = <b>${fmt(L, 1)} dB</b> y llegan Prx = <b>${fmt(rx, 1)} dBm</b>. Si doblas la distancia o la frecuencia, Lbf sube 6 dB.`;
  return { svg: h, info };
}

// ---------- Mecanismos de propagación según la frecuencia (estático) ----------

/** Onda de superficie e ionosférica por debajo de 30 MHz; onda de espacio (directo + reflejado) por encima. */
export function dibujarMecanismos(): Dibujo {
  const suelo = (x: number) => { const u = x / 480; return 236 - 60 * u * (1 - u); };
  let tierra = 'M0,250 L0,236';
  for (let x = 0; x <= 480; x += 20) tierra += ` L${x},${n1(suelo(x))}`;
  let h = p(`${tierra} L480,250 Z`, { fill: COL.linea, col: COL.suave, w: 1.5 });
  h += r(0, 20, 480, 20, { fill: COL.violeta, op: 0.14 }) + t(474, 34, 'ionosfera', { ancla: 'end', tam: 11, col: COL.violeta, peso: 600 });
  h += l(240, 46, 240, 222, { col: COL.suave, w: 1.2, dash: '5 5' }) + t(240, 14, '30 MHz', { ancla: 'middle', tam: 13, peso: 700 });
  h += t(170, 62, 'f < 30 MHz', { ancla: 'middle', tam: 13, peso: 700 }) + t(360, 62, 'f ≥ 30 MHz', { ancla: 'middle', tam: 13, peso: 700 });
  h += t(170, 78, 'radiodifusión, punto a punto,', { ancla: 'middle', tam: 10.5, col: COL.suave }) + t(170, 91, 'sistemas navales', { ancla: 'middle', tam: 10.5, col: COL.suave });
  h += t(360, 78, 'FM y TV, móvil, radar,', { ancla: 'middle', tam: 10.5, col: COL.suave }) + t(360, 91, 'enlaces fijos, satélite', { ancla: 'middle', tam: 10.5, col: COL.suave });
  // Antena de onda larga a la izquierda
  const m0 = 30, b0 = suelo(m0);
  h += l(m0, b0, m0, b0 - 36, { col: COL.primario, w: 3 });
  // Onda de superficie: pegada al suelo
  let d = '';
  for (let x = 38; x <= 214; x += 3) d += `${d ? 'L' : 'M'}${x},${n1(suelo(x) - 9 - 3 * Math.sin(x / 5))}`;
  h += p(d, { col: COL.verde, w: 2 }) + t(178, suelo(178) - 20, 'onda de superficie', { ancla: 'middle', tam: 11, peso: 600, col: COL.verde });
  // Onda ionosférica: sube, rebota en la ionosfera y baja
  h += l(m0, b0 - 36, 80, 42, { col: COL.violeta, w: 2 }) + fl(80, 42, 120, suelo(120) - 4, { col: COL.violeta, w: 2 });
  h += t(116, 140, 'onda ionosférica', { tam: 11, peso: 600, col: COL.violeta });
  // Onda de espacio: dos mástiles, rayo directo y rayo reflejado
  const a = { x: 270, y: suelo(270) - 60 }, b = { x: 450, y: suelo(450) - 48 }, ref = { x: 362, y: suelo(362) };
  h += l(a.x, suelo(a.x), a.x, a.y, { col: COL.primario, w: 3 }) + l(b.x, suelo(b.x), b.x, b.y, { col: COL.primario, w: 3 });
  h += fl(a.x, a.y, b.x, b.y, { col: COL.azul, w: 2 }) + t(360, a.y - 14, 'rayo directo', { ancla: 'middle', tam: 11, peso: 600, col: COL.azul });
  h += l(a.x, a.y, ref.x, ref.y, { col: COL.naranja, w: 2, dash: '6 4' }) + fl(ref.x, ref.y, b.x, b.y, { col: COL.naranja, w: 2, dash: '6 4' });
  h += t(362, 246, 'rayo reflejado', { ancla: 'middle', tam: 11, peso: 600 });
  h += t(360, 124, 'onda de espacio (troposférica)', { ancla: 'middle', tam: 12, peso: 700 });
  const info = 'Por debajo de <b>30 MHz</b> la señal viaja pegada al suelo (onda de superficie) o rebota en la ionosfera. Por encima, la de los radioenlaces de este curso, viaja por la troposfera: <b>rayo directo</b> y, si el terreno refleja, <b>rayo reflejado</b>.';
  return { svg: h, info };
}

// ---------- Factor K: el vano sobre la Tierra ficticia ----------
export type EstadoFactorK = { K: number };
export const VANO_K = { d: 50e3, h: 40 } as const; // vano (m) y altura de los dos mástiles (m)

/** Nombre del tramo de K (con la fe de erratas: subrefractiva es 0 ≤ K ≤ 1). */
export function claseK(K: number): string {
  if (!Number.isFinite(K)) return 'Tierra plana (K = ∞)';
  if (Math.abs(K - 4 / 3) <= 0.01) return 'atmósfera estándar (K = 4/3)';
  if (K > 4 / 3) return 'superrefractiva (K > 4/3)';
  if (K > 1) return 'entre 1 y 4/3 (la transparencia no le da nombre)';
  if (K >= 0) return 'subrefractiva (0 ≤ K ≤ 1)';
  return 'conductiva (K < 0)';
}

/** El mismo vano de 50 km con mástiles de 40 m sobre la Tierra ficticia de radio K·RT. */
export function dibujarFactorK({ K }: EstadoFactorK): Dibujo {
  const { d: D, h: H } = VANO_K;
  const plana = !Number.isFinite(K);
  const XA = 40, XB = 440, Y0 = 214, SC = 1.6;
  const x = (m: number) => XA + (m / D) * (XB - XA);
  const curva = (k: number) => {
    let s = '';
    for (let i = 0; i <= 50; i++) { const m = (D * i) / 50; s += `${i ? 'L' : 'M'}${n1(x(m))},${n1(Y0 - SC * flecha(m, D - m, k))}`; }
    return s;
  };
  const b = flecha(D / 2, D / 2, K);
  const dh = horizonte(H, K);
  const vision = b <= H;
  let h = p(`${curva(K)} L${XB},250 L${XA},250 Z`, { fill: COL.linea, col: COL.suave, w: 2 });
  h += l(XA, Y0, XB, Y0, { col: COL.suave, w: 1, dash: '3 4' });
  if (plana || Math.abs(K - 4 / 3) > 0.02) {
    h += p(curva(4 / 3), { col: COL.suave, w: 1.2, dash: '6 4' }) + t(x(D / 2), Y0 - SC * flecha(D / 2, D / 2, 4 / 3) - 6, 'K = 4/3', { ancla: 'middle', tam: 10, col: COL.suave });
  }
  // Mástiles con balizas y el rayo entre sus extremos
  const yTop = Y0 - SC * H;
  for (const xm of [XA, XB]) {
    h += l(xm, Y0, xm, yTop, { col: COL.primario, w: 3 }) + l(xm, yTop, xm, yTop + 10, { col: COL.naranja, w: 3 });
  }
  h += l(XA, yTop, XB, yTop, vision ? { col: COL.verde, w: 2.5 } : { col: COL.rojo, w: 2.5, dash: '7 5' });
  h += t(XB - 6, yTop - 8, vision ? 'visión directa' : 'la Tierra tapa el rayo', { ancla: 'end', tam: 12, peso: 700, col: vision ? COL.verde : COL.rojo });
  // Flecha a mitad del vano
  if (b > 1) h += cota(x(D / 2) + 30, Y0, x(D / 2) + 30, Y0 - SC * b, { col: COL.texto, w: 1.2, tam: 6 });
  h += t(x(D / 2) + 38, Y0 - SC * b * 0.35 + 4, `b = ${fmt(b, 1)} m`, { tam: 12, peso: 700 });
  // Horizonte de cada mástil sobre la Tierra ficticia
  if (dh < D) {
    for (const m of [dh, D - dh]) h += c(x(m), Y0 - SC * flecha(m, D - m, K), 4, { fill: COL.naranja, stroke: COL.superficie, sw: 1.5 });
    h += t(x(dh), Y0 + 14, 'horizontes', { ancla: 'middle', tam: 10.5, col: COL.texto });
  }
  h += t(XA, 20, `K = ${plana ? '∞' : fmt(K, 2)} · ${claseK(K)}`, { tam: 13, peso: 700 });
  h += t(240, 244, 'vano de 50 km · mástiles de 40 m · alturas exageradas', { ancla: 'middle', tam: 10.5, col: COL.texto });
  const txtH = Number.isFinite(dh) ? `<b>${fmt(dh / 1000, 1)} km</b>` : '<b>infinito</b>';
  const info = `${plana ? 'Tierra plana' : `K = ${fmt(K, 2)}`}: ${plana ? 'el rayo y la Tierra tienen la misma curvatura' : claseK(K)}. Flecha a mitad del vano: <b>b = ${fmt(b, 1)} m</b>; horizonte de cada mástil: ${txtH}. `
    + (vision ? 'Con mástiles de 40 m hay visión directa: la Tierra ficticia no corta el rayo.' : 'Con mástiles de 40 m te quedas sin visión directa: la Tierra ficticia corta el rayo.');
  return { svg: h, info };
}

// ---------- Difracción: el perfil con el primer elipsoide de Fresnel ----------
export type EstadoFresnel = { c_m: number };
export const PERFIL = { d: 20e3, d1: 8e3, f: 8e9 } as const; // vano, posición del obstáculo y frecuencia

/** Rayo entre dos mástiles, el primer elipsoide y un obstáculo agudo con despejamiento c (c > 0: tapa el rayo). */
export function dibujarFresnel({ c_m }: EstadoFresnel): Dibujo {
  const { d: D, d1: D1, f } = PERFIL;
  const r1 = radioFresnel(D1, D - D1, f);
  const v = nu(c_m, r1);
  const J = jNu(v);
  const hay = v > -0.78;
  const XA = 40, XB = 440, YR = 118, YS = 222, SC = 2.2;
  const x = (m: number) => XA + (m / D) * (XB - XA);
  const xo = x(D1);
  // Elipsoide: R1 en cada punto del vano
  let arriba = '', abajo = '';
  for (let i = 0; i <= 60; i++) {
    const m = (D * i) / 60, rr = i === 0 || i === 60 ? 0 : radioFresnel(m, D - m, f);
    arriba += `${i ? 'L' : 'M'}${n1(x(m))},${n1(YR - SC * rr)}`;
    abajo = `L${n1(x(m))},${n1(YR + SC * rr)}` + abajo;
  }
  let h = p(`${arriba}${abajo}Z`, { fill: COL.naranja, col: COL.naranja, w: 1.5, dash: '6 4' });
  h = `<g opacity="0.85">${h.replace(`fill="${COL.naranja}"`, `fill="${COL.naranja}" fill-opacity="0.12"`)}</g>`;
  h += r(XA - 20, YS, XB - XA + 40, 30, { fill: COL.linea });
  // Obstáculo agudo (filo de cuchillo)
  const yo = YR - SC * c_m;
  h += p(`M${n1(xo - 46)},${YS} L${n1(xo)},${n1(yo)} L${n1(xo + 46)},${YS} Z`, { fill: COL.suave, col: COL.suave, w: 1.5, op: 0.55 });
  // Mástiles y rayo
  for (const xm of [XA, XB]) h += l(xm, YS, xm, YR, { col: COL.primario, w: 3 }) + l(xm, YR, xm, YR + 10, { col: COL.naranja, w: 3 });
  h += l(XA, YR, XB, YR, { col: hay ? COL.rojo : COL.verde, w: 2.2 });
  // Cotas: c y R1 en el obstáculo
  if (Math.abs(c_m) > 0.5) h += cota(xo, YR, xo, yo, { col: COL.texto, w: 1.2, tam: 6 });
  // La etiqueta de c no se pone encima del rayo
  const yc = Math.abs(c_m) > 0.5 ? (YR + yo) / 2 + 4 : YR - 8;
  h += t(xo + 8, c_m > 0 ? Math.min(yc, YR - 8) : c_m < 0 ? Math.max(yc, YR + 16) : yc, `c = ${fmt(c_m, 0)} m`, { tam: 12, peso: 700 });
  h += cota(xo - 18, YR, xo - 18, YR - SC * r1, { col: COL.naranja, w: 1.2, tam: 5 }) + t(xo - 24, YR - SC * r1 + 2, `R₁ = ${fmt(r1, 1)} m`, { ancla: 'end', tam: 11, peso: 600, col: COL.naranja });
  h += t(XA, 20, `ν = ${fmt(v, 2)} · ${hay ? `J(ν) = ${f1(J)} dB` : 'sin difracción (ν ≤ −0,78)'}`, { tam: 13, peso: 700 });
  h += t(240, 244, 'vano de 20 km · obstáculo a 8 km · 8 GHz', { ancla: 'middle', tam: 10.5 });
  const info = `c = ${fmt(c_m, 0)} m y R₁ = ${fmt(r1, 1)} m, así que ν = √2·c/R₁ = <b>${fmt(v, 2)}</b>. `
    + (hay ? `Hay difracción: J(ν) = <b>${f1(J)} dB</b>.${c_m > 0 ? ' El obstáculo tapa el rayo.' : c_m === 0 ? ' El rayo roza la punta del obstáculo: la mitad del elipsoide está tapada.' : ' El rayo no está tapado, pero el obstáculo invade el primer elipsoide.'}`
      : 'No hay difracción: el obstáculo queda fuera del primer elipsoide, o apenas lo toca (ν ≤ −0,78), y J = 0.');
  return { svg: h, info };
}

// ---------- Bullington: dos obstáculos, rayo despejado u obstáculo ficticio ----------
export type EstadoBullington = { caso: 'despejado' | 'ficticio' };

/** Geometría de los pasos 1 y 2 de Bullington con dos obstáculos (dibujo cualitativo). */
export function dibujarBullington({ caso }: EstadoBullington): Dibujo {
  const ficticio = caso === 'ficticio';
  const E1 = { x: 40, y: 120 }, E2 = { x: 440, y: 110 }, YS = 222;
  const O1 = { x: 170, y: ficticio ? 95 : 136 }, O2 = { x: 320, y: ficticio ? 100 : 128 };
  const yRayo = (x: number) => E1.y + ((E2.y - E1.y) * (x - E1.x)) / (E2.x - E1.x);
  let h = p(`M20,${YS} L40,${YS - 6} L110,${YS - 16} L${O1.x},${O1.y} L225,${YS - 24} L270,${YS - 30} L${O2.x},${O2.y} L375,${YS - 20} L440,${YS - 6} L460,${YS} L460,250 L20,250 Z`, { fill: COL.linea, col: COL.suave, w: 1.5 });
  for (const e of [E1, E2]) h += l(e.x, YS - 6, e.x, e.y, { col: COL.primario, w: 3 }) + l(e.x, e.y, e.x, e.y + 10, { col: COL.naranja, w: 3 });
  h += t(E1.x, E1.y - 10, 'ET1', { ancla: 'middle', tam: 11, peso: 700 }) + t(E2.x, E2.y - 10, 'ET2', { ancla: 'middle', tam: 11, peso: 700 });
  h += l(E1.x, E1.y, E2.x, E2.y, { col: ficticio ? COL.rojo : COL.verde, w: 2.2 });
  h += t(E2.x - 8, E2.y + 18, 'rayo ET1–ET2', { ancla: 'end', tam: 10.5, col: ficticio ? COL.rojo : COL.verde, peso: 600 });
  if (!ficticio) {
    // Paso 1: la peor pendiente desde ET1 queda por debajo del rayo
    h += l(E1.x, E1.y, O2.x, O2.y, { col: COL.azul, w: 1.6, dash: '6 4' });
    h += t(O1.x, O1.y + 26, 'peor pendiente desde ET1 ≤ rayo', { ancla: 'middle', tam: 10.5, col: COL.azul, peso: 600 });
    h += c(O2.x, O2.y, 4.5, { fill: COL.naranja, stroke: COL.superficie }) + t(O2.x, O2.y - 10, 'ν máximo', { ancla: 'middle', tam: 11, peso: 700, col: COL.naranja });
    h += t(40, 24, 'Rayo despejado: Lcu = J(ν máx)', { tam: 13, peso: 700 });
  } else {
    // Paso 2: las dos peores pendientes se cortan en el obstáculo ficticio
    const m1 = (E1.y - O1.y) / (O1.x - E1.x), m2 = (E2.y - O2.y) / (E2.x - O2.x);
    const xf = (E1.y - E2.y + m1 * E1.x + m2 * E2.x) / (m1 + m2), yf = E1.y - m1 * (xf - E1.x);
    h += l(E1.x, E1.y, xf, yf, { col: COL.azul, w: 1.6, dash: '6 4' }) + l(E2.x, E2.y, xf, yf, { col: COL.violeta, w: 1.6, dash: '6 4' });
    h += l(xf, yf, xf, YS - 20, { col: COL.suave, w: 1, dash: '2 4' });
    h += cota(xf + 10, yRayo(xf), xf + 10, yf, { col: COL.texto, w: 1.2, tam: 5 }) + t(xf + 16, (yRayo(xf) + yf) / 2 + 4, 'c_fic', { tam: 11, peso: 700 });
    h += c(xf, yf, 5, { fill: COL.naranja, stroke: COL.superficie }) + t(xf, yf - 12, 'obstáculo ficticio', { ancla: 'middle', tam: 11, peso: 700, col: COL.naranja });
    h += t((E1.x + O1.x) / 2, (E1.y + O1.y) / 2 - 8, 'm_et1mx', { ancla: 'middle', tam: 10.5, col: COL.azul, peso: 600 }) + t((E2.x + O2.x) / 2, (E2.y + O2.y) / 2 - 8, 'm_et2mx', { ancla: 'middle', tam: 10.5, col: COL.violeta, peso: 600 });
    h += t(xf, YS - 8, 'd₁,fic', { ancla: 'middle', tam: 10.5 });
    h += t(40, 24, 'Rayo obstruido: Lcu = J(ν_fic)', { tam: 13, peso: 700 });
  }
  h += t(240, 244, 'después, paso 3: corrección por la distancia', { ancla: 'middle', tam: 10.5 });
  const info = (ficticio
    ? 'Rayo obstruido: la peor pendiente desde ET1 (m_et1mx) supera la del rayo. Las peores pendientes desde ET1 y desde ET2 se cortan en el <b>obstáculo ficticio</b>, a d₁,fic; con su despejamiento c_fic sale ν_fic y <b>Lcu = J(ν_fic)</b>.'
    : 'Rayo despejado: la peor pendiente desde ET1 (m_et1mx) no supera la del rayo. Los obstáculos no tapan el rayo, pero pueden invadir el elipsoide: <b>Lcu = J(ν máx)</b>, con el obstáculo de mayor ν.')
    + ' Paso 3: L_ad,dif = Lcu + (1 − e^(−Lcu/6))·(10 + 0,02·d_km).';
  return { svg: h, info };
}

// ---------- Reflexión: dos rayos sobre el mar (estático) ----------

/** Alturas h′ sobre el plano tangente en el punto de reflexión, ángulo rasante φ y distancias d1, d2. */
export function dibujarDosRayos(): Dibujo {
  const XR = 200, YT = 190; // punto de reflexión y plano tangente
  const mar = (x: number) => YT + 0.0006 * (x - XR) ** 2;
  const A = { x: 40, y: 110 }, B = { x: 440, y: 70 };
  let sup = '';
  for (let x = 20; x <= 460; x += 10) sup += `${sup ? 'L' : 'M'}${x},${n1(mar(x))}`;
  let h = p(`${sup} L460,250 L20,250 Z`, { fill: COL.azul, col: COL.azul, w: 1.5 }).replace(`fill="${COL.azul}"`, `fill="${COL.azul}" fill-opacity="0.18"`);
  h += t(330, 238, 'mar', { ancla: 'middle', tam: 11, peso: 600 });
  h += l(24, YT, 456, YT, { col: COL.suave, w: 1.2, dash: '6 4' }) + t(456, YT - 6, 'plano tangente', { ancla: 'end', tam: 10.5, col: COL.texto });
  for (const e of [A, B]) h += l(e.x, mar(e.x), e.x, e.y, { col: COL.primario, w: 3 }) + l(e.x, e.y, e.x, e.y + 10, { col: COL.naranja, w: 3 });
  h += fl(A.x, A.y, B.x, B.y, { col: COL.verde, w: 2 }) + t(250, 80, 'rayo directo', { ancla: 'middle', tam: 11, peso: 600, col: COL.verde });
  h += l(A.x, A.y, XR, YT, { col: COL.naranja, w: 2, dash: '6 4' }) + fl(XR, YT, B.x, B.y, { col: COL.naranja, w: 2, dash: '6 4' });
  h += t(310, 150, 'rayo reflejado', { tam: 11, peso: 600, col: COL.naranja });
  // Ángulo rasante en el punto de reflexión
  const phi = Math.atan2(YT - A.y, XR - A.x), R = 34;
  h += p(`M${XR - R},${YT} A${R},${R} 0 0 1 ${n1(XR - R * Math.cos(phi))},${n1(YT - R * Math.sin(phi))}`, { col: COL.texto, w: 1.4 });
  h += t(XR - R - 12, YT - 6, 'φ', { ancla: 'middle', tam: 14, peso: 700 });
  // Alturas sobre el plano tangente y distancias
  h += cota(58, YT, 58, A.y, { col: COL.texto, w: 1.2, tam: 5 }) + t(64, (YT + A.y) / 2 + 4, 'h′₁', { tam: 13, peso: 700 });
  h += cota(422, YT, 422, B.y, { col: COL.texto, w: 1.2, tam: 5 }) + t(416, (YT + B.y) / 2 + 4, 'h′₂', { ancla: 'end', tam: 13, peso: 700 });
  h += cota(A.x, 212, XR, 212, { col: COL.texto, w: 1.2, tam: 5 }) + t((A.x + XR) / 2, 208, 'd₁', { ancla: 'middle', tam: 12, peso: 700 });
  h += cota(XR, 212, B.x, 212, { col: COL.texto, w: 1.2, tam: 5 }) + t((XR + B.x) / 2, 208, 'd₂', { ancla: 'middle', tam: 12, peso: 700 });
  h += t(24, 24, 'h′ = h + ee − d²/(2·K·RT)   ·   tan φ = h′₁/d₁ = h′₂/d₂', { tam: 12, peso: 600 });
  const info = 'Sobre el mar se trabaja con las alturas <b>h′</b> sobre el plano tangente en el punto de reflexión. El ángulo rasante cumple tan φ = h′₁/d₁ = h′₂/d₂, y hay reflexión si <b>φ ≥ φmin = (5400/f_MHz)^(1/3)</b> mrad.';
  return { svg: h, info };
}

// ---------- Reflexión: lóbulos de interferencia de los dos rayos ----------
export type EstadoLobulos = { re: number };
export const LOBULOS = { h1: 20, h2: 10, f: 10e9 } as const; // alturas sobre el plano tangente (m) y frecuencia

/** Nivel respecto al espacio libre (−Lad) frente a la distancia, con Re = −|Re| (fase π). */
export function dibujarLobulos({ re }: EstadoLobulos): Dibujo {
  const { h1, h2, f } = LOBULOS;
  const XA = 56, XB = 464, YT = 30, YB = 206, DMIN = 2, DMAX = 40, VMAX = 8, VMIN = -42;
  const x = (km: number) => XA + (Math.log(km / DMIN) / Math.log(DMAX / DMIN)) * (XB - XA);
  const y = (v: number) => YT + ((VMAX - v) / (VMAX - VMIN)) * (YB - YT);
  let h = '';
  for (let v = -40; v <= 0; v += 10) h += l(XA, y(v), XB, y(v), { col: COL.linea, w: 1 }) + t(XA - 6, y(v) + 4, fmt(v), { ancla: 'end', tam: 11, col: COL.suave });
  h += t(XA - 6, y(6) + 4, '+6', { ancla: 'end', tam: 11, col: COL.suave });
  for (const km of [2, 5, 10, 20, 40]) h += l(x(km), YB, x(km), YB + 4, { col: COL.suave, w: 1 }) + t(x(km), YB + 17, `${km}`, { ancla: 'middle', tam: 11, col: COL.suave });
  h += t(XB, YB + 32, 'distancia (km, escala logarítmica)', { ancla: 'end', tam: 11, col: COL.suave });
  h += t(16, (YT + YB) / 2, 'dB respecto al espacio libre', { ancla: 'middle', tam: 10.5, col: COL.suave, rot: -90 });
  h += l(XA, y(0), XB, y(0), { col: COL.texto, w: 1.2, dash: '5 4' }) + t(XB, y(0) - 6, 'espacio libre', { ancla: 'end', tam: 10.5, col: COL.texto });
  let d = '', max = -Infinity, min = Infinity;
  for (let i = 0; i <= 900; i++) {
    const km = DMIN * (DMAX / DMIN) ** (i / 900);
    const v = -ladDosRayos(-re, (2 * h1 * h2) / (km * 1e3), f);
    max = Math.max(max, v); min = Math.min(min, v);
    d += `${i ? 'L' : 'M'}${n1(x(km))},${n1(y(v))}`;
  }
  h += p(d, { col: COL.primario, w: 2 });
  const ultimo = (4 * h1 * h2) / (3e8 / f) / 1000;
  if (re > 0) h += l(x(ultimo), YT, x(ultimo), YB, { col: COL.naranja, w: 1.2, dash: '4 4' }) + t(x(ultimo) - 6, YT + 10, 'último máximo', { ancla: 'end', tam: 10.5, col: COL.naranja, peso: 600 });
  h += t(XA, 18, `|Re| = ${fmt(re, 2)} · h′₁ = ${h1} m, h′₂ = ${h2} m · 10 GHz`, { tam: 12, peso: 700 });
  const info = re === 0
    ? 'Sin rayo reflejado (|Re| = 0) la señal es la del espacio libre: una <b>línea plana en 0 dB</b>.'
    : `Con |Re| = ${fmt(re, 2)} los dos rayos se suman y se restan según Δl = 2h′₁h′₂/d: máximos de <b>+${fmt(max, 1)} dB</b> y nulos de hasta <b>${fmt(-min, 1)} dB</b> de pérdida${-min >= 39.9 ? ' (el tope del dibujo: con |Re| = 1 el nulo es total)' : ''}. El último máximo está en d = 4h′₁h′₂/λ ≈ ${fmt(ultimo, 1)} km.`;
  return { svg: h, info };
}
