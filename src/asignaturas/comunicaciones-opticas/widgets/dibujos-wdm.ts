// Dibujos de los widgets de detectores, amplificación y WDM (temas 9, 11 y 12).
// Mismo contrato que dibujos-emisores.ts: estado de los controles → SVG + frase.
import { COL, barraEspectro, c, cota, flecha, l, marcaAbajo, r, t, type Dibujo } from './dibujo';
import { BANDA_EDFA, RESPUESTA_DETECTOR, canalesCWDM, derivaLambda, detecta, estadoCanal } from './fisica';
import { VENTANAS } from '../../../widgets/espectro';
import { fmt } from '../../../widgets/numeros';

const mezcla = (col: string, pct: number, con: string = COL.superficie) => `color-mix(in srgb,${col} ${pct}%,${con})`;
const um = (nm: number) => `${fmt(nm / 1000, 1)} µm`;
const NOMBRE_VENTANA = ['1.ª', '2.ª', '3.ª'];

// ---------- Tema 9: respuesta espectral de los fotodetectores ----------
export type Material = keyof typeof RESPUESTA_DETECTOR;
export type EstadoRespuesta = { material: Material };

/** Margen de respuesta de Si, Ge e InGaAs sobre la regla, con las tres ventanas; se resalta el elegido. */
export function dibujarRespuesta({ material }: EstadoRespuesta, uid = 'respuesta'): Dibujo {
  const DESDE = 380, HASTA = 1800, XA = 70, XB = 460;
  const barra = barraEspectro(`${uid}-esp`, XA, 22, XB - XA, 12, DESDE, HASTA);
  let h = barra.svg;
  VENTANAS.forEach((nm, i) => {
    const x = barra.x(nm);
    h += l(x, 40, x, 214, { col: COL.suave, w: 1.2, dash: '4 4' });
    h += t(x, 232, `${nm} nm`, { ancla: 'middle', tam: 12, peso: 600, col: COL.suave });
    h += t(x, 248, `${NOMBRE_VENTANA[i]} ventana`, { ancla: 'middle', tam: 11, col: COL.suave });
  });
  (Object.keys(RESPUESTA_DETECTOR) as Material[]).forEach((m, i) => {
    const { desde, corte } = RESPUESTA_DETECTOR[m];
    const y = 62 + i * 52, activo = m === material;
    const col = activo ? COL.primario : COL.suave;
    h += t(XA - 10, y + 15, m, { ancla: 'end', tam: 14, peso: 700, col: activo ? COL.texto : COL.suave });
    h += r(barra.x(desde), y, barra.x(corte) - barra.x(desde), 22, { fill: mezcla(col, activo ? 30 : 12, 'transparent'), stroke: col, sw: activo ? 2 : 1, rx: 6 });
    h += l(barra.x(corte), y - 4, barra.x(corte), y + 26, { col: activo ? COL.rojo : COL.suave, w: activo ? 2.4 : 1.2 });
    if (activo) h += t(barra.x(corte), y + 39, `corte ≈ ${um(corte)}`, { ancla: 'end', tam: 12, peso: 700, col: COL.rojo });
    VENTANAS.forEach((nm) => {
      const si = detecta(m, nm);
      if (activo) h += c(barra.x(nm), y + 11, 7, { fill: si ? COL.verde : COL.superficie, stroke: si ? COL.verde : COL.rojo, sw: 2 });
    });
  });
  h += t(XB, 14, 'longitud de onda →', { ancla: 'end', tam: 12, col: COL.suave });
  const ventanas = VENTANAS.filter((nm) => detecta(material, nm));
  const lista = ventanas.map((nm) => `${nm} nm`).join(', ').replace(/, ([^,]*)$/, ' y $1');
  const info = `El <b>${material}</b> responde hasta ≈ ${um(RESPUESTA_DETECTOR[material].corte)}: sirve para ${ventanas.length === 1 ? 'la ventana de' : 'las ventanas de'} ${lista}.`
    + (material === 'Si' ? ' Por encima de su corte el fotón no tiene energía para superar el gap.' : '');
  return { svg: h, info };
}

// ---------- Tema 11: banda del EDFA ----------
export type EstadoEdfa = { lambda: number };

/** Banda de ganancia del EDFA (≈ 50 nm alrededor de 1550 nm) con los canales DWDM y un canal que se mueve. */
export function dibujarEdfa({ lambda }: EstadoEdfa, uid = 'edfa'): Dibujo {
  const { desde, hasta } = BANDA_EDFA;
  const dentro = lambda >= desde && lambda <= hasta;
  // Arriba: la regla de 1260 a 1650 nm, con las ventanas de 1310 y 1550 nm y la banda del EDFA
  const barra = barraEspectro(`${uid}-esp`, 20, 30, 440, 10, 1260, 1650);
  let h = t(20, 18, 'Ventanas de 1310 y 1550 nm', { peso: 700 }) + barra.svg;
  h += r(barra.x(desde), 26, barra.x(hasta) - barra.x(desde), 18, { fill: mezcla(COL.verde, 30, 'transparent'), stroke: COL.verde, sw: 1.6, rx: 3 });
  h += t((barra.x(desde) + barra.x(hasta)) / 2, 60, 'banda del EDFA', { ancla: 'middle', tam: 12, peso: 700, col: COL.verde });
  for (const nm of [1310, 1550]) h += t(barra.x(nm), 76, `${nm} nm`, { ancla: 'middle', tam: 12, col: COL.suave });
  h += marcaAbajo(barra.x(lambda), 28, dentro ? COL.verde : COL.rojo);
  // Abajo: ampliación de la banda, con la ganancia y los canales DWDM cada ≈ 0,8 nm
  const ZA = 1515, ZB = 1585, XA = 30, XB = 450, BASE = 236;
  const x = (nm: number) => XA + (nm - ZA) / (ZB - ZA) * (XB - XA);
  h += l(barra.x(desde), 84, XA, 112, { col: COL.verde, w: 1, dash: '4 3' }) + l(barra.x(hasta), 84, XB, 112, { col: COL.verde, w: 1, dash: '4 3' });
  h += r(XA, 112, XB - XA, BASE - 112, { fill: mezcla(COL.verde, 6), stroke: COL.linea, rx: 6 });
  const ganancia = (nm: number) => (nm < desde || nm > hasta ? 0 : 1 - 0.25 * ((nm - 1550) / 25) ** 2);
  let d = `M${XA},${BASE}`;
  for (let nm = ZA; nm <= ZB; nm += 0.5) d += ` L${x(nm).toFixed(1)},${(BASE - 96 * ganancia(nm)).toFixed(1)}`;
  h += `<path d="${d} L${XB},${BASE} Z" fill="${mezcla(COL.verde, 18, 'transparent')}" stroke="${COL.verde}" stroke-width="2"/>`;
  for (let nm = desde + 2; nm <= hasta - 2; nm += 0.8) h += l(x(nm), BASE, x(nm), BASE - 96 * ganancia(nm) + 6, { col: COL.primario, w: 1.6, op: 0.75 });
  h += t(XA + 8, 130, 'ganancia', { tam: 12, peso: 600, col: COL.verde });
  h += t((XA + XB) / 2, 130, 'canales DWDM, cada ≈ 0,8 nm', { ancla: 'middle', tam: 12, col: COL.primario });
  h += cota(x(desde), BASE + 14, x(hasta), BASE + 14, { col: COL.verde, w: 1.4, tam: 6 });
  h += t(x(1550), BASE + 32, '≈ 50 nm alrededor de 1550 nm', { ancla: 'middle', tam: 12, peso: 600, col: COL.verde });
  const info = dentro
    ? `${fmt(lambda, 0)} nm está dentro de la banda: el EDFA lo amplifica, y a todos los canales DWDM de esa banda a la vez.`
    : `${fmt(lambda, 0)} nm está fuera de la banda del EDFA: <b>no se amplifica</b>. Para otras bandas haría falta otro amplificador (por ejemplo, Raman).`;
  return { svg: h, info };
}

// ---------- Tema 12: planes DWDM y CWDM ----------
export type EstadoPlanes = { plan: 'dwdm' | 'cwdm' };

/** Rejilla CWDM (18 canales de 1271 a 1611 nm, cada 20 nm) o DWDM (canales a ≈ 0,8 nm en la ventana de 1550 nm). */
export function dibujarPlanes({ plan }: EstadoPlanes, uid = 'planes'): Dibujo {
  const dwdm = plan === 'dwdm', cw = canalesCWDM();
  const XA = 30, XB = 450, NMA = 1260, NMB = 1620, xnm = (nm: number) => XA + (nm - NMA) / (NMB - NMA) * (XB - XA);
  const barra = barraEspectro(`${uid}-esp`, XA, 72, XB - XA, 6, NMA, NMB);
  let h = t(XA, 20, 'Banda de 1260 a 1620 nm', { peso: 700 }) + barra.svg;
  h += r(XA, 34, XB - XA, 34, { fill: COL.superficie, stroke: COL.linea, rx: 4 });
  h += r(xnm(1530), 34, xnm(1565) - xnm(1530), 34, { fill: mezcla(COL.azul, 18, 'transparent'), stroke: COL.azul, sw: 1.4, rx: 2 });
  h += t(xnm(1547), 96, '1550 nm', { ancla: 'middle', tam: 12, col: COL.azul, peso: 600 });
  if (!dwdm) {
    cw.forEach((nm) => { h += r(xnm(nm) - 4, 38, 8, 26, { fill: COL.primario, rx: 2 }); });
    h += t(xnm(cw[0]), 112, `${cw[0]} nm`, { ancla: 'middle', tam: 12, peso: 600 }) + t(xnm(cw[17]), 112, `${cw[17]} nm`, { ancla: 'middle', tam: 12, peso: 600 });
    h += cota(xnm(cw[7]), 132, xnm(cw[8]), 132, { w: 1.4, tam: 5 });
    h += t((xnm(cw[7]) + xnm(cw[8])) / 2, 150, 'separación de 20 nm', { ancla: 'middle', peso: 600 });
    h += t(240, 186, '18 canales en total', { ancla: 'middle', tam: 14, peso: 700, col: COL.primario });
  } else {
    h += `<path d="M${xnm(1530)},68 L70,118 M${xnm(1565)},68 L410,118" fill="none" stroke="${COL.azul}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    h += r(70, 118, 340, 62, { fill: mezcla(COL.azul, 8), stroke: COL.azul, sw: 1.4, rx: 6 });
    for (let i = 0; i < 8; i++) h += r(105 + i * 40 - 4, 130, 8, 38, { fill: COL.primario, rx: 2 });
    h += cota(105 + 3 * 40, 194, 105 + 4 * 40, 194, { w: 1.4, tam: 5 });
    h += t(105 + 3.5 * 40, 212, '≈ 0,8 nm (100 GHz)', { ancla: 'middle', peso: 600 });
    h += t(240, 236, 'canales muy juntos (ampliación de la ventana de 1550 nm)', { ancla: 'middle', peso: 700, col: COL.primario });
  }
  const info = dwdm
    ? '<b>DWDM</b> exige láseres monomodo (DFB, DBR) con la λ controlada en fracciones de nm, estabilización de temperatura y filtros muy selectivos: más caro.'
    : '<b>CWDM</b> admite láseres sin refrigeración, tolerancias de λ menos exigentes y filtros anchos: más barato.';
  return { svg: h, info };
}

// ---------- Tema 12: deriva térmica ----------
export type EstadoDeriva = { dT: number };

/** Cinco canales DWDM y la raya de un láser que se desplaza al calentarse o enfriarse. */
export function dibujarDeriva({ dT }: EstadoDeriva): Dibujo {
  const PX_NM = 100, X0 = 240, BASE = 190, ANCHO = 38;
  const dl = derivaLambda(dT), estado = estadoCanal(dl);
  const col = { ok: COL.verde, peligro: COL.naranja, choque: COL.rojo }[estado];
  let h = '';
  for (let i = -2; i <= 2; i++) {
    const x = X0 + i * 0.8 * PX_NM, propio = i === 0;
    h += r(x - ANCHO / 2, 54, ANCHO, BASE - 54, { fill: propio ? mezcla(COL.verde, 16) : COL.superficie, stroke: propio ? COL.verde : COL.linea, sw: propio ? 1.8 : 1, rx: 4 });
  }
  h += t(X0, 46, 'canal del láser', { ancla: 'middle', peso: 700, col: COL.verde });
  h += t(X0 + 1.6 * PX_NM, 46, 'canal vecino', { ancla: 'middle', col: COL.suave }) + t(X0 - 1.6 * PX_NM, 46, 'canal vecino', { ancla: 'middle', col: COL.suave });
  const xl = Math.min(462, Math.max(18, X0 + dl * PX_NM));
  h += l(X0, BASE + 4, X0, 66, { col: COL.suave, w: 1.2, dash: '3 3' }) + l(xl, BASE, xl, 70, { col, w: 5 });
  if (Math.abs(dl) > 0.01) h += flecha(X0, 78, xl, 78, { w: 1.6, tam: 7 });
  h += flecha(20, BASE + 14, 462, BASE + 14, { w: 1.4, tam: 7 }) + t(462, BASE + 34, 'longitud de onda →', { ancla: 'end', tam: 12, col: COL.suave });
  h += t(20, BASE + 34, dT === 0 ? 'sin cambio de temperatura' : `${dT > 0 ? 'se calienta' : 'se enfría'} → la λ ${dT > 0 ? 'aumenta' : 'disminuye'}`, { peso: 600 });
  const info = {
    ok: 'Dentro de su canal: todo bien.',
    peligro: 'Se acerca al borde del canal: aumentan las interferencias con el vecino.',
    choque: '<b>Invade el canal vecino</b>: se mezclan dos canales. Por eso se estabiliza la temperatura del láser.',
  }[estado];
  return { svg: h, info };
}
