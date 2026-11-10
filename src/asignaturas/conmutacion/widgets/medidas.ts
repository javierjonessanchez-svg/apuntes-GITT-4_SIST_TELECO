// Barras de calidad con umbral: cada una compara una probabilidad con su límite.
// La marca negra es el límite (en el centro de la barra); si se pasa, la barra se pone roja.
import { fmt } from '../../../widgets/numeros';

export type Medida = { nombre: string; valor: number; limite: number };

export function pintarMedidas(el: HTMLElement, medidas: Medida[]): void {
  el.replaceChildren(...medidas.map((m) => {
    const ok = m.valor < m.limite;
    const fila = document.createElement('div');
    fila.className = 'u-medida';
    const pct = (x: number) => (x < 1e-4 ? '< 0,01 %' : `${fmt(x * 100, x < 0.001 ? 4 : 2)} %`);
    fila.innerHTML = `<span>${m.nombre}</span>`
      + `<span class="u-barra" role="img" aria-label="${m.nombre}: ${pct(m.valor)}, límite ${pct(m.limite)}">`
      + `<i class="${ok ? '' : 'mal'}" style="--w:${Math.min(1, m.valor / (2 * m.limite))}"></i><u></u></span>`
      + `<output class="${ok ? 'u-ok' : 'u-ko'}">${ok ? '✓' : '✗'} ${pct(m.valor)}</output>`;
    fila.querySelector<HTMLElement>('u')!.style.left = 'calc(50% - 1.5px)';
    return fila;
  }));
}
