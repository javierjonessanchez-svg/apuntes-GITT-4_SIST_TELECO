// Dibujos del tema 1 (propagación): cada función recibe el estado de los controles
// y devuelve { svg, info }. Ancho 480, como en Ópticas; colores solo de COL.
import { fmt } from '../../../widgets/numeros';
import { COL, t, l, r, c, p, flecha as fl, cota, type Dibujo } from './dibujo-radio';
import { lbf, prx, flecha, horizonte } from './fisica-radio';

const n1 = (v: number) => v.toFixed(1);

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
