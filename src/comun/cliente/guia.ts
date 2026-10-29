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

export interface EtiquetasFila { datos: string[]; busco: string[] }
export interface Acierto { indice: number; faltan: string[] }

/**
 * Filas que sirven para lo que te piden (`pido`), con los datos que te faltan según lo que tienes (`tengo`).
 * Primero las que ya puedes resolver, luego las que casi.
 */
export function buscarFunciones(filas: EtiquetasFila[], tengo: string[], pido: string[]): Acierto[] {
  const mias = new Set(tengo);
  const pedidas = new Set(pido);
  return filas
    .map((f, indice) => ({ indice, f, faltan: f.datos.filter((d) => !mias.has(d)) }))
    .filter(({ f }) => f.busco.some((b) => pedidas.has(b)))
    .sort((a, b) => a.faltan.length - b.faltan.length || a.indice - b.indice)
    .map(({ indice, faltan }) => ({ indice, faltan }));
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

  // Selector: marcas lo que tienes y lo que te piden, y «Buscar» enseña las funciones
  const selector = document.querySelector<HTMLFormElement>('[data-selector-funcion]');
  if (selector) {
    const tr = [...document.querySelectorAll<HTMLElement>('tr[data-datos]')];
    const etiquetas = tr.map((f) => ({ datos: JSON.parse(f.dataset.datos!) as string[], busco: JSON.parse(f.dataset.busco!) as string[] }));
    const resultado = selector.querySelector<HTMLElement>('[data-resultado-selector]')!;
    const marcadas = (grupo: string) => [...selector.querySelectorAll<HTMLInputElement>(`input[name="${grupo}"]:checked`)].map((c) => c.value);
    const nota = (clase: string, texto: string) => {
      const p = document.createElement('p');
      p.className = clase;
      p.textContent = texto;
      return p;
    };
    // Dos pasos: primero lo que te dan, luego lo que te piden (sin JavaScript se ven los dos)
    const pasos = [...selector.querySelectorAll<HTMLElement>('[data-paso]')];
    const resumen = selector.querySelector<HTMLElement>('[data-resumen]')!;
    let paso = 1;
    const irA = (n: number, foco = true): void => {
      paso = n;
      for (const p of pasos) p.hidden = p.dataset.paso !== String(n);
      if (foco) pasos[n - 1].querySelector<HTMLElement>('legend')?.setAttribute('tabindex', '-1');
      if (foco) pasos[n - 1].querySelector<HTMLElement>('legend')?.focus();
    };
    const continuar = (): void => {
      const tengo = marcadas('tengo');
      if (!tengo.length) { resultado.replaceChildren(nota('gp-vacio', 'Marca al menos un dato de los que te dan.')); return; }
      resultado.replaceChildren();
      resumen.textContent = 'Te dan: ' + tengo.join(', ');
      irA(2);
    };
    selector.querySelector('[data-continuar]')!.addEventListener('click', continuar);
    selector.querySelector('[data-volver]')!.addEventListener('click', () => { resultado.replaceChildren(); irA(1); });
    irA(1, false);
    selector.addEventListener('submit', (e) => {
      e.preventDefault();
      if (paso === 1) { continuar(); return; }
      const pido = marcadas('pido');
      if (!pido.length) { resultado.replaceChildren(nota('gp-vacio', 'Marca al menos una cosa en «Me piden».')); return; }
      const aciertos = buscarFunciones(etiquetas, marcadas('tengo'), pido);
      if (!aciertos.length) { resultado.replaceChildren(nota('gp-vacio', 'Ninguna fila encaja con eso. Prueba a quitar alguna marca de «Me piden».')); return; }
      const lista = document.createElement('ul');
      lista.className = 'gp-aciertos';
      for (const { indice, faltan } of aciertos) {
        const fila = tr[indice];
        const li = document.createElement('li');
        li.className = faltan.length ? 'panel gp-acierto gp-casi' : 'panel gp-acierto';
        const estado = nota('gp-etiqueta', faltan.length ? `Casi: te falta ${faltan.join(', ')}` : 'Ya tienes todos los datos');
        const que = nota('gp-que', `${fila.children[0].textContent} → ${fila.children[1].textContent}`);
        li.append(estado, que, fila.children[2].cloneNode(true));
        lista.append(li);
      }
      resultado.replaceChildren(lista);
      resultado.querySelector<HTMLElement>('li')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    selector.addEventListener('reset', () => { resultado.replaceChildren(); irA(1, false); });
  }

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
