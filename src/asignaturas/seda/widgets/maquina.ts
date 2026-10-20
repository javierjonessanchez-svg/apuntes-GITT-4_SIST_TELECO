// Máquinas de estados (StateCharts) para el widget de SEDA: estados con entry/do/exit,
// transiciones «evento / acción» y la regla de UML para una transición externa:
// primero el exit del estado de origen, luego la acción y por último el entry del destino.

export type Estado = {
  nombre: string;
  entry?: string;
  do?: string;
  exit?: string;
  padre?: string;                          // superestado (jerarquía), solo para dibujarlo
  caja: { x: number; y: number; w: number; h: number };
};
export type Transicion = {
  de: string;
  evento: string;
  a: string;
  accion?: string;
  d: string;                               // trazado SVG de la flecha
  etiqueta: { x: number; y: number };
};
export type Maquina = {
  inicial: string;
  estados: Record<string, Estado>;
  transiciones: Transicion[];
  superestados?: { nombre: string; caja: { x: number; y: number; w: number; h: number } }[];
  ancho: number;
  alto: number;
};

/** Dispara un evento. Si no hay transición desde ese estado, no pasa nada. */
export function paso(m: Maquina, estado: string, evento: string): { estado: string; acciones: string[] } {
  const t = m.transiciones.find((x) => x.de === estado && x.evento === evento);
  if (!t) return { estado, acciones: [] };
  const acciones = [m.estados[t.de].exit, t.accion, m.estados[t.a].entry].filter((a): a is string => Boolean(a));
  return { estado: t.a, acciones };
}

/** Eventos que hacen algo en ese estado, sin repetir, en el orden de la tabla. */
export function eventosPosibles(m: Maquina, estado: string): string[] {
  return [...new Set(m.transiciones.filter((t) => t.de === estado).map((t) => t.evento))];
}

/** El horno microondas de clase: el superestado «Esperando» (IDLE e Ingresando) y Calentando. */
export const microondas: Maquina = {
  inicial: 'idle',
  ancho: 660,
  alto: 340,
  superestados: [{ nombre: 'Esperando', caja: { x: 8, y: 28, w: 262, h: 300 } }],
  estados: {
    idle: { nombre: 'IDLE', entry: 'display ← hora', padre: 'Esperando', caja: { x: 60, y: 66, w: 190, h: 64 } },
    ingresando: { nombre: 'Ingresando', entry: 'display ← tiempo', padre: 'Esperando', caja: { x: 60, y: 226, w: 190, h: 64 } },
    calentando: {
      nombre: 'Calentando', entry: 'magnetrón ON, Timer ON', do: 'tiempo−− cada 1 s', exit: 'magnetrón OFF, Timer OFF',
      caja: { x: 400, y: 66, w: 250, h: 92 },
    },
    puerta: { nombre: 'Puerta abierta', entry: 'display parpadea', caja: { x: 400, y: 236, w: 250, h: 64 } },
  },
  transiciones: [
    { de: 'idle', evento: 'tecla', a: 'ingresando', accion: 'guardar dígito', d: 'M120 130 V224', etiqueta: { x: 126, y: 182 } },
    { de: 'ingresando', evento: 'tecla', a: 'ingresando', accion: 'añadir dígito', d: 'M60 246 C24 246 24 274 60 274', etiqueta: { x: 20, y: 304 } },
    { de: 'ingresando', evento: 'cancelar', a: 'idle', accion: 'tiempo ← 0', d: 'M200 226 V132', etiqueta: { x: 206, y: 182 } },
    { de: 'ingresando', evento: 'start', a: 'calentando', accion: 'luz ON', d: 'M250 250 C330 250 330 146 398 146', etiqueta: { x: 300, y: 216 } },
    { de: 'calentando', evento: 'fin', a: 'idle', accion: 'pitido, luz OFF', d: 'M400 86 H252', etiqueta: { x: 326, y: 80 } },
    { de: 'calentando', evento: 'cancelar', a: 'idle', accion: 'tiempo ← 0, luz OFF', d: 'M400 112 H252', etiqueta: { x: 326, y: 106 } },
    { de: 'calentando', evento: 'abrir', a: 'puerta', d: 'M480 158 V234', etiqueta: { x: 486, y: 200 } },
    { de: 'puerta', evento: 'cerrar', a: 'calentando', d: 'M580 236 V160', etiqueta: { x: 586, y: 200 } },
  ],
};
