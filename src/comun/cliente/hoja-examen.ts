// Modo examen en formato hoja: guarda la casilla «me sale» de cada tipo de problema
// (en las marcas del modo examen, campo `mano`) y pinta cuántas lleva. Solo en el navegador.
import progreso from '../progreso';
import { resumen } from './examen';

const raiz = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('[data-hoja-examen]');

if (raiz) {
  const asig = raiz.dataset.asig!;
  const casillas = [...raiz.querySelectorAll<HTMLInputElement>('input[data-id]')];
  const cuenta = raiz.querySelector<HTMLElement>('[data-cuenta]')!;
  const ids = casillas.map((c) => c.dataset.id!);

  if (!progreso.disponible) raiz.querySelector<HTMLElement>('[data-nota]')!.hidden = false;

  function pintar(): void {
    const marcas = Object.fromEntries(casillas.map((c) => [c.dataset.id!, { mano: c.checked, matlab: false }]));
    cuenta.textContent = String(resumen(marcas, ids).mano);
  }

  const guardadas = progreso.examen(asig);
  for (const c of casillas) {
    c.checked = guardadas[c.dataset.id!]?.mano === true;
    c.addEventListener('change', () => {
      progreso.marcarExamen(asig, c.dataset.id!, 'mano', c.checked);
      pintar();
    });
  }
  pintar();
}
