// Datos y cuentas de los widgets de 3G (UMTS), de la hoja de ejercicios del bloque 3 y de la PS8.
// Fuentes: Cx_3GandBeyond.pdf, Cx_EjerciciosRed3.pdf, Cx_Enlace.pdf. Sin DOM: se prueba con vitest.
import { fmt } from '../../../widgets/numeros';
import type { Paso } from '../../../widgets/desarrollo';
import { erlangB } from './erlang';

const tex = (n: number, dec = 4) => fmt(n, dec).replace(',', '{,}');

/* ─────────────── La escalera de velocidades ─────────────── */
export type Generacion = { id: string; nombre: string; gen: string; kbps: number; max?: number; etiqueta: string; texto: string };

/** Velocidades máximas teóricas de las diapositivas (kbps). La barra va en escala logarítmica. */
export const GENERACIONES: Generacion[] = [
  { id: 'gprs', nombre: 'GPRS', gen: '2,5G', kbps: 170, etiqueta: '170 kbps teóricos', texto: 'Núcleo de paquetes (SGSN y GGSN) sobre la interfaz radio de GSM y mejores codificaciones de canal. En las versiones finales llega «teóricamente» a 170 kbps.' },
  { id: 'edge', nombre: 'EDGE', gen: '2,75G', kbps: 384, etiqueta: '384 kbps', texto: 'Enhanced GPRS: modulación 8PSK en vez de GMSK, «casi 3G». El 3GPP lo sigue evolucionando para completar la cobertura de 3G y 4G: hasta 1,3 Mbps de bajada y 650 kbps de subida.' },
  { id: 'umts', nombre: "UMTS R'99", gen: '3G', kbps: 384, max: 2000, etiqueta: '384 kbps; hasta 2 Mbps con baja movilidad', texto: 'Primera versión de UMTS: acceso radio nuevo (W-CDMA) y núcleo heredado de GSM-GPRS, con asignación dinámica del ancho de banda a cada servicio.' },
  { id: 'hsdpa', nombre: 'HSDPA R5', gen: '3,5G', kbps: 14400, etiqueta: '14,4 Mbps de bajada (teórico)', texto: 'Canal de bajada compartido de alta velocidad con modulación y codificación adaptativas, HARQ y planificación de paquetes en el Nodo B. En la práctica, menores velocidades y latencias por debajo de 50 ms.' },
  { id: 'hsupa', nombre: 'HSUPA R6', gen: '3,5G', kbps: 7200, etiqueta: '7,2 Mbps de subida (teórico)', texto: 'La versión de subida: High Speed Uplink Packet Access.' },
  { id: 'hspa', nombre: 'HSPA+ R7', gen: '3,75G', kbps: 28800, etiqueta: '28,8 Mbps de bajada y 11 Mbps de subida (teórico)', texto: 'HSDPA evolucionada, con más velocidad en los dos sentidos.' },
  { id: 'lte', nombre: 'LTE R8', gen: '4G', kbps: 100000, max: 1000000, etiqueta: 'objetivo: 100 Mbps en movimiento y 1 Gbps en reposo', texto: 'Sistema nuevo (EPS), solo de paquetes y todo IP, con latencias del orden de 10 ms frente a los 50 ms de HSPA.' },
];
/** Ancho de la barra (0 a 100) en escala logarítmica de 100 kbps a 1 Gbps. */
export const anchoLog = (kbps: number) => Math.max(2, Math.min(100, ((Math.log10(kbps) - 2) / 4) * 100));

/* ─────────────── 3G, UMTS, R'99 y UTRAN ─────────────── */
export type Concepto = { id: 'g3' | 'umts' | 'r99' | 'utran'; nombre: string; naturaleza: string; texto: string; extra?: string };
export const CONCEPTOS: Concepto[] = [
  { id: 'g3', nombre: '3G', naturaleza: 'Un concepto: una generación', texto: 'Tercera generación de telefonía móvil, el estándar internacional IMT-2000. Fija objetivos (384 kbps y hasta 2 Mbps con baja movilidad) pero no es un único sistema. Antes están 2G (GSM) y 2,5G/2,75G (GPRS, EDGE); después, 4G.', extra: 'Extra: otras propuestas del mismo IMT-2000, como cdma2000 en EE. UU., también son 3G. UMTS es la europea.' },
  { id: 'umts', nombre: 'UMTS', naturaleza: 'Un sistema: la propuesta europea de 3G', texto: 'Universal Mobile Telecommunication System, definido por el 3GPP. Es el sistema completo: terminal (UE), red de acceso radio (UTRAN) y red troncal (CN). Usa el acceso W-CDMA, separa con claridad acceso y red troncal, es compatible con GSM (terminales duales, itinerancia y traspaso entre redes) y su objetivo final es «todo IP».' },
  { id: 'r99', nombre: "R'99", naturaleza: 'Una versión del estándar', texto: 'Release 99: la primera edición de las especificaciones de UMTS. Define una UTRAN completamente nueva (W-CDMA) con un núcleo heredado de GSM-GPRS, con sus dominios de circuitos (CS) y de paquetes (PS). Después vienen R4 (BICC), R5 (HSDPA, IMS), R6 y R7 (HSPA) y R8 (LTE).' },
  { id: 'utran', nombre: 'UTRAN', naturaleza: 'Un subsistema: la red de acceso radio de UMTS', texto: 'UMTS Radio Access Network. Conecta los terminales con el núcleo: interfaz Uu con el UE (radio) e Iu con la red (dominios PS y CS). Se compone de RNS (equivalentes a un BSS): un RNC (como el BSC, pero conectados entre sí por Iur) y varios Nodos B (como las BTS, por Iub).', extra: 'Extra: la sigla completa del 3GPP es UMTS Terrestrial Radio Access Network.' },
];

/* ─────────────── Arquitectura de la R'99 ─────────────── */
export type Elemento = { id: string; nombre: string; nuevo: boolean; gsm: string; texto: string };
export const ELEMENTOS_R99: Elemento[] = [
  { id: 'ue', nombre: 'UE', nuevo: true, gsm: 'MS', texto: 'El equipo de usuario. Los terminales duales GSM-UMTS suelen implementar solo el modo FDD.' },
  { id: 'nodob', nombre: 'Nodo B', nuevo: true, gsm: 'BTS', texto: 'Habla con el UE por la interfaz Uu (W-CDMA) y con su RNC por Iub. W-CDMA no es compatible con TDMA, así que hay que desplegar estaciones base nuevas.' },
  { id: 'rnc', nombre: 'RNC', nuevo: true, gsm: 'BSC', texto: 'Radio Network Controller. A diferencia de los BSC, los RNC están conectados entre sí por la interfaz Iur. Un RNC con sus Nodos B forma un RNS, parecido a un BSS.' },
  { id: 'msc', nombre: 'MSC / VLR', nuevo: false, gsm: 'MSC / VLR', texto: 'Dominio de circuitos heredado de GSM. Las funciones de MSC y SGSN pueden combinarse en un único equipo, el U-MSC.' },
  { id: 'gmsc', nombre: 'GMSC', nuevo: false, gsm: 'GMSC', texto: 'Pasarela hacia la red telefónica (RTC y RDSI), heredada de GSM. Combinada con el GGSN daría el U-GMSC.' },
  { id: 'reg', nombre: 'HLR · AuC · EIR · SMS-SC', nuevo: false, gsm: 'los mismos', texto: 'Registros y servicios heredados de GSM, que usan los dos dominios. Los SGSN pueden incluir su propio servicio de registro.' },
  { id: 'sgsn', nombre: 'SGSN', nuevo: false, gsm: 'SGSN de GPRS', texto: 'Dominio de paquetes heredado de GPRS: hace de MSC/VLR para los paquetes.' },
  { id: 'ggsn', nombre: 'GGSN', nuevo: false, gsm: 'GGSN de GPRS', texto: 'Pasarela hacia las redes IP externas, heredada de GPRS.' },
];
export const INTERFACES_R99: { id: string; une: string; texto: string }[] = [
  { id: 'Uu', une: 'UE ↔ Nodo B', texto: 'Interfaz radio (en GSM, Um).' },
  { id: 'Iub', une: 'Nodo B ↔ RNC', texto: 'Dentro de cada RNS (en GSM, Abis).' },
  { id: 'Iur', une: 'RNC ↔ RNC', texto: 'Nueva respecto a GSM: conecta los RNC entre sí.' },
  { id: 'Iu-CS', une: 'UTRAN ↔ dominio CS', texto: 'Hacia el MSC.' },
  { id: 'Iu-PS', une: 'UTRAN ↔ dominio PS', texto: 'Hacia el SGSN.' },
];

/* ─────────────── Calidad de servicio ─────────────── */
export type ClaseQos = { id: string; nombre: string; retardo: string; buffering: string; sentido: string; garantizado: string };
export const CLASES_QOS: ClaseQos[] = [
  { id: 'conv', nombre: 'Conversacional', retardo: 'Fijo (mínimo)', buffering: 'No', sentido: 'Simétrico, bidireccional', garantizado: 'Sí' },
  { id: 'aflu', nombre: 'Afluente (streaming)', retardo: 'Constante', buffering: 'Sí', sentido: 'Asimétrico, unidireccional', garantizado: 'Sí' },
  { id: 'inter', nombre: 'Interactiva', retardo: 'Variable (moderado)', buffering: 'Sí', sentido: 'Asimétrico, bidireccional', garantizado: 'No' },
  { id: 'dife', nombre: 'Diferible', retardo: 'Variable (grande)', buffering: 'Sí', sentido: 'Asimétrico, bidireccional', garantizado: 'No' },
];
export const ESCENARIOS_QOS: { id: string; texto: string; clase: string; porque: string }[] = [
  { id: 'voz', texto: 'Una llamada de voz', clase: 'conv', porque: 'Dos personas hablando: no se puede esperar ni acumular datos (sin buffering) y el retardo debe ser mínimo y fijo. Va en los dos sentidos por igual.' },
  { id: 'videollamada', texto: 'Una videollamada', clase: 'conv', porque: 'Igual que la voz: tiempo real y en los dos sentidos. Por eso es conversacional aunque lleve vídeo.' },
  { id: 'streaming', texto: 'Ver un vídeo o escuchar la radio en directo', clase: 'aflu', porque: 'Tiempo real pero en un solo sentido: el receptor puede acumular algo de datos (buffering) y lo importante es que el retardo sea constante, no mínimo.' },
  { id: 'web', texto: 'Navegar por la web', clase: 'inter', porque: 'Pides y esperas respuesta. No es tiempo real estricto y tolera un retardo variable moderado, pero tiene que responder en un tiempo razonable.' },
  { id: 'correo', texto: 'Descargar el correo o un fichero', clase: 'dife', porque: 'No hay prisa: tolera un retardo variable grande, así que la red puede enviarlo cuando le sobren recursos.' },
];

/* ─────────────── Del núcleo en capas a todo IP ─────────────── */
export type SistemaRed = { id: 'umts' | 'eps'; nombre: string; cadena: string[]; nodos: number; latencia: string; radio: string; senal: string; texto: string };
export const SISTEMAS: SistemaRed[] = [
  { id: 'umts', nombre: 'UMTS (R99 a R7)', cadena: ['UE', 'Nodo B', 'RNC', 'SGSN', 'GGSN', 'Internet'], nodos: 4, latencia: '< 50 ms (HSPA, en la práctica)', radio: 'W-CDMA (y HSPA)', senal: 'MAP', texto: 'Cuatro tipos de elemento entre el móvil y la red externa. Cada salto añade retardo y complica mejorar las prestaciones de extremo a extremo.' },
  { id: 'eps', nombre: 'EPS (R8, LTE)', cadena: ['UE', 'eNode-B', 'A-GW', 'Internet'], nodos: 2, latencia: '≈ 10 ms', radio: 'OFDMA (bajada) y SC-FDMA (subida)', senal: 'Diameter', texto: 'Solo dos tipos de elemento: el eNode-B asume las funciones del Nodo B y del RNC (recursos radio, QoS y movilidad) y la pasarela A-GW (S-GW y P-GW) lleva el tráfico de usuario. Topología plana y en malla.' },
];

/* ─────────────── Ensanchado de espectro (W-CDMA) ─────────────── */
/** Códigos de Walsh de 4 chips: ortogonales entre sí (ejemplo reducido; los reales son más largos). */
export const WALSH: number[][] = [[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1], [1, -1, -1, 1]];
export const FACTORES_SF = [4, 8, 16, 32, 64, 128, 256];
const signo = (b: number) => (b ? 1 : -1);
export function ensanchar(bits: number[], codigo: number[]): number[] {
  return bits.flatMap((b) => codigo.map((c) => signo(b) * c));
}
export function sumarSenales(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}
/** Correlación media de cada símbolo con un código: ±1 si es de ese usuario, 0 si es de otro ortogonal. */
export function desensanchar(suma: number[], codigo: number[]): number[] {
  const n = codigo.length, out: number[] = [];
  for (let i = 0; i < suma.length / n; i++) {
    let t = 0;
    for (let j = 0; j < n; j++) t += suma[i * n + j] * codigo[j];
    out.push(t / n);
  }
  return out;
}
/** Símbolos por segundo (en ksímb/s) con 3,84 Mchip/s y un factor de ensanchado SF. */
export const ksimbolos = (sf: number) => 3840 / sf;

/* ─────────────── Hoja del bloque 3, ejercicio 1 ─────────────── */
/** Multitrama de 51 tramas (comb. IV), en segundos. */
export const T51 = (51 * 0.12) / 26;
/** 9 bloques CCCH en la comb. IV; con PCH = 2 × AGCH, 6 son de PCH. */
export const BLOQUES_PCH = 6;
export function ej1Canales(ocupPch: number, ocupRach: number) {
  const capPch = BLOQUES_PCH / T51; // avisos/s (1 aviso = 1 bloque de 4 ráfagas)
  const avisosLA = (ocupPch / 100) * capPch;
  const lE = (avisosLA * 3600) / 2; // dos células de la misma LA reparten los avisos
  const capRach = 51 / T51; // una ranura por trama
  const peticiones = (ocupRach / 100) * capRach * 3600;
  const lS = peticiones - lE;
  const A = (peticiones / 3600) * 120;
  return { capPch, avisosLA, lE, capRach, peticiones, lS, A, NT: A / 0.05 };
}
export function pasosEj1Canales(ocupPch: number, ocupRach: number): Paso[] {
  const r = ej1Canales(ocupPch, ocupRach);
  return [
    { texto: `Combinación IV: 9 bloques CCCH por multitrama de 51 tramas (${tex(T51 * 1000, 2)} ms). El PCH tiene el doble que el AGCH, luego **6 bloques**. Un aviso ocupa 4 ráfagas = 1 bloque.`, formula: String.raw`C_{PCH} = \frac{6}{${tex(T51, 5)}\ \text{s}} = ${tex(r.capPch, 2)}\ \text{avisos/s}` },
    { texto: `Ocupación del PCH ${fmt(ocupPch)} %. El aviso se emite en **todas** las células del LA, así que esa tasa es la del LA entero:`, formula: String.raw`${tex(ocupPch / 100)} \cdot ${tex(r.capPch, 2)} = ${tex(r.avisosLA)}\ \text{avisos/s} = ${tex(r.avisosLA * 3600, 1)}\ \text{/h}` },
    { texto: 'Se reparte entre las dos células (carga similar):', formula: String.raw`\lambda_E = ${tex(r.avisosLA * 3600, 1)} / 2 = ${tex(r.lE, 1)}\ \text{llamadas/hora por célula}` },
    { texto: 'RACH de la combinación IV: una ranura por trama, 51 por multitrama. Cada petición es una ráfaga.', formula: String.raw`C_{RACH} = \frac{51}{${tex(T51, 5)}} = ${tex(r.capRach, 1)}\ \text{peticiones/s}` },
    { texto: `Ocupación del RACH ${fmt(ocupRach)} %. Las peticiones son de llamadas salientes **y** entrantes:`, formula: String.raw`\lambda_E + \lambda_S = ${tex(r.peticiones, 1)}\ \text{/h} \Rightarrow \lambda_S = ${tex(r.peticiones, 1)} - ${tex(r.lE, 1)} = ${tex(r.lS, 1)}\ \text{llamadas/hora}` },
    { texto: 'Tráfico vocal (solo conversación, 120 s de media) y terminales a 50 mE cada uno:', formula: String.raw`A = \frac{${tex(r.peticiones, 1)}}{3600} \cdot 120 = ${tex(r.A, 2)}\ \text{E}, \qquad N_T = \frac{${tex(r.A, 2)}}{0{,}05} = ${tex(r.NT, 0)}` },
  ];
}

/** Calidad de un sistema de 2 células con λE = λS = 350/h para NT = 468 (escala con NT) y SMS opcional. */
export function ej1Calidad(NT: number, smsPorHora = 1) {
  const lam = (700 * NT) / 468 / 3600; // llamadas/s por célula
  const As = lam * 6 + (NT / 3600) * smsPorHora * 6; // SDCCH: fase inicial (6 s) + SMS (6 s cada uno)
  const At = lam * (3 + 120); // TCH: resto del establecimiento + conversación
  const pbS = erlangB(16, As);
  const pbT = erlangB(29, At);
  const cursado = 2 * At * (1 - pbT); // lo que llega al Abis (comparten los 60 circuitos)
  const pbA = erlangB(60, cursado);
  return { lam, As, At, pbS, pbT, cursado, pbA, cumple: pbS < 0.002 && pbT < 0.02 && pbA < 0.01 };
}
export function ej1Maximo(smsPorHora = 1): number {
  let n = 1;
  while (n < 5000 && ej1Calidad(n + 1, smsPorHora).cumple) n++;
  return n;
}
export function pasosEj1Calidad(NT: number, smsPorHora = 1): Paso[] {
  const q = ej1Calidad(NT, smsPorHora);
  const sms = smsPorHora > 0;
  const marca = (ok: boolean) => (ok ? '✓' : '✗');
  return [
    { texto: `Por célula: 29 TCH (perfil medio), 16 SDCCH y un Abis de $15 \\times 4 = 60$ circuitos compartido. Llamadas: $700 \\cdot ${fmt(NT, 0)}/468 = ${tex((700 * NT) / 468, 1)}$ por hora.` },
    { texto: `**SDCCH** (6 s por establecimiento${sms ? ` y 6 s por SMS, ${fmt(smsPorHora)} SMS/h por terminal` : ''}):`, formula: String.raw`A_{S} = ${tex(q.lam * 6)}\ \text{E}${sms ? String.raw` + ${tex((NT / 3600) * smsPorHora * 6)}\ \text{E}` : ''} = ${tex(q.As)}\ \text{E} \Rightarrow P_B = ${tex(q.pbS, 8)}` },
    { texto: `${marca(q.pbS < 0.002)} Límite 0,002.` },
    { texto: '**TCH** (3 s del resto del establecimiento + 120 s de conversación):', formula: String.raw`A_{T} = ${tex(q.lam)} \cdot 123 = ${tex(q.At, 2)}\ \text{E} \Rightarrow P_B(29;\ ${tex(q.At, 2)}) = ${tex(q.pbT)}` },
    { texto: `${marca(q.pbT < 0.02)} Límite 2 %.` },
    { texto: '**Abis**: lo que llega es el tráfico cursado por los TCH de las dos células.', formula: String.raw`A_{Abis} = 2 \cdot ${tex(q.At, 2)} \cdot (1 - ${tex(q.pbT)}) = ${tex(q.cursado, 2)}\ \text{E} \Rightarrow P_B(60;\ ${tex(q.cursado, 2)}) = ${tex(q.pbA)}` },
    { texto: `${marca(q.pbA < 0.01)} Límite 1 %. Máximo de terminales que cumplen los tres criterios: **${fmt(ej1Maximo(smsPorHora), 0)} por célula**.` },
  ];
}

/* ─────────────── Hoja del bloque 3, ejercicio 2 ─────────────── */
export const SECTORIZACIONES = [{ grados: 120, n: 3 }, { grados: 90, n: 4 }, { grados: 60, n: 6 }, { grados: 45, n: 8 }];
const R_KM = 3;
/** Tiempos medios por intento de la tabla del enunciado. */
export const T_SDCCH = 11;
export const T_TCH = 0.4 * (0.6 * 95 + 0.2 * 12.5 + 0.2 * 0) + 0.6 * (0.6 * 95 + 0.4 * 0); // 58 s
export function ej2(n: number, densidad: number) {
  const usuarios = Math.PI * R_KM * R_KM * densidad;
  const lam = (usuarios * 0.8) / 3600;
  const AS = lam * T_SDCCH, AT = lam * T_TCH;
  return { usuarios, lam, AS, AT, as: AS / n, at: AT / n, pbS: erlangB(8, AS / n), pbT: erlangB(14, AT / n), pbA: erlangB(112, AT) };
}
export const ej2Cumple = (n: number, d: number) => { const r = ej2(n, d); return r.pbS < 0.001 && r.pbT < 0.01 && r.pbA < 0.01; };
/** La sectorización menos fina que cumple los tres criterios, o null. */
export function ej2Minimo(d: number) { return SECTORIZACIONES.find((s) => ej2Cumple(s.n, d)) ?? null; }
export function pasosEj2(n: number, d: number): Paso[] {
  const r = ej2(n, d);
  const min = ej2Minimo(d);
  return [
    { texto: 'Residentes en el círculo y intentos de llamada (cada residente interviene en 0,8 llamadas/hora):', formula: String.raw`N = ${fmt(d, 0)} \cdot \pi \cdot 3^2 = ${tex(r.usuarios, 0)}, \qquad \lambda = \frac{${tex(r.usuarios, 0)} \cdot 0{,}8}{3600} = ${tex(r.lam, 3)}\ \text{/s}` },
    { texto: 'Tiempo medio por intento. SDCCH: 11 s siempre. TCH: salientes $0{,}6 \\cdot 95 + 0{,}2 \\cdot 12{,}5 = 59{,}5$ s; entrantes $0{,}6 \\cdot 95 = 57$ s.', formula: String.raw`\bar t_{TCH} = 0{,}4 \cdot 59{,}5 + 0{,}6 \cdot 57 = 58\ \text{s}` },
    { texto: `Tráfico total: SDCCH $= ${tex(r.lam, 3)} \\cdot 11 = ${tex(r.AS, 2)}$ E y TCH $= ${tex(r.lam, 3)} \\cdot 58 = ${tex(r.AT, 2)}$ E. Con ${n} sectores, a cada célula le tocan ${tex(r.as, 2)} E de SDCCH (8 canales) y ${tex(r.at, 2)} E de TCH (14 canales).` },
    { texto: 'Cada célula tiene 2 portadoras = 16 ranuras: 1 C-IV, 1 C-VII (8 SDCCH) y 14 C-I (14 TCH). Erlang B por célula y en el Abis (28 × 4 = 112 circuitos):', formula: String.raw`P_{B,SDCCH} = ${tex(r.pbS, 5)},\quad P_{B,TCH} = ${tex(r.pbT, 5)},\quad P_{B,Abis} = ${tex(r.pbA, 5)}` },
    { texto: `Límites: 1 ‰, 1 % y 1 %. ${n} sectores: **${r.pbS < 0.001 && r.pbT < 0.01 && r.pbA < 0.01 ? 'se cumplen los tres' : 'no se cumplen'}**. ${min ? `La menos fina que cumple es **${min.grados}º (${min.n} células)**.` : 'Ni con 45º se cumple.'}` },
  ];
}

/* ─────────────── Hoja del bloque 3, ejercicio 3 (GPRS) ─────────────── */
export function ej3(NT: number) {
  const lam = ((NT * 0.04) / 120) * 1.75; // salientes + 75 % de entrantes
  const AS = lam * 6;
  const pbS = erlangB(4, AS); // comb. V: 4 SDCCH
  const AT = lam * 123 * (1 - pbS);
  const pbT = erlangB(30, AT);
  const cursado = AT * (1 - pbT);
  const libres = 30 - cursado;
  return { lam, AS, pbS, AT, pbT, cursado, libres, BR: libres * 12, kbps: libres * 12 * 1.9 };
}
export function pasosEj3(NT: number): Paso[] {
  const r = ej3(NT);
  return [
    { texto: 'Un BR son 4 ráfagas normales de 114 bits y se repite cada multitrama de 52 tramas (240 ms):', formula: String.raw`R_{BR} = \frac{4 \cdot 114}{240\ \text{ms}} = 1{,}9\ \text{kbps}` },
    { texto: `Voz saliente: $${fmt(NT, 0)} \\cdot 0{,}04 = ${tex(NT * 0.04, 2)}$ E, es decir $\\lambda_{sal} = ${tex(NT * 0.04 / 120)}$ llamadas/s. Las entrantes son el 75 %:`, formula: String.raw`\lambda = ${tex(NT * 0.04 / 120)} \cdot 1{,}75 = ${tex(r.lam)}\ \text{/s}` },
    { texto: 'El SDCCH (4 canales, comb. V) ocupa 6 s por llamada y bloquea antes que el TCH:', formula: String.raw`A_S = ${tex(r.lam)} \cdot 6 = ${tex(r.AS)}\ \text{E} \Rightarrow P_{B,S} = ${tex(r.pbS)}` },
    { texto: 'Al TCH llegan las que no se bloquean en el SDCCH, con 3 s + 120 s de ocupación. Hay 30 canales de tráfico ($4 \\cdot 8 - 2$):', formula: String.raw`A_T = ${tex(r.lam)} \cdot 123 \cdot (1 - ${tex(r.pbS)}) = ${tex(r.AT, 2)}\ \text{E} \Rightarrow P_{B,T}(30) = ${tex(r.pbT)}` },
    { texto: 'La voz cursada ocupa canales y GPRS usa los que quedan, 12 BR por combinación:', formula: String.raw`A_{cur} = ${tex(r.AT, 2)}(1 - ${tex(r.pbT)}) = ${tex(r.cursado, 2)}\ \text{E}, \quad N_{GPRS} = 30 - ${tex(r.cursado, 2)} = ${tex(r.libres, 3)}, \quad N_{BR} = ${tex(r.libres, 3)} \cdot 12 = ${tex(r.BR, 2)}` },
  ];
}

/* ─────────────── PS8 ─────────────── */
/** Relleno de bits de HDLC: tras cinco 1 seguidos se inserta un 0. Devuelve los bits y las posiciones insertadas. */
export function rellenarBits(entrada: string): { bits: string; insertados: number[] } {
  let unos = 0, bits = '';
  const insertados: number[] = [];
  for (const b of entrada.replace(/[^01]/g, '')) {
    bits += b;
    if (b === '1') {
      unos++;
      if (unos === 5) { insertados.push(bits.length); bits += '0'; unos = 0; }
    } else unos = 0;
  }
  return { bits, insertados };
}
/** Quita el 0 que sigue a cinco 1 (receptor). */
export function quitarRelleno(recibido: string): string {
  let unos = 0, out = '';
  for (const b of recibido.replace(/[^01]/g, '')) {
    if (unos === 5) { unos = 0; if (b === '0') continue; }
    out += b;
    unos = b === '1' ? unos + 1 : 0;
  }
  return out;
}
export const DATOS_PS8 = '01111110010100000111111001111110';

/** Secuencia HDLC de la PS8 con números de 3 bits. Las filas con `respuesta` son los recuadros del examen. */
export type FilaHdlc = { de: 'A' | 'B'; dato?: string; respuesta?: string; perdida?: boolean; porque?: string; esperaB?: string; esperaA?: string };
export const SECUENCIA_PS8: FilaHdlc[] = [
  { de: 'A', dato: 'I(5,0)', esperaA: '0', esperaB: '6' },
  { de: 'A', dato: 'I(6,0)', perdida: true, esperaB: '6' },
  { de: 'A', dato: 'I(7,0)', esperaB: '6' },
  { de: 'B', respuesta: 'REJ(6)', porque: 'B ha aceptado la I(5,0) y espera la 6. Le llega la I(7,0): fuera de secuencia. La descarta (solo procesa en orden) y pide REJ(6): «reenvía desde la 6». Es una trama de supervisión: lleva N(R) pero no N(S).' },
  { de: 'A', respuesta: 'I(6,0)', porque: 'A obedece el REJ y retransmite desde la 6. Su N(S) es 6. Su N(R) sigue en 0 porque aún no ha recibido ninguna trama I de B.', esperaB: '7' },
  { de: 'B', respuesta: 'I(0,7)', porque: 'B tiene datos para A: es su primera trama I, así que N(S) = 0. Su N(R) es 7, porque ya ha aceptado la 5 y la 6 y espera la 7. Esta trama confirma a la vez todo lo de A hasta la 6.', esperaA: '1' },
  { de: 'A', respuesta: 'I(7,1)', porque: 'A retransmite la 7, la que B descartó. Su N(R) es ahora 1: ha recibido la trama 0 de B y espera la 1.', esperaB: '0' },
  { de: 'A', respuesta: 'I(0,1)', porque: 'La trama siguiente a la 7 es la 0, no la 8: con 3 bits los números van de 0 a 7 y se repiten (módulo 8).', esperaB: '1' },
];
