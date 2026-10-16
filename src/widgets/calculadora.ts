// Calculadoras en el navegador: cada vez que se escribe en un campo se vuelve a
// calcular. Si un campo está mal, se dice cuál (nunca se enseña «NaN») y se
// vacían el resultado y los pasos.
import { pintarDesarrollo, type Paso } from './desarrollo';
import { conMates } from './mates';
import { validar } from './numeros';

export type Campo = {
  nombre: string;
  etiqueta: string;
  reglas?: Parameters<typeof validar>[2];
  opcional?: boolean; // vacío = no se da (p. ej. la duración en Erlang C)
};

/**
 * Conecta una calculadora. La caja contiene los <input name>, un [data-aviso],
 * un [data-resultado] y el <ol data-desarrollo> de Desarrollo.astro.
 */
export function calculadora(
  caja: HTMLElement,
  campos: Campo[],
  calcular: (valores: Record<string, number | undefined>) => { resultado: string; pasos: Paso[] },
): void {
  const aviso = caja.querySelector<HTMLElement>('[data-aviso]')!;
  const resultado = caja.querySelector<HTMLElement>('[data-resultado]')!;
  const ol = caja.querySelector<HTMLElement>('[data-desarrollo]')!;
  const entrada = (nombre: string) => caja.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;

  const recalcular = () => {
    const valores: Record<string, number | undefined> = {};
    for (const c of campos) entrada(c.nombre).removeAttribute('aria-invalid');
    for (const c of campos) {
      const input = entrada(c.nombre);
      if (c.opcional && input.value.trim() === '') continue;
      const v = validar(input.value, c.etiqueta, c.reglas);
      if ('error' in v) {
        input.setAttribute('aria-invalid', 'true');
        aviso.textContent = v.error;
        aviso.hidden = false;
        resultado.innerHTML = '';
        ol.innerHTML = '';
        return;
      }
      valores[c.nombre] = v.valor;
    }
    aviso.hidden = true;
    const r = calcular(valores);
    resultado.innerHTML = conMates(r.resultado);
    pintarDesarrollo(ol, r.pasos);
  };

  caja.addEventListener('input', recalcular);
  caja.querySelector('form')?.addEventListener('submit', (e) => e.preventDefault());
  recalcular();
}
