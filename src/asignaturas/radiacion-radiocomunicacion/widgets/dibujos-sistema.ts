// Dibujos de los temas 2 a 4 (antenas, desvanecimientos, ruido): cada función recibe
// el estado de los controles y devuelve { svg, info }. Ancho 480; colores solo de COL.
import { fmt } from '../../../widgets/numeros';
import { COL, t, l, c, p, cota, flecha as fl, type Dibujo } from './dibujo-radio';
import { gDesapuntado, fq, qDeFM } from './fisica-radio';

const n1 = (v: number) => v.toFixed(1);

// ---------- Tema 2: diagrama de radiación de una antena directiva ----------
export type EstadoDiagrama = { theta: number };
// Antena del dibujo: ganancia máxima (dBi), ancho de haz a 3 dB (grados), SLL y FBR (dB)
export const ANTENA = { gmax: 40, theta3: 2, sll: 25, fbr: 45 } as const;

/** Ganancia del dibujo: lóbulo principal G(θ) = Gmax − 12(θ/θ3dB)² y lóbulos laterales decrecientes. */
function gDibujo(th: number, suelo: number): number {
  const { gmax, theta3, sll } = ANTENA;
  const a = Math.abs(th);
  const fin = theta3 * Math.sqrt((gmax - suelo) / 12); // donde el lóbulo principal toca el suelo
  if (a <= fin) return gDesapuntado(gmax, theta3, a);
  const u = a - fin, pico = gmax - sll - 1.2 * Math.max(0, u - 0.75);
  return Math.max(suelo, pico + 10 * Math.log10(Math.max(Math.sin((Math.PI * u) / 1.5) ** 2, 1e-5)));
}

/** Diagrama cartesiano en dBi: lóbulo principal, θ3dB, SLL, lóbulo posterior (FBR) y el punto desapuntado θ. */
export function dibujarDiagrama({ theta }: EstadoDiagrama): Dibujo {
  const { gmax, theta3, sll, fbr } = ANTENA;
  const XA = 56, XB = 396, YT = 30, YB = 206, TMAX = 8, VMAX = 45, VMIN = -10;
  const x = (th: number) => XA + ((th + TMAX) / (2 * TMAX)) * (XB - XA);
  const y = (v: number) => YT + ((VMAX - v) / (VMAX - VMIN)) * (YB - YT);
  let h = '';
  for (let v = -10; v <= 40; v += 10) h += l(XA, y(v), 466, y(v), { col: COL.linea, w: 1 }) + t(XA - 6, y(v) + 4, fmt(v), { ancla: 'end', tam: 11, col: COL.suave });
  h += t(16, (YT + YB) / 2, 'G (dBi)', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  for (const th of [-8, -4, 0, 4, 8]) h += t(x(th), YB + 16, `${fmt(th)}°`, { ancla: 'middle', tam: 11, col: COL.suave });
  h += t((XA + XB) / 2, YB + 32, 'ángulo respecto al apuntamiento θ', { ancla: 'middle', tam: 11, col: COL.suave });
  // Curva del diagrama
  let d = '';
  for (let i = 0; i <= 640; i++) {
    const th = -TMAX + (2 * TMAX * i) / 640;
    d += `${i ? 'L' : 'M'}${n1(x(th))},${n1(y(gDibujo(th, VMIN)))}`;
  }
  h += p(d, { col: COL.primario, w: 2 });
  // θ3dB: puntos de potencia mitad, a ±θ3dB/2
  const y3 = y(gmax - 3);
  h += l(x(-theta3 / 2) - 30, y3, x(theta3 / 2) + 30, y3, { col: COL.naranja, w: 1.2, dash: '4 3' });
  h += cota(x(-theta3 / 2), y3, x(theta3 / 2), y3, { col: COL.naranja, w: 1.2, tam: 4 });
  h += t(x(0), y3 + 17, `θ3dB = ${fmt(theta3)}°`, { ancla: 'middle', tam: 11, peso: 700, col: COL.naranja });
  h += t(x(-theta3 / 2) - 32, y3 + 4, '−3 dB', { ancla: 'end', tam: 11, peso: 600, col: COL.naranja });
  // SLL: del máximo al primer lóbulo lateral
  const fin = theta3 * Math.sqrt((gmax - VMIN) / 12), xs = x(fin + 0.75);
  h += l(xs - 10, y(gmax), xs + 26, y(gmax), { col: COL.suave, w: 1, dash: '3 3' }) + l(xs - 10, y(gmax - sll), xs + 26, y(gmax - sll), { col: COL.suave, w: 1, dash: '3 3' });
  h += cota(xs + 18, y(gmax), xs + 18, y(gmax - sll), { col: COL.verde, w: 1.2, tam: 5 }) + t(xs + 24, y(gmax - sll / 2) + 4, `SLL = ${fmt(sll)} dB`, { tam: 11, peso: 700, col: COL.verde });
  // Lóbulo posterior, en 180° (fuera de escala, a la derecha)
  const xp = 440;
  h += l(412, YT, 412, YB, { col: COL.suave, w: 1, dash: '2 4' }) + t(xp, YB + 16, '180°', { ancla: 'middle', tam: 11, col: COL.suave });
  h += p(`M${xp - 18},${n1(y(VMIN))} Q${xp},${n1(2 * y(gmax - fbr) - y(VMIN))} ${xp + 18},${n1(y(VMIN))}`, { col: COL.primario, w: 2 });
  h += cota(xp + 22, y(gmax), xp + 22, y(gmax - fbr), { col: COL.violeta, w: 1.2, tam: 5 });
  h += t(xp + 16, y(gmax) - 8, `FBR = ${fmt(fbr)} dB`, { ancla: 'end', tam: 11, peso: 700, col: COL.violeta });
  // Punto desapuntado
  const g = gDesapuntado(gmax, theta3, theta), perd = gmax - g;
  h += l(x(theta), YB, x(theta), y(g), { col: COL.rojo, w: 1.2, dash: '3 3' }) + c(x(theta), y(g), 5, { fill: COL.rojo, stroke: COL.superficie, sw: 2 });
  h += t(XA, 18, `θ = ${fmt(theta, 1)}° · G(θ) = ${fmt(g, 1)} dBi`, { tam: 13, peso: 700 });
  const info = `Desapuntada θ = ${fmt(theta, 1)}°: G(θ) = ${gmax} − 12·(${fmt(theta, 1)}/${theta3})² = <b>${fmt(g, 1)} dBi</b>, `
    + `<b>${fmt(perd, 1)} dB</b> menos que bien apuntada. `
    + (theta <= theta3 / 2 ? 'Sigue dentro del haz de 3 dB (θ ≤ θ3dB/2).' : 'Ya está fuera del haz de 3 dB (θ > θ3dB/2): la pérdida crece con θ².');
  return { svg: h, info };
}

// ---------- Tema 2: polarización copolar y contrapolar ----------

/** Diagramas copolar y contrapolar normalizados; el hueco en el apuntamiento es la XPD de la antena. */
export function dibujarPolarizaciones(): Dibujo {
  const XA = 56, XB = 464, YT = 30, YB = 206, TMAX = 30, VMIN = -60;
  const x = (th: number) => XA + ((th + TMAX) / (2 * TMAX)) * (XB - XA);
  const y = (v: number) => YT + (-v / -VMIN) * (YB - YT);
  // Copolar: lóbulo principal hasta un nulo a −30 dB y lóbulos laterales que decrecen
  const th0 = 8 * Math.sqrt(30 / 12);
  const co = (th: number) => {
    const a = Math.abs(th);
    if (a <= th0) return -12 * (a / 8) ** 2;
    const u = a - th0;
    return Math.max(VMIN, -25 - 0.6 * u + 10 * Math.log10(Math.max(Math.sin((Math.PI * u) / 6) ** 2, 1e-4)));
  };
  // Contrapolar: mínimo en el apuntamiento (−40 dB) y máximos a los lados
  const cx = (th: number) => Math.max(VMIN, -40 + 10 * Math.log10(0.1 + (th / 5) ** 2) + 10 - 12 * Math.max(0, (Math.abs(th) - 5) / 8) ** 2);
  let h = '';
  for (let v = -60; v <= 0; v += 10) h += l(XA, y(v), XB, y(v), { col: COL.linea, w: 1 }) + t(XA - 6, y(v) + 4, fmt(v), { ancla: 'end', tam: 11, col: COL.suave });
  h += t(16, (YT + YB) / 2, 'dB (normalizado)', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  for (const th of [-30, -15, 0, 15, 30]) h += t(x(th), YB + 16, `${fmt(th)}°`, { ancla: 'middle', tam: 11, col: COL.suave });
  let dc = '', dx = '';
  for (let i = 0; i <= 600; i++) {
    const th = -TMAX + (2 * TMAX * i) / 600;
    dc += `${i ? 'L' : 'M'}${n1(x(th))},${n1(y(co(th)))}`;
    dx += `${i ? 'L' : 'M'}${n1(x(th))},${n1(y(cx(th)))}`;
  }
  h += p(dc, { col: COL.primario, w: 2 }) + p(dx, { col: COL.naranja, w: 2, dash: '6 4' });
  h += t(x(-9), y(-6), 'copolar (VV)', { ancla: 'end', tam: 11, peso: 700, col: COL.primario });
  h += t(x(7), y(-50), 'contrapolar (VH)', { ancla: 'middle', tam: 11, peso: 700, col: COL.naranja });
  const xpd = -cx(0);
  h += cota(x(0) + 8, y(0), x(0) + 8, y(-xpd), { col: COL.texto, w: 1.4, tam: 6 }) + t(x(0) + 16, y(-xpd / 2) + 4, `XPD = ${fmt(xpd, 0)} dB`, { tam: 12, peso: 700 });
  h += t(XA, 18, 'Antena polarizada en vertical (V)', { tam: 12, peso: 600 });
  const info = `En el apuntamiento la componente copolar está <b>${fmt(xpd, 0)} dB</b> por encima de la contrapolar: esa es la <b>XPD</b> de la antena. Fuera del eje la contrapolar crece y la discriminación baja.`;
  return { svg: h, info };
}

// ---------- Tema 3: mecanismos de protección frente a desvanecimientos ----------
export type EstadoProteccion = { mecanismo: 'atenuador' | 'cag' | 'atpc' };
export const PROTECCION = { th: -80, md: 30 } as const; // umbral (dBm) y margen dinámico (dB)

/** Un desvanecimiento que llega justo a MD: qué potencia varía y cuál se queda constante en TH. */
export function dibujarProteccion({ mecanismo }: EstadoProteccion): Dibujo {
  const { th, md } = PROTECCION;
  const XA = 64, XB = 466, YT = 34, YB = 206, VMAX = -40, VMIN = -120;
  const x = (u: number) => XA + u * (XB - XA);
  const y = (v: number) => YT + ((VMAX - v) / (VMAX - VMIN)) * (YB - YT);
  const F = (u: number) => md * Math.exp(-(((u - 0.5) / 0.16) ** 2)); // desvanecimiento (dB) a lo largo del tiempo
  let h = '';
  for (let v = -120; v <= -40; v += 20) h += l(XA, y(v), XB, y(v), { col: COL.linea, w: 1 }) + t(XA - 6, y(v) + 4, fmt(v), { ancla: 'end', tam: 11, col: COL.suave });
  h += t(16, (YT + YB) / 2, 'dBm', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  h += t((XA + XB) / 2, YB + 18, 'tiempo: condiciones normales → desvanecimiento máximo → normales', { ancla: 'middle', tam: 11, col: COL.suave });
  // Curva que varía (naranja) y potencia que llega al demodulador (verde, siempre TH)
  const curva = {
    atenuador: { v: (u: number) => th + md - F(u), nombre: 'Prx a la entrada del Rx', ref: th + md, refTxt: 'TH + MD' },
    cag: { v: (u: number) => th - F(u), nombre: 'Prx a la entrada del Rx', ref: th - md, refTxt: 'TH − MD' },
    atpc: { v: (u: number) => th + F(u), nombre: 'PIRE − Lb + Gr − Lr sin desvanecimiento', ref: th + md, refTxt: 'TH + MD' },
  }[mecanismo];
  h += l(XA, y(curva.ref), XB, y(curva.ref), { col: COL.suave, w: 1.2, dash: '5 4' }) + t(XB, y(curva.ref) - 6, curva.refTxt, { ancla: 'end', tam: 11, peso: 700, col: COL.suave });
  let d = '';
  for (let i = 0; i <= 200; i++) d += `${i ? 'L' : 'M'}${n1(x(i / 200))},${n1(y(curva.v(i / 200)))}`;
  h += p(d, { col: COL.naranja, w: 2.2 });
  h += l(XA, y(th), XB, y(th), { col: COL.verde, w: 2.6 });
  h += t(XA + 6, y(th) + (mecanismo === 'cag' ? -8 : 16), 'al demodulador: TH = −80 dBm', { tam: 11, peso: 700, col: COL.verde });
  h += t(XA + 6, mecanismo === 'atenuador' ? y(th + md) - 8 : mecanismo === 'cag' ? y(th) + 16 : y(th) - 8, curva.nombre, { tam: 11, peso: 600, col: COL.naranja });
  // MD en el máximo del desvanecimiento
  h += l(x(0.5) + 12, y((th + curva.ref) / 2), x(0.5) + 66, y((th + curva.ref) / 2), { col: COL.texto, w: 1, dash: '2 3' }) + cota(x(0.5) + 12, y(th), x(0.5) + 12, y(curva.ref), { col: COL.texto, w: 1.2, tam: 5 }) + t(x(0.5) + 72, y((th + curva.ref) / 2) + 4, `MD = ${md} dB`, { tam: 12, peso: 700 });
  const titulo = { atenuador: 'Atenuador variable (Rx, Pt constante)', cag: 'Amplificador variable, CAG (Rx, Pt constante)', atpc: 'Transmisor variable, ATPC/UPC (Tx)' }[mecanismo];
  h += t(XA, 20, titulo, { tam: 13, peso: 700 });
  const info = {
    atenuador: 'Atenuador variable, en el receptor y con Pt constante. En condiciones normales Prx = <b>TH + MD</b> y el atenuador quita MD dB; en el desvanecimiento máximo Prx = TH y el atenuador queda a 0 dB. MD = Prx,CN − TH, y <b>FM = MD</b>.',
    cag: 'Amplificador variable (CAG), en el receptor y con Pt constante. En condiciones normales Prx = <b>TH</b>; en el desvanecimiento máximo Prx = <b>TH − MD</b> y el CAG pone los MD dB que faltan. MD = Gmax − Gmin, y <b>FM = MD</b>.',
    atpc: 'Transmisor variable (ATPC/UPC): la <b>PIRE</b> sube lo mismo que el desvanecimiento. En condiciones normales Prx = TH; en el desvanecimiento máximo PIRE,CMD = PIRE,CN + MD. <b>FM = MD</b>.',
  }[mecanismo];
  return { svg: h, info };
}

// ---------- Tema 3: atenuación por lluvia superada el q % del tiempo ----------
export type EstadoFq = { fm: number };
export const LLUVIA = { f001: 30, f: 15 } as const; // F0,01 (dB) y frecuencia (GHz) del dibujo

/** Fq frente a q (eje logarítmico) y el corte con el margen FM: q = U_lluvia. */
export function dibujarFq({ fm }: EstadoFq): Dibujo {
  const { f001, f } = LLUVIA;
  const XA = 56, XB = 464, YT = 30, YB = 206, QMIN = 0.001, QMAX = 1;
  const VMAX = Math.ceil(fq(f001, QMIN, f) / 10) * 10;
  const x = (q: number) => XA + (Math.log10(q / QMIN) / Math.log10(QMAX / QMIN)) * (XB - XA);
  const y = (v: number) => YT + ((VMAX - v) / VMAX) * (YB - YT);
  let h = '';
  for (let v = 0; v <= VMAX; v += 10) h += l(XA, y(v), XB, y(v), { col: COL.linea, w: 1 }) + t(XA - 6, y(v) + 4, fmt(v), { ancla: 'end', tam: 11, col: COL.suave });
  h += t(16, (YT + YB) / 2, 'Fq (dB)', { ancla: 'middle', tam: 11, col: COL.suave, rot: -90 });
  for (const qq of [0.001, 0.01, 0.1, 1]) h += l(x(qq), YB, x(qq), YB + 4, { col: COL.suave, w: 1 }) + t(x(qq), YB + 17, fmt(qq, 3), { ancla: 'middle', tam: 11, col: COL.suave });
  h += t(XB, YB + 32, 'q: % del tiempo en que se supera Fq (escala logarítmica)', { ancla: 'end', tam: 11, col: COL.suave });
  let d = '';
  for (let i = 0; i <= 300; i++) {
    const qq = QMIN * (QMAX / QMIN) ** (i / 300);
    d += `${i ? 'L' : 'M'}${n1(x(qq))},${n1(y(fq(f001, qq, f)))}`;
  }
  h += p(d, { col: COL.primario, w: 2.2 });
  h += c(x(0.01), y(f001), 4, { fill: COL.primario }) + t(x(0.01) + 8, y(f001) - 8, `F0,01 = ${f001} dB`, { tam: 11, peso: 600, col: COL.primario });
  // Margen FM y su corte con la curva
  const q = qDeFM(fm, f001, f), dentro = Number.isFinite(q) && q >= QMIN && q <= QMAX;
  h += l(XA, y(fm), XB, y(fm), { col: COL.naranja, w: 1.4, dash: '6 4' }) + t(XB, y(fm) - 6, `FM = ${fmt(fm, 0)} dB`, { ancla: 'end', tam: 11, peso: 700, col: COL.naranja });
  if (dentro) h += l(x(q), y(fm), x(q), YB, { col: COL.rojo, w: 1.4, dash: '3 3' }) + c(x(q), y(fm), 5, { fill: COL.rojo, stroke: COL.superficie, sw: 2 });
  h += t(XA, 18, `${fmt(f)} GHz, F0,01 = ${f001} dB · ${dentro ? `U_lluvia = q = ${fmt(q, 3)} %` : 'el corte se sale del dibujo'}`, { tam: 12, peso: 700 });
  const info = Number.isFinite(q)
    ? `Con FM = ${fmt(fm, 0)} dB la lluvia supera el margen el <b>${fmt(q, 3)} %</b> del tiempo: esa es la indisponibilidad por lluvia, U_lluvia = q. Más margen, menos tiempo caído.`
    : `Con FM = ${fmt(fm, 0)} dB la ecuación de segundo grado no tiene raíz real: el margen es demasiado grande para el modelo.`;
  return { svg: h, info };
}

// ---------- Tema 3: despolarización por lluvia (estático) ----------

/** Sale polarización vertical; las gotas achatadas la giran y llegan V′ (copolar) y H′ (contrapolar). */
export function dibujarDespolarizacion(): Dibujo {
  let h = '';
  h += l(50, 200, 50, 110, { col: COL.primario, w: 3 }) + l(430, 200, 430, 110, { col: COL.primario, w: 3 });
  h += t(50, 222, 'TX (V)', { ancla: 'middle', tam: 11, peso: 700 }) + t(430, 222, 'RX', { ancla: 'middle', tam: 11, peso: 700 });
  // Campo transmitido: vertical
  h += fl(90, 150, 90, 100, { col: COL.verde, w: 2.4 }) + fl(90, 150, 90, 200, { col: COL.verde, w: 2.4 });
  h += t(100, 96, 'V transmitida', { tam: 11, peso: 600, col: COL.verde });
  // Lluvia: gotas achatadas e inclinadas
  for (const [gx, gy] of [[200, 110], [240, 150], [280, 120], [220, 190], [270, 185], [310, 160], [190, 160], [250, 105]]) {
    h += `<ellipse cx="${gx}" cy="${gy}" rx="9" ry="5.5" transform="rotate(-18 ${gx} ${gy})" fill="${COL.azul}" fill-opacity="0.25" stroke="${COL.azul}" stroke-width="1.4"/>`;
  }
  h += t(250, 232, 'lluvia: gotas achatadas', { ancla: 'middle', tam: 11, col: COL.azul, peso: 600 });
  h += fl(130, 150, 168, 150, { col: COL.suave, w: 1.4 }) + fl(330, 150, 368, 150, { col: COL.suave, w: 1.4 });
  // Campo recibido: V′ grande y H′ pequeña
  h += fl(395, 150, 395, 102, { col: COL.verde, w: 2.4 }) + fl(395, 150, 395, 198, { col: COL.verde, w: 2.4 });
  h += fl(395, 150, 412, 150, { col: COL.naranja, w: 2.4 }) + fl(395, 150, 378, 150, { col: COL.naranja, w: 2.4 });
  h += t(388, 96, 'V′ (copolar)', { ancla: 'end', tam: 11, peso: 600, col: COL.verde }) + t(386, 186, 'H′ (contrapolar)', { ancla: 'end', tam: 11, peso: 600, col: COL.naranja });
  h += t(24, 30, 'XPD por lluvia = V′ − H′ (dB): baja cuando Fq sube', { tam: 12, peso: 700 });
  const info = 'Las gotas grandes se achatan al caer y no son simétricas: la polarización vertical que sale del transmisor llega con una parte en horizontal. La <b>XPD por lluvia</b> mide cuánto por debajo queda H′, y baja cuanto más fuerte llueve: XPD = U − V·log Fq.';
  return { svg: h, info };
}
