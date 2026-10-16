// Escalera de tiempos de GSM: de la ráfaga a la hipertrama (el antiguo visor).
import { MULTI26_MS, MULTI51_MS, RANURA_US, TRAMA_MS } from './tdma';

export type Nivel = { nombre: string; ms: number; tramas: string; calculo: string; texto: string };

export const NIVELES: Nivel[] = [
  { nombre: 'Ráfaga (ranura)', ms: RANURA_US / 1000, tramas: '1/8', calculo: '120 / 26 / 8', texto: 'Un octavo de trama. En cada ranura se transmite una ráfaga.' },
  { nombre: 'Trama TDMA', ms: TRAMA_MS, tramas: '1', calculo: '120 / 26', texto: '8 ranuras numeradas de 0 a 7. Es lo que se repite continuamente en cada portadora.' },
  { nombre: 'Multitrama de 26 tramas', ms: MULTI26_MS, tramas: '26', calculo: '26 tramas = 120 ms', texto: 'La unidad básica de tiempo de GSM. Es la estructura de las combinaciones de tráfico.' },
  { nombre: 'Multitrama de 51 tramas', ms: MULTI51_MS, tramas: '51', calculo: '51 × 120 / 26 = 235,38 ms', texto: 'La estructura de las combinaciones de señalización (algunas se repiten cada 102 tramas).' },
  { nombre: 'Supertrama', ms: 51 * MULTI26_MS, tramas: '1326', calculo: '51 × 120 ms = 6,12 s', texto: 'Agrupa 51 multitramas de 26 tramas, o 26 multitramas de 51: 1326 tramas en los dos casos.' },
  { nombre: 'Hipertrama', ms: 2048 * 51 * MULTI26_MS, tramas: '2.715.648', calculo: '6,12 s × 2048 = 12.533,76 s', texto: 'Agrupa 2048 supertramas. Cada trama se identifica por su número de orden en la hipertrama. Dura casi 3 horas y media.' },
];
