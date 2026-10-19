// Mapa de conceptos de Ópticas: los conceptos de cada tema y por qué se relacionan.
// Con estos datos se dibuja el mapa de la portada y se genera el «Se conecta con» de cada tema.
// Las relaciones salen de los apuntes (de Javier y de Miguel); los conceptos de redes van
// como pendientes hasta que tengan su tema.

/** Las bandas siguen la cadena del enlace: de dónde sale la luz hasta adónde llega. */
export const BANDAS = [
  { id: 'emisores', nombre: 'Emisores' },
  { id: 'fibra', nombre: 'Fibra' },
  { id: 'dispositivos', nombre: 'Dispositivos y WDM' },
  { id: 'amplificacion', nombre: 'Amplificación' },
  { id: 'detectores', nombre: 'Detectores' },
  { id: 'redes', nombre: 'Redes' },
] as const;

export type Banda = (typeof BANDAS)[number]['id'];

/** Un concepto. tema: el slug del tema donde se explica (los pendientes aún no lo tienen). */
export type Nodo = { id: string; nombre: string; banda: Banda; tema?: string; pendiente?: boolean };

/** Una relación entre dos conceptos, con una frase que dice por qué. */
export type Arista = { de: string; a: string; porque: string };

export const NODOS: Nodo[] = [
  // Emisores
  { id: 'electroluminiscencia', nombre: 'Electroluminiscencia', banda: 'emisores', tema: 'led' },
  { id: 'gap', nombre: 'Gap directo e indirecto', banda: 'emisores', tema: 'led' },
  { id: 'led', nombre: 'LED', banda: 'emisores', tema: 'led' },
  { id: 'estimulada', nombre: 'Emisión estimulada', banda: 'emisores', tema: 'laser' },
  { id: 'fabry-perot', nombre: 'Resonador Fabry-Pérot', banda: 'emisores', tema: 'laser' },
  { id: 'umbral', nombre: 'Umbral y curva P-I', banda: 'emisores', tema: 'laser' },
  { id: 'coherencia', nombre: 'Luz coherente', banda: 'emisores', tema: 'laser' },
  { id: 'pozo', nombre: 'Pozo cuántico', banda: 'emisores', tema: 'laser-monomodo' },
  { id: 'dfb', nombre: 'Láser DFB y DBR', banda: 'emisores', tema: 'laser-monomodo' },
  { id: 'temperatura', nombre: 'Temperatura y λ', banda: 'emisores', tema: 'laser-monomodo' },
  { id: 'modulacion', nombre: 'Modulación directa y externa', banda: 'emisores', tema: 'laser-monomodo' },
  { id: 'ruido-laser', nombre: 'Ruido del láser', banda: 'emisores', tema: 'laser-monomodo' },
  // Fibra
  { id: 'fibra', nombre: 'Estructura de la fibra', banda: 'fibra', tema: 'estructura-fibra' },
  { id: 'reflexion', nombre: 'Reflexión total y NA', banda: 'fibra', tema: 'estructura-fibra' },
  { id: 'atenuacion', nombre: 'Atenuación y ventanas', banda: 'fibra', tema: 'atenuacion' },
  { id: 'rayleigh', nombre: 'Esparcimiento Rayleigh', banda: 'fibra', tema: 'atenuacion' },
  { id: 'dispersion', nombre: 'Dispersión cromática', banda: 'fibra', tema: 'dispersion' },
  { id: 'desplazada', nombre: 'Dispersión desplazada', banda: 'fibra', tema: 'dispersion' },
  { id: 'fwm', nombre: 'Mezcla de cuatro ondas', banda: 'fibra', tema: 'efectos-no-lineales' },
  { id: 'no-lineales', nombre: 'Raman y Brillouin', banda: 'fibra', tema: 'efectos-no-lineales' },
  { id: 'fabricacion', nombre: 'Preforma y estirado', banda: 'fibra', tema: 'fabricacion-cableado' },
  { id: 'otdr', nombre: 'OTDR', banda: 'fibra', tema: 'fabricacion-cableado' },
  // Dispositivos y WDM
  { id: 'aislador', nombre: 'Aislador óptico', banda: 'dispositivos', tema: 'dispositivos-pasivos' },
  { id: 'bragg', nombre: 'Red de Bragg', banda: 'dispositivos', tema: 'dispositivos-pasivos' },
  { id: 'acoplador', nombre: 'Acopladores', banda: 'dispositivos', tema: 'dispositivos-pasivos' },
  { id: 'dwdm', nombre: 'DWDM', banda: 'dispositivos', tema: 'wdm' },
  { id: 'cwdm', nombre: 'CWDM', banda: 'dispositivos', tema: 'wdm' },
  // Amplificación
  { id: 'soa', nombre: 'SOA', banda: 'amplificacion', tema: 'amplificadores' },
  { id: 'edfa', nombre: 'EDFA', banda: 'amplificacion', tema: 'amplificadores' },
  { id: 'raman', nombre: 'Raman', banda: 'amplificacion', tema: 'amplificadores' },
  { id: 'ase', nombre: 'Ruido ASE', banda: 'amplificacion', tema: 'amplificadores' },
  // Detectores
  { id: 'fotodiodo', nombre: 'Fotodiodo en inversa', banda: 'detectores', tema: 'fotodetectores' },
  { id: 'pin', nombre: 'Fotodiodo PIN', banda: 'detectores', tema: 'fotodetectores' },
  { id: 'apd', nombre: 'APD', banda: 'detectores', tema: 'fotodetectores' },
  { id: 'material', nombre: 'Respuesta espectral', banda: 'detectores', tema: 'fotodetectores' },
  { id: 'responsividad', nombre: 'Responsividad y η', banda: 'detectores', tema: 'fotodetectores' },
  { id: 'ruido-detector', nombre: 'Ruido del detector', banda: 'detectores', tema: 'fotodetectores' },
  // Redes (fase 2)
  { id: 'enlace', nombre: 'Diseño de enlaces', banda: 'redes', pendiente: true },
];

export const ARISTAS: Arista[] = [
  // Dentro de los emisores
  { de: 'electroluminiscencia', a: 'led', porque: 'El LED emite por electroluminiscencia: electrones y huecos se recombinan en la unión de forma espontánea.' },
  { de: 'gap', a: 'led', porque: 'Solo un gap directo da luz, y el gap fija la λ del LED (λ = hc/Eg).' },
  { de: 'led', a: 'estimulada', porque: 'El LED emite de forma espontánea; el láser, estimulada: por eso el láser es mucho más estrecho y coherente.' },
  { de: 'estimulada', a: 'coherencia', porque: 'Cada fotón estimulado es un clon del que lo provoca: misma λ, fase y dirección.' },
  { de: 'estimulada', a: 'umbral', porque: 'Por encima de la corriente umbral la emisión estimulada vence a las pérdidas y el láser arranca.' },
  { de: 'fabry-perot', a: 'umbral', porque: 'Los espejos del resonador devuelven la luz al medio activo: sin esa realimentación no hay láser.' },
  { de: 'fabry-perot', a: 'dfb', porque: 'El Fabry-Pérot oscila en varios modos (unos 4 nm); el DFB y el DBR filtran uno solo.' },
  { de: 'pozo', a: 'dfb', porque: 'El pozo cuántico ajusta el gap, y con él la λ, con mucha precisión: otra pieza de los láseres monomodo.' },
  { de: 'temperatura', a: 'ruido-laser', porque: 'Los cambios de temperatura provocan saltos de un modo a otro (mode hopping).' },
  { de: 'modulacion', a: 'ruido-laser', porque: 'La modulación directa trae chirp y jitter; la externa los evita.' },
  // De los emisores al resto del enlace
  { de: 'led', a: 'fibra', porque: 'El haz ancho del LED se acopla mal a la fibra; el del láser, mucho mejor.' },
  { de: 'led', a: 'dwdm', porque: 'El LED es demasiado ancho (unos 50 nm): no sirve para DWDM.' },
  { de: 'dfb', a: 'dwdm', porque: 'DWDM necesita láseres monomodo con la λ controlada en fracciones de nm.' },
  { de: 'temperatura', a: 'dwdm', porque: 'Si el láser se calienta, su λ sube y puede invadir el canal DWDM vecino.' },
  { de: 'temperatura', a: 'cwdm', porque: 'Con canales cada 20 nm, CWDM admite láseres sin refrigeración.' },
  { de: 'led', a: 'fotodiodo', porque: 'El fotodiodo es un emisor al revés: absorbe el fotón y crea un par electrón-hueco.' },
  { de: 'gap', a: 'material', porque: 'Un detector solo ve fotones con más energía que su gap: de ahí el corte de cada material.' },
  // Dentro de la fibra
  { de: 'reflexion', a: 'atenuacion', porque: 'Si una curvatura rompe la condición de ángulo crítico, la luz se escapa: atenuación por curvatura.' },
  { de: 'fibra', a: 'dispersion', porque: 'En multimodo cada modo sigue su camino y el pulso se ensancha; la monomodo elimina esa dispersión modal.' },
  { de: 'fibra', a: 'fabricacion', porque: 'El núcleo con más n (dopado con GeO₂) se forma al depositar los vapores en la preforma.' },
  { de: 'rayleigh', a: 'otdr', porque: 'El OTDR mide la luz que el esparcimiento Rayleigh devuelve hacia atrás.' },
  { de: 'atenuacion', a: 'desplazada', porque: 'La fibra de dispersión desplazada junta en 1550 nm la mínima dispersión y la mínima atenuación.' },
  { de: 'desplazada', a: 'fwm', porque: 'Con D = 0 los canales van en fase y aparece la mezcla de cuatro ondas: por eso se deja un poco de dispersión.' },
  // Dispositivos y WDM
  { de: 'aislador', a: 'ruido-laser', porque: 'El aislador impide que las reflexiones vuelvan al láser y le causen ruido modal.' },
  { de: 'bragg', a: 'dfb', porque: 'La red de Bragg es el mismo espejo selectivo que usan los láseres DBR y DFB.' },
  { de: 'bragg', a: 'dispersion', porque: 'Una red de Bragg estirada (chirp) refleja cada λ en un punto distinto y compensa la dispersión.' },
  { de: 'acoplador', a: 'dwdm', porque: 'Los acopladores juntan varias señales en una sola fibra para multiplexarlas.' },
  // Amplificación
  { de: 'estimulada', a: 'edfa', porque: 'El EDFA amplifica por emisión estimulada de los iones de erbio, excitados por el láser de bombeo.' },
  { de: 'fabry-perot', a: 'soa', porque: 'El SOA es un láser sin espejos: caras antirreflejantes para que no haya resonador.' },
  { de: 'temperatura', a: 'soa', porque: 'El SOA solo sirve para una λ, así que hay que estabilizarlo en temperatura.' },
  { de: 'ase', a: 'edfa', porque: 'El ruido principal del EDFA es la emisión espontánea de los iones de erbio (ASE).' },
  { de: 'edfa', a: 'dwdm', porque: 'Un EDFA amplifica a la vez todos los canales DWDM que caen en su banda.' },
  { de: 'edfa', a: 'atenuacion', porque: 'El EDFA trabaja en la banda de 1550 nm, la ventana de mínima atenuación.' },
  { de: 'raman', a: 'no-lineales', porque: 'El Raman aprovecha un efecto no lineal de la propia fibra: el esparcimiento Raman estimulado.' },
  { de: 'fabricacion', a: 'edfa', porque: 'La fibra dopada con erbio del EDFA se fabrica igual, dopando el núcleo en la preforma.' },
  { de: 'fwm', a: 'dwdm', porque: 'La mezcla de cuatro ondas solo aparece con canales muy juntos y potentes: es un problema del DWDM.' },
  { de: 'edfa', a: 'apd', porque: 'El EDFA amplifica la luz antes de detectarla; el APD gana dentro del detector, ya en electrónica.' },
  // Detectores
  { de: 'material', a: 'dwdm', porque: 'Para recibir en 1550 nm hace falta InGaAs o Ge: el Si corta hacia 1100 nm.' },
  { de: 'material', a: 'responsividad', porque: 'La eficiencia cuántica y la responsividad dependen del material y de la λ.' },
  { de: 'fotodiodo', a: 'pin', porque: 'El PIN añade una zona intrínseca ancha: absorbe más fotones, a costa de velocidad.' },
  { de: 'pin', a: 'apd', porque: 'El APD añade ganancia por avalancha, a costa de más ruido.' },
  { de: 'apd', a: 'ruido-detector', porque: 'La avalancha multiplica también el ruido: se mide con la figura de ruido.' },
  { de: 'apd', a: 'enlace', porque: 'La sensibilidad del receptor marca la potencia mínima en el diseño del enlace.' },
];

const POR_ID = new Map(NODOS.map((n) => [n.id, n]));

/** Un nodo por su id (lanza un error si no existe). */
export function nodo(id: string): Nodo {
  const n = POR_ID.get(id);
  if (!n) throw new Error(`mapa: el nodo ${id} no existe`);
  return n;
}

/** Relaciones de un nodo: el otro extremo y el porqué, en el orden de ARISTAS. */
export function vecinos(id: string): { otro: Nodo; porque: string }[] {
  return ARISTAS.filter((a) => a.de === id || a.a === id)
    .map((a) => ({ otro: nodo(a.de === id ? a.a : a.de), porque: a.porque }));
}

/**
 * «Se conecta con» de un tema: los otros temas con los que comparte relaciones, con el
 * porqué de la primera. Primero los que tienen más relaciones; como mucho «max».
 */
export function conexionesDeTema(tema: string, max = 4): { tema: string; porque: string }[] {
  const grupos = new Map<string, string[]>();
  for (const a of ARISTAS) {
    const [x, y] = [nodo(a.de), nodo(a.a)];
    const otro = x.tema === tema ? y : y.tema === tema ? x : undefined;
    if (!otro?.tema || otro.tema === tema) continue;
    grupos.set(otro.tema, [...(grupos.get(otro.tema) ?? []), a.porque]);
  }
  return [...grupos.entries()]
    .sort((p, q) => q[1].length - p[1].length)
    .slice(0, max)
    .map(([t, porques]) => ({ tema: t, porque: porques[0] }));
}

/** Errores de los datos del mapa (vacío si todo cuadra). temas: los slugs que existen. */
export function validarMapa(temas: string[]): string[] {
  const err: string[] = [];
  const existentes = new Set(temas);
  const vistos = new Set<string>();
  for (const n of NODOS) {
    if (vistos.has(n.id)) err.push(`nodo ${n.id}: id repetido`);
    vistos.add(n.id);
    if (n.pendiente && n.tema) err.push(`nodo ${n.id}: un nodo pendiente no puede tener tema`);
    if (!n.pendiente && (!n.tema || !existentes.has(n.tema))) err.push(`nodo ${n.id}: el tema ${n.tema} no existe`);
  }
  const conectados = new Set<string>();
  const parejas = new Set<string>();
  for (const a of ARISTAS) {
    const nombre = `arista ${a.de}→${a.a}`;
    if (!POR_ID.has(a.de) || !POR_ID.has(a.a)) { err.push(`${nombre}: un extremo no existe`); continue; }
    if (a.de === a.a) err.push(`${nombre}: une un nodo consigo mismo`);
    const clave = [a.de, a.a].sort().join('|');
    if (parejas.has(clave)) err.push(`${nombre}: repetida`);
    parejas.add(clave);
    if (!a.porque.trim()) err.push(`${nombre}: falta el porqué`);
    conectados.add(a.de); conectados.add(a.a);
  }
  for (const n of NODOS) if (!conectados.has(n.id)) err.push(`nodo ${n.id}: está suelto`);
  return err;
}
