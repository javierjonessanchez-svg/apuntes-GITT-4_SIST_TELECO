// Botón claro/oscuro: cambia data-tema en <html> y guarda la elección.
// Sin elección guardada, la web sigue al sistema (prefers-color-scheme).
import progreso from '../progreso';

const html = document.documentElement;
const boton = document.querySelector<HTMLButtonElement>('[data-boton-tema]');

function oscuroAhora(): boolean {
  const t = html.dataset.tema;
  return t ? t === 'oscuro' : matchMedia('(prefers-color-scheme: dark)').matches;
}

if (boton) {
  const pintar = () => boton.setAttribute('aria-pressed', String(oscuroAhora()));
  boton.hidden = false;
  pintar();
  boton.addEventListener('click', () => {
    const nuevo = oscuroAhora() ? 'claro' : 'oscuro';
    html.dataset.tema = nuevo;
    progreso.guardarTema(nuevo);
    pintar();
  });
  // Si cambia el sistema y no hay elección guardada, el botón lo refleja
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pintar);
}
