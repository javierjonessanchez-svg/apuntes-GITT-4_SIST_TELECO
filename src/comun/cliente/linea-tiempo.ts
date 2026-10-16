// Recalcula en el navegador todo lo que depende de la fecha de hoy:
// cada "en N días", la marca "Hoy" de la línea de tiempo y "Esta semana".
// En desarrollo se puede probar otra fecha con ?hoy=AAAA-MM-DD.
import { diasHasta, fraccion, hoyDe, isoDe, mensajeSemana, textoRelativo } from '../fechas';

const hoy = hoyDe(location.search, import.meta.env.DEV);

// 1. Cuentas de días: cada [data-dias] usa la data-fecha de su contenedor
for (const el of document.querySelectorAll<HTMLElement>('[data-dias]')) {
  const caja = el.closest<HTMLElement>('[data-fecha]');
  if (!caja) continue;
  const n = diasHasta(caja.dataset.fecha!, hoy);
  el.textContent = textoRelativo(n);
  caja.classList.toggle('pasada', n < 0);
  if (n < 0 && caja.hasAttribute('data-ocultar-si-pasa')) caja.hidden = true;
}

// 2. Marca "Hoy" y tramo ya pasado de cada línea de tiempo
for (const linea of document.querySelectorAll<HTMLElement>('[data-linea-tiempo]')) {
  const x = fraccion(isoDe(hoy), linea.dataset.inicio!, linea.dataset.fin!);
  const marca = linea.querySelector<HTMLElement>('[data-hoy]');
  const pasado = linea.querySelector<HTMLElement>('[data-pasado]');
  if (marca) {
    marca.hidden = x < 0 || x > 1;
    marca.style.setProperty('--x', String(x));
  }
  pasado?.style.setProperty('--x', String(Math.min(Math.max(x, 0), 1)));
}

// 3. "Esta semana": solo las pruebas de hoy a 7 días, o el mensaje si no hay
for (const panel of document.querySelectorAll<HTMLElement>('[data-esta-semana]')) {
  const items = [...panel.querySelectorAll<HTMLElement>('li[data-fecha]')];
  for (const li of items) {
    const n = diasHasta(li.dataset.fecha!, hoy);
    li.hidden = n < 0 || n > 7;
  }
  const vacia = panel.querySelector<HTMLElement>('[data-semana-vacia]');
  if (vacia) {
    const mensaje = mensajeSemana(items.map((li) => ({ fecha: li.dataset.fecha!, nombre: li.dataset.nombre! })), hoy);
    vacia.hidden = mensaje === null;
    vacia.textContent = mensaje ?? '';
  }
}
