// Arquitectura de red GSM (la del sitio antiguo, con la disposición del
// prototipo C): elementos con su subsistema, qué hacen, qué guardan y por qué
// interfaces hablan, y los enlaces con el nombre de su interfaz ('' = sin nombre).

export type Subsistema = 'RSS' | 'BSS' | 'NSS' | 'OSS' | 'EXT';
export type Nodo = {
  id: string; etiqueta: string; titulo: string; sub: Subsistema;
  x: number; y: number; // centro, en el lienzo de 700 × 290
  hace: string; guarda: string; interfaces: string;
};
export type Enlace = { a: string; b: string; interfaz: string };

// Color de cada subsistema (token del tema) y el del texto que va encima cuando
// está elegido; las pruebas de contraste comprueban cada par en claro y oscuro.
export const COLORES_SUBSISTEMA: Record<Subsistema, { k: string; sobreK: string }> = {
  RSS: { k: 'resalte', sobreK: 'sobre-resalte' },
  BSS: { k: 'primario', sobreK: 'sobre-primario' },
  NSS: { k: 'acento2', sobreK: 'superficie' },
  OSS: { k: 'suave', sobreK: 'superficie' },
  EXT: { k: 'linea', sobreK: 'texto' },
};
// Cordones en reposo: tienen que verse (3:1) sobre la superficie del widget
export const TOKEN_CORDON = 'suave';

/** Variables CSS (--k y --sobre-k) con los colores de un subsistema, para un atributo style. */
export function colorDe(sub: Subsistema): string {
  const c = COLORES_SUBSISTEMA[sub];
  return `--k: var(--${c.k}); --sobre-k: var(--${c.sobreK})`;
}

export const SUBSISTEMAS: Record<Subsistema, { nombre: string; resumen: string }> = {
  RSS: { nombre: 'Subsistema de radio', resumen: 'El terminal: el móvil y su SIM.' },
  BSS: { nombre: 'Subsistema de estaciones base', resumen: 'Controla la radio: BTS, BSC y TRAU.' },
  NSS: { nombre: 'Subsistema de red y conmutación', resumen: 'Conmuta y guarda los registros: MSC, GMSC, VLR, HLR, AuC y la pasarela de SMS.' },
  OSS: { nombre: 'Subsistema de operación', resumen: 'Opera y mantiene la red: OMC y EIR.' },
  EXT: { nombre: 'Red externa', resumen: 'Las redes fijas a las que se llega por la pasarela del GMSC.' },
};

export const NODOS: Nodo[] = [
  {
    id: "MS",
    etiqueta: "MS",
    titulo: "MS, estación móvil",
    sub: "RSS",
    x: 45,
    y: 150,
    hace: "Terminal físico (Tx/Rx radio, codecs, pantalla, batería) más la SIM. Es el único elemento que habla por la interfaz aérea.",
    guarda: "En la SIM: IMSI, Ki, TMSI, área de localización, Kc, PIN y PUK.",
    interfaces: "Um, con la BTS."
  },
  {
    id: "BTS",
    etiqueta: "BTS",
    titulo: "BTS, estación transceptora base",
    sub: "BSS",
    x: 150,
    y: 150,
    hace: "Elemento pasivo que depende de un controlador. Tiene antenas, amplificadores y planta de energía, y sirve a una o más células. Suele incluir funciones TRAU.",
    guarda: "Nada de abonados: solo transmite y recibe.",
    interfaces: "Um con los móviles y Abis con la BSC."
  },
  {
    id: "BSC",
    etiqueta: "BSC",
    titulo: "BSC, controladora de estaciones base",
    sub: "BSS",
    x: 265,
    y: 150,
    hace: "Gestiona los recursos radio de las BTS que controla (decenas): espectro, asignación de canales y traspasos. Puede incluir funciones TRAU.",
    guarda: "Configuración de sus BTS y de los canales.",
    interfaces: "Abis (BTS), A (MSC) y O (OSS)."
  },
  {
    id: "TRAU",
    etiqueta: "TRAU",
    titulo: "TRAU, transcodificación y adaptación de velocidad",
    sub: "BSS",
    x: 265,
    y: 255,
    hace: "Convierte la voz de 13/6,5 kbps a los 64 kbps de la red terrestre (transcodificación) y adapta la velocidad de los datos. Va habitualmente junto a la BTS o la BSC.",
    guarda: "Nada.",
    interfaces: "Depende de dónde se coloque: junto a la BTS, la BSC o el MSC (mira el apartado «El TRAU» de este tema)."
  },
  {
    id: "MSC",
    etiqueta: "MSC",
    titulo: "MSC, centro de conmutación móvil",
    sub: "NSS",
    x: 395,
    y: 150,
    hace: "Es la central telefónica del núcleo GSM: controla y encamina las llamadas y las comunicaciones de datos entre usuarios. Hace de capa de red con los móviles (MM y CM).",
    guarda: "Nada propio: consulta el VLR asociado y el HLR.",
    interfaces: "A (BSC), B (VLR), C, E y F con otros conmutadores y registros."
  },
  {
    id: "GMSC",
    etiqueta: "GMSC",
    titulo: "GMSC, MSC de pasarela",
    sub: "NSS",
    x: 525,
    y: 150,
    hace: "Un MSC que además contiene la pasarela hacia la red fija (RTC/RDSI) y otras plataformas de servicio (como el SMSC).",
    guarda: "Nada propio. Está asociado al HLR del sistema.",
    interfaces: "C con el HLR, E con otros MSC, y pasarelas a RTC/RDSI y SMS."
  },
  {
    id: "VLR",
    etiqueta: "VLR",
    titulo: "VLR, registro de visitantes",
    sub: "NSS",
    x: 395,
    y: 50,
    hace: "Tiene la información de los abonados ACTIVOS en el área de un MSC. Hay un registro asociado a cada MSC. Asigna los TMSI.",
    guarda: "Perfil del abonado visitante, su LA y su TMSI.",
    interfaces: "B con el MSC, D con el HLR y G con otros VLR."
  },
  {
    id: "HLR",
    etiqueta: "HLR",
    titulo: "HLR, registro base",
    sub: "NSS",
    x: 525,
    y: 50,
    hace: "Base de datos de los abonados del sistema. Traduce el número público (MSISDN) a la identidad real (IMSI) y sabe en qué VLR está cada uno. Está asociado al GMSC y suele ser único en la red.",
    guarda: "Identidades, servicios contratados, datos de autenticación y localización.",
    interfaces: "C con el GMSC, D con el VLR y H con el AuC."
  },
  {
    id: "AuC",
    etiqueta: "AuC",
    titulo: "AuC, centro de autenticación",
    sub: "NSS",
    x: 645,
    y: 50,
    hace: "Tiene la información necesaria para autenticar y cifrar los servicios: almacena los algoritmos de autenticación y cifrado y genera las claves de cada servicio (las tripletas). Asociado al HLR.",
    guarda: "Ki de cada abonado y algoritmos A3 y A8.",
    interfaces: "H con el HLR."
  },
  {
    id: "RTC",
    etiqueta: "RTC/RDSI",
    titulo: "Red fija (RTC y RDSI)",
    sub: "EXT",
    x: 645,
    y: 150,
    hace: "Redes externas a las que se llega por la pasarela del GMSC.",
    guarda: "—",
    interfaces: "Con el GMSC."
  },
  {
    id: "SMSG",
    etiqueta: "SMSG",
    titulo: "SMSG, pasarela SMS",
    sub: "NSS",
    x: 645,
    y: 255,
    hace: "Pasarela hacia el centro de servicio de SMS (SMSC), que se considera externo a la red GSM.",
    guarda: "—",
    interfaces: "Con el GMSC."
  },
  {
    id: "OMC",
    etiqueta: "OMC",
    titulo: "OMC, centro de operación y mantenimiento",
    sub: "OSS",
    x: 150,
    y: 255,
    hace: "Monitoriza y controla los elementos de red (BSS y NSS) y genera los registros de uso para la tarificación posterior (CDR, Call Detail Record).",
    guarda: "Registros de uso y estado de la red.",
    interfaces: "O, con la BSC y el MSC."
  },
  {
    id: "EIR",
    etiqueta: "EIR",
    titulo: "EIR, registro de identidades de equipo",
    sub: "OSS",
    x: 525,
    y: 255,
    hace: "Base de datos de equipos (terminales, no abonados). Permite gestionar listas de equipos válidos, robados o dudosos.",
    guarda: "El IMEI de los terminales.",
    interfaces: "F con el MSC."
  }
];

export const ENLACES: Enlace[] = [
  {
    a: "MS",
    b: "BTS",
    interfaz: "Um"
  },
  {
    a: "BTS",
    b: "BSC",
    interfaz: "Abis"
  },
  {
    a: "BSC",
    b: "MSC",
    interfaz: "A"
  },
  {
    a: "BSC",
    b: "TRAU",
    interfaz: ""
  },
  {
    a: "MSC",
    b: "VLR",
    interfaz: "B"
  },
  {
    a: "MSC",
    b: "GMSC",
    interfaz: "E"
  },
  {
    a: "GMSC",
    b: "HLR",
    interfaz: "C"
  },
  {
    a: "VLR",
    b: "HLR",
    interfaz: "D"
  },
  {
    a: "HLR",
    b: "AuC",
    interfaz: "H"
  },
  {
    a: "MSC",
    b: "EIR",
    interfaz: "F"
  },
  {
    a: "GMSC",
    b: "RTC",
    interfaz: ""
  },
  {
    a: "GMSC",
    b: "SMSG",
    interfaz: ""
  },
  {
    a: "BSC",
    b: "OMC",
    interfaz: "O"
  },
  {
    a: "MSC",
    b: "OMC",
    interfaz: "O"
  }
];
