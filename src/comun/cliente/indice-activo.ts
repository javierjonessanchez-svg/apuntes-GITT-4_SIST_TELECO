// Resalta en "En este tema" el apartado que se está leyendo.
const indice = document.querySelector<HTMLElement>('[data-indice]');
const articulo = document.querySelector<HTMLElement>('[data-indice-articulo]');

if (indice && articulo && 'IntersectionObserver' in window) {
  const enlaces = new Map(
    [...indice.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => [decodeURIComponent(a.hash.slice(1)), a]),
  );
  const apartados = [...articulo.querySelectorAll<HTMLElement>('h2[id]')].filter((h) => enlaces.has(h.id));

  const marcar = (id: string) => {
    for (const [clave, a] of enlaces) {
      if (clave === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };

  // El actual es el último apartado cuyo título ya ha pasado por el tercio superior
  const observador = new IntersectionObserver(() => {
    const limite = innerHeight / 3;
    let actual = apartados[0];
    for (const h of apartados) if (h.getBoundingClientRect().top <= limite) actual = h;
    if (actual) marcar(actual.id);
  }, { rootMargin: '0px 0px -66% 0px' });

  apartados.forEach((h) => observador.observe(h));
}
