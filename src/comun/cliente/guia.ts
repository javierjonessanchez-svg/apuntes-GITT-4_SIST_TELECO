// Guía «¿qué tipo de problema es?»: recorre el árbol de decisión paso a paso y filtra
// la tabla «me dan → me piden → función» y el índice de funciones mientras se escribe.
// normalizar() y coincide() son puras y se prueban con Vitest; el resto solo corre en el navegador.

/** Minúsculas y sin acentos, para que «umbral» encuentre «Umbral» y «ángulo» encuentre «angulo». */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Cada palabra de la consulta tiene que aparecer en el texto (ya normalizado). Una consulta vacía lo encuentra todo. */
export function coincide(consulta: string, texto: string): boolean {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  return palabras.every((p) => texto.includes(p));
}

const raiz = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('[data-guia]');

if (raiz) {
  const nodos = [...raiz.querySelectorAll<HTMLElement>('[data-nodo]')];
  const porId = new Map(nodos.map((n) => [n.dataset.nodo!, n]));
  const inicio = raiz.dataset.inicio!;
  const ruta = raiz.querySelector<HTMLElement>('[data-ruta]')!;
  const atras = raiz.querySelector<HTMLButtonElement>('[data-atras]')!;
  const reiniciar = raiz.querySelector<HTMLButtonElement>('[data-reiniciar]')!;
  // Camino recorrido: el nodo en el que estás y lo que elegiste para llegar a cada uno
  let camino: { id: string; eleccion?: string }[] = [{ id: inicio }];

  function mostrar(foco: boolean): void {
    const actual = camino[camino.length - 1].id;
    for (const n of nodos) n.hidden = n.dataset.nodo !== actual;
    ruta.replaceChildren(...camino.slice(1).map((c) => {
      const li = document.createElement('li');
      li.textContent = c.eleccion ?? '';
      return li;
    }));
    ruta.hidden = camino.length < 2;
    atras.disabled = camino.length < 2;
    reiniciar.disabled = camino.length < 2;
    if (foco) porId.get(actual)!.querySelector<HTMLElement>('.gp-titulo')?.focus();
  }

  // Sin JavaScript se ven todos los nodos y los enlaces saltan entre ellos
  raiz.dataset.activo = '';
  for (const a of raiz.querySelectorAll<HTMLAnchorElement>('[data-ir]')) {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      camino = [...camino, { id: a.dataset.ir!, eleccion: a.textContent?.trim() }];
      mostrar(true);
    });
  }
  atras.addEventListener('click', () => { camino = camino.slice(0, -1); mostrar(true); });
  reiniciar.addEventListener('click', () => { camino = [{ id: inicio }]; mostrar(true); });
  mostrar(false);

  // Búsqueda: tabla e índice se filtran con la misma consulta
  const caja = document.querySelector<HTMLInputElement>('[data-buscar]');
  if (caja) {
    const filas = [...document.querySelectorAll<HTMLElement>('[data-busca]')];
    const grupos = [...document.querySelectorAll<HTMLElement>('[data-grupo]')];
    const vacio = document.querySelector<HTMLElement>('[data-vacio]')!;
    const cuenta = document.querySelector<HTMLElement>('[data-cuenta-busqueda]')!;
    const filtrar = (): void => {
      let visibles = 0;
      for (const f of filas) {
        f.hidden = !coincide(caja.value, f.dataset.busca!);
        if (!f.hidden) visibles++;
      }
      for (const g of grupos) g.hidden = !g.querySelector('[data-busca]:not([hidden])');
      vacio.hidden = visibles > 0;
      cuenta.textContent = caja.value.trim() ? `${visibles} resultado${visibles === 1 ? '' : 's'}` : '';
    };
    caja.addEventListener('input', filtrar);
  }
}
