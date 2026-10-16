// Búsqueda con Pagefind. El índice (dist/pagefind/) solo existe en la versión
// construida; con `npm run dev` se explica en el propio diálogo.
import { ruta } from '../rutas';

type Resultado = {
  url: string;
  excerpt: string; // HTML con <mark> en las palabras encontradas
  meta: { title?: string };
  filters: Record<string, string[]>;
};
type Pagefind = {
  options: (o: { baseUrl: string }) => Promise<void>;
  search: (texto: string) => Promise<{ results: { data: () => Promise<Resultado> }[] } | null>;
};

const boton = document.querySelector<HTMLButtonElement>('[data-boton-buscar]');
const dialogo = document.querySelector<HTMLDialogElement>('[data-buscador]');

if (boton && dialogo) {
  const texto = dialogo.querySelector<HTMLInputElement>('[data-buscador-texto]')!;
  const estado = dialogo.querySelector<HTMLElement>('[data-buscador-estado]')!;
  const lista = dialogo.querySelector<HTMLUListElement>('[data-buscador-resultados]')!;
  const form = dialogo.querySelector<HTMLFormElement>('[data-buscador-form]')!;
  let pagefind: Pagefind | null = null;
  let fallo = false;
  let turno = 0; // descarta respuestas de búsquedas que ya no son la última

  boton.hidden = false;

  async function cargar(): Promise<Pagefind | null> {
    if (pagefind || fallo) return pagefind;
    try {
      const url = ruta() + 'pagefind/pagefind.js';
      pagefind = (await import(/* @vite-ignore */ url)) as Pagefind;
      await pagefind.options({ baseUrl: ruta() });
    } catch {
      fallo = true;
      estado.textContent = 'La búsqueda funciona en la versión construida (npm run build).';
    }
    return pagefind;
  }

  function abrir(): void {
    if (dialogo!.open) return;
    dialogo!.showModal();
    texto.select();
    void cargar();
  }

  async function buscar(): Promise<void> {
    const mio = ++turno;
    const consulta = texto.value.trim();
    if (consulta.length < 2) {
      lista.replaceChildren();
      if (!fallo) estado.textContent = 'Escribe al menos dos letras.';
      return;
    }
    const pf = await cargar();
    if (!pf) return;
    const busqueda = await pf.search(consulta);
    const datos = await Promise.all((busqueda?.results ?? []).slice(0, 8).map((r) => r.data()));
    if (mio !== turno) return;
    estado.textContent = datos.length ? `${datos.length} resultado${datos.length === 1 ? '' : 's'}` : 'Sin resultados.';
    lista.replaceChildren(...datos.map((d) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = d.url;
      const titulo = document.createElement('strong');
      titulo.textContent = d.meta.title ?? d.url;
      const asig = document.createElement('small');
      asig.textContent = d.filters.asignatura?.[0] ?? '';
      const extracto = document.createElement('span');
      extracto.innerHTML = d.excerpt; // Pagefind ya escapa el texto; solo añade <mark>
      a.append(titulo, asig, extracto);
      li.append(a);
      return li;
    }));
  }

  boton.addEventListener('click', abrir);
  texto.addEventListener('input', () => void buscar());
  dialogo.querySelector('[data-buscador-cerrar]')!.addEventListener('click', () => dialogo.close());
  // Intro abre el primer resultado
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const primero = lista.querySelector('a');
    if (primero) location.href = primero.href;
  });
  // Clic fuera del diálogo (en el fondo) lo cierra
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });

  document.addEventListener('keydown', (e) => {
    // Solo con Ctrl/⌘: un atajo de una sola tecla (como «/») lo dispara sin querer
    // quien usa control por voz (WCAG 2.1.4)
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      abrir();
    }
  });
}
