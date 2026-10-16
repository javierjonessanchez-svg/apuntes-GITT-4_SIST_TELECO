// "Lo que tienes que saber": guarda cada casilla, dibuja el anillo y gestiona
// los niveles del tema (1 leído al abrir, 2 repasado con todo marcado, 3 dominado).
import progreso from '../progreso';

const caja = document.querySelector<HTMLElement>('[data-lista-saber]');

if (caja) {
  const asig = caja.dataset.asig!;
  const tema = caja.dataset.tema!;
  const casillas = [...caja.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  const boton = caja.querySelector<HTMLButtonElement>('[data-dominar]')!;
  const cuenta = caja.querySelector<HTMLElement>('[data-cuenta]')!;
  const anillo = caja.querySelector<SVGCircleElement>('[data-anillo]')!;
  const nota = caja.querySelector<HTMLElement>('[data-nota]')!;
  const CIRCUNFERENCIA = 2 * Math.PI * 18;

  // Abrir el tema ya cuenta como leído
  progreso.marcar(asig, tema, 1);
  if (!progreso.disponible) nota.hidden = false;

  const guardadas = progreso.checklist(asig, tema, casillas.length);
  casillas.forEach((c, i) => {
    c.checked = guardadas[i];
    c.addEventListener('change', () => {
      progreso.marcarSaber(asig, tema, i, c.checked);
      pintar();
    });
  });

  boton.addEventListener('click', () => {
    if (progreso.nivel(asig, tema) === 3) progreso.marcar(asig, tema, todasMarcadas() ? 2 : 1, true);
    else progreso.marcar(asig, tema, 3);
    pintar();
  });

  function todasMarcadas(): boolean {
    return casillas.every((c) => c.checked);
  }

  function pintar(): void {
    const hechas = casillas.filter((c) => c.checked).length;
    if (todasMarcadas()) progreso.marcar(asig, tema, 2);
    const nivel = progreso.nivel(asig, tema);
    cuenta.textContent = `${hechas} de ${casillas.length}`;
    anillo.style.strokeDasharray = String(CIRCUNFERENCIA);
    anillo.style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - hechas / Math.max(casillas.length, 1)));
    caja!.dataset.nivel = String(nivel);
    boton.disabled = nivel < 3 && !todasMarcadas();
    boton.textContent = nivel === 3 ? 'Dominado · desmarcar' : 'Marcar como dominado';
    boton.setAttribute('aria-pressed', String(nivel === 3));
  }

  pintar();
}
