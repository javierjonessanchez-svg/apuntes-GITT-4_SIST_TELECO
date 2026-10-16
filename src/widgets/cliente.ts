// Arranque de los widgets en el navegador. Si la función de arranque falla,
// el widget se queda en su versión estática (la de la ranura «estatico»),
// que es la que se ve sin JavaScript.

/** Llama a iniciar() en cada elemento del selector y marca su widget como listo. */
export function montar(selector: string, iniciar: (el: HTMLElement) => void): void {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    try {
      iniciar(el);
      el.closest<HTMLElement>('.widget')?.setAttribute('data-listo', '');
    } catch (error) {
      console.error('Widget sin arrancar:', selector, error);
    }
  }
}
