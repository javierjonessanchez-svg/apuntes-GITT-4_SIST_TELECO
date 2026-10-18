// Arranque en el navegador de los widgets de Ópticas que se redibujan enteros:
// se leen los controles, se llama a la función de dibujo y se cambian el SVG y la frase.
import { montar } from '../../../widgets/cliente';
import type { Dibujo } from './dibujo';

/** Opción elegida en el grupo de botones «nombre» (componente Opciones). */
export function opcion(caja: HTMLElement, nombre: string): string {
  return caja.querySelector<HTMLElement>(`[data-opciones="${nombre}"]`)!.dataset.valor ?? '';
}

/** Valor numérico de un deslizador o campo por su id. */
export function numero(caja: HTMLElement, id: string): number {
  return Number(caja.querySelector<HTMLInputElement>(`#${id}`)!.value);
}

/** ¿Está marcada la casilla con ese id? */
export function marcada(caja: HTMLElement, id: string): boolean {
  return caja.querySelector<HTMLInputElement>(`#${id}`)!.checked;
}

/**
 * Monta el widget data-op-widget="nombre": redibuja con cada cambio. Al cambiar de opción
 * (botones o casillas) el dibujo nuevo entra con un fundido; al arrastrar un deslizador, no.
 */
export function montarDibujo(nombre: string, dibujar: (caja: HTMLElement, uid: string) => Dibujo): void {
  montar(`[data-op-widget="${nombre}"]`, (caja) => {
    const svg = caja.querySelector('svg')!;
    const info = caja.querySelector<HTMLElement>('[data-info]')!;
    const uid = caja.dataset.uid ?? nombre;
    const pintar = (fundido: boolean) => {
      const d = dibujar(caja, uid);
      svg.innerHTML = fundido ? `<g class="op-w-entra">${d.svg}</g>` : d.svg;
      info.innerHTML = d.info;
    };
    caja.addEventListener('input', () => pintar(false));
    caja.addEventListener('change', (e) => pintar((e.target as HTMLInputElement).type !== 'range'));
    caja.querySelector<HTMLElement>('[data-controles]')?.removeAttribute('hidden');
    pintar(false);
  });
}
