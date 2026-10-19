// Modo examen: guarda las marcas «a mano» / «en MATLAB», pinta el resumen,
// filtra por prueba (PEI1 / PEI2) y copia las llamadas de ejemplo.
// resumen() es pura y se prueba con Vitest; el resto solo corre en el navegador.
import progreso, { type MarcaExamen } from '../progreso';

/** Cuántas de las fórmulas `ids` están marcadas a mano y en MATLAB. */
export function resumen(marcas: Record<string, MarcaExamen>, ids: string[]): { mano: number; matlab: number; total: number } {
  return {
    mano: ids.filter((id) => marcas[id]?.mano === true).length,
    matlab: ids.filter((id) => marcas[id]?.matlab === true).length,
    total: ids.length,
  };
}

const raiz = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('[data-modo-examen]');

if (raiz) {
  const asig = raiz.dataset.asig!;
  const casillas = [...raiz.querySelectorAll<HTMLInputElement>('input[data-campo]')];
  const filas = [...raiz.querySelectorAll<HTMLElement>('[data-formula]')];
  const temas = [...raiz.querySelectorAll<HTMLElement>('[data-grupo-tema]')];
  const flujos = [...raiz.querySelectorAll<HTMLElement>('[data-flujo]')];
  const filtros = [...raiz.querySelectorAll<HTMLButtonElement>('[data-filtro]')];
  const cuentaMano = raiz.querySelector<HTMLElement>('[data-cuenta="mano"]')!;
  const cuentaMatlab = raiz.querySelector<HTMLElement>('[data-cuenta="matlab"]')!;
  const totales = [...raiz.querySelectorAll<HTMLElement>('[data-total]')];

  if (!progreso.disponible) raiz.querySelector<HTMLElement>('[data-nota]')!.hidden = false;

  // Las marcas se leen del DOM: si el navegador no deja guardar, siguen valiendo en esta visita
  function marcasActuales(): Record<string, MarcaExamen> {
    const m: Record<string, MarcaExamen> = {};
    for (const c of casillas) {
      const id = c.dataset.id!;
      m[id] ??= { mano: false, matlab: false };
      m[id][c.dataset.campo as keyof MarcaExamen] = c.checked;
    }
    return m;
  }

  function pintar(): void {
    const visibles = filas.filter((f) => !f.hidden).map((f) => f.dataset.formula!);
    const r = resumen(marcasActuales(), visibles);
    cuentaMano.textContent = String(r.mano);
    cuentaMatlab.textContent = String(r.matlab);
    for (const t of totales) t.textContent = String(r.total);
  }

  const guardadas = progreso.examen(asig);
  for (const c of casillas) {
    const campo = c.dataset.campo as keyof MarcaExamen;
    c.checked = guardadas[c.dataset.id!]?.[campo] === true;
    c.addEventListener('change', () => {
      progreso.marcarExamen(asig, c.dataset.id!, campo, c.checked);
      pintar();
    });
  }

  // Filtro por prueba: "" = todas
  function filtrar(prueba: string): void {
    for (const b of filtros) b.setAttribute('aria-pressed', String(b.dataset.filtro === prueba));
    for (const f of filas) f.hidden = prueba !== '' && f.dataset.prueba !== prueba;
    for (const t of temas) t.hidden = !t.querySelector('[data-formula]:not([hidden])');
    for (const fl of flujos) fl.hidden = prueba !== '' && !fl.dataset.pruebas!.split(' ').includes(prueba);
    pintar();
  }
  for (const b of filtros) b.addEventListener('click', () => filtrar(b.dataset.filtro!));

  // Copiar una llamada; si el portapapeles no está disponible, se selecciona el texto
  for (const b of raiz.querySelectorAll<HTMLButtonElement>('[data-copiar]')) {
    const codigo = b.previousElementSibling as HTMLElement;
    let reloj: number | undefined;
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codigo.textContent ?? '');
        b.textContent = 'Copiada';
        clearTimeout(reloj);
        reloj = window.setTimeout(() => { b.textContent = 'Copiar'; }, 1500);
      } catch {
        getSelection()?.selectAllChildren(codigo);
      }
    });
  }

  pintar();
}
