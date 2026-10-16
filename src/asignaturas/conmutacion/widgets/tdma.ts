// Tiempos de la interfaz aérea GSM y qué canal va en cada trama de una
// multitrama (combinación I para la de 26 y combinación IV, bajada, para la de 51).

/** La multitrama de 26 dura 120 ms exactos; de ahí sale todo lo demás. */
export const MULTI26_MS = 120;
export const TRAMA_MS = MULTI26_MS / 26; // ≈ 4,615 ms
export const RANURA_US = (TRAMA_MS / 8) * 1000; // ≈ 576,9 µs
export const MULTI51_MS = 51 * TRAMA_MS; // ≈ 235,4 ms

/** Canal de la trama n (0…25 o 0…50) de una multitrama de 26 o de 51. */
export function canalEnTrama(trama: number, tipo: 26 | 51): string {
  if (tipo === 26) return trama === 12 ? 'SACCH' : trama === 25 ? 'libre' : 'TCH';
  if (trama === 50) return 'libre';
  const enGrupo = trama % 10; // grupos de 10 tramas: F, S y 8 de datos
  if (enGrupo === 0) return 'FCCH';
  if (enGrupo === 1) return 'SCH';
  return trama >= 2 && trama <= 5 ? 'BCCH' : 'CCCH';
}

/** Qué hace cada canal, para el texto que acompaña al visor. */
export const QUE_ES: Record<string, string> = {
  TCH: 'Canal de tráfico: la voz o los datos de la llamada.',
  SACCH: 'Control asociado lento: medidas, avance temporal y potencia, cada 480 ms.',
  FCCH: 'Corrección de frecuencia: una ráfaga de ceros para que el móvil se enganche a la portadora.',
  SCH: 'Sincronización: el número de trama y el BSIC de la célula.',
  BCCH: 'Difusión: los datos de la célula (vecinas, LAI, parámetros de acceso).',
  CCCH: 'Control común: avisos (PCH) y asignaciones (AGCH) en bajada.',
  libre: 'Trama sin uso: el móvil la aprovecha para medir las células vecinas.',
};

/** Campos de las dos ráfagas que hay que saber dibujar (bits; la guarda en tiempos de bit). */
export type Campo = { nombre: string; bits: number; tipo: 'cola' | 'datos' | 'bandera' | 'entrenamiento' | 'guarda'; texto: string };
export const RAFAGAS: Record<'normal' | 'acceso', { nombre: string; campos: Campo[]; resumen: string }> = {
  normal: {
    nombre: 'Ráfaga normal',
    campos: [
      { nombre: 'T', bits: 3, tipo: 'cola', texto: 'Bits de cola: 3 ceros al principio de la ráfaga.' },
      { nombre: 'Datos', bits: 57, tipo: 'datos', texto: 'Primer bloque de 57 bits de datos.' },
      { nombre: 'S', bits: 1, tipo: 'bandera', texto: 'Bandera de robo (stealing flag): dice si el bloque lleva tráfico o señalización. Así se detecta un FACCH.' },
      { nombre: 'Entrenamiento', bits: 26, tipo: 'entrenamiento', texto: 'Secuencia de entrenamiento de 26 bits, en el centro: el receptor la usa para estimar el canal.' },
      { nombre: 'S', bits: 1, tipo: 'bandera', texto: 'Bandera de robo del segundo bloque.' },
      { nombre: 'Datos', bits: 57, tipo: 'datos', texto: 'Segundo bloque de 57 bits: 114 bits de información por ráfaga entre los dos.' },
      { nombre: 'T', bits: 3, tipo: 'cola', texto: 'Bits de cola finales.' },
      { nombre: 'Guarda', bits: 8.25, tipo: 'guarda', texto: 'Periodo de guarda: 8,25 tiempos de bit sin transmitir, para que dos ráfagas seguidas no se pisen.' },
    ],
    resumen: '148 bits + 8,25 de guarda = 156,25 tiempos de bit = 0,577 ms (cada bit dura 3,69 µs).',
  },
  acceso: {
    nombre: 'Ráfaga de acceso aleatorio',
    campos: [
      { nombre: 'T', bits: 8, tipo: 'cola', texto: 'Bits de cola iniciales (8).' },
      { nombre: 'Sincronización', bits: 41, tipo: 'entrenamiento', texto: 'Secuencia de sincronización de 41 bits.' },
      { nombre: 'Datos', bits: 36, tipo: 'datos', texto: '36 bits de datos: la petición de canal dedicado.' },
      { nombre: 'T', bits: 3, tipo: 'cola', texto: 'Bits de cola finales (3).' },
      { nombre: 'Guarda', bits: 68.25, tipo: 'guarda', texto: 'Guarda larga: el móvil aún no tiene avance temporal y su ráfaga puede llegar tarde. 68,25 bits son unos 252 µs, y de ahí el radio máximo de unos 37,8 km.' },
    ],
    resumen: '88 bits + 68,25 de guarda = 156,25 tiempos de bit: cabe en una ranura aunque llegue con retraso.',
  },
};
