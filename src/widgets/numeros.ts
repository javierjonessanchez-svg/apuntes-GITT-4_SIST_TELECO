// Números en los widgets. Se escriben y se muestran en formato español
// (0,0184), pero también se acepta el punto decimal (0.0184), como en MATLAB.

/** Muestra n con hasta `dec` decimales, coma decimal y sin ceros de sobra. */
export function fmt(n: number, dec = 4): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: dec }).format(n);
}

/**
 * Lee lo que escribe el usuario: '0,02', '0.02' y '1.234,5' valen.
 * Con coma, los puntos son de miles; sin coma, el punto es decimal.
 * Devuelve NaN si no es un número (así el widget puede avisar).
 */
export function leerNumero(texto: string): number {
  let t = texto.trim();
  if (t === '') return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  // Number() (no parseFloat) para que '12abc' o '1,2,3' den NaN
  return Number(t);
}

export type Validado = { valor: number } | { error: string };

/** Lee un campo y dice qué está mal en vez de devolver NaN. */
export function validar(
  texto: string,
  etiqueta: string,
  { entero = false, positivo = false, min, max }: { entero?: boolean; positivo?: boolean; min?: number; max?: number } = {},
): Validado {
  const valor = leerNumero(texto);
  if (Number.isNaN(valor)) return { error: `Escribe un número en «${etiqueta}».` };
  if (entero && !Number.isInteger(valor)) return { error: `«${etiqueta}» tiene que ser un número entero.` };
  if (positivo && valor <= 0) return { error: `«${etiqueta}» tiene que ser mayor que 0.` };
  if ((min !== undefined && valor < min) || (max !== undefined && valor > max)) {
    return { error: `«${etiqueta}» tiene que estar entre ${fmt(min ?? -Infinity)} y ${fmt(max ?? Infinity)}.` };
  }
  return { valor };
}
