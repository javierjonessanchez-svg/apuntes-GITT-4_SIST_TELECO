// Registro de mundos: cada asignatura con mundo propio aporta las mismas piezas
// (Portada, Avance, Decoracion) y su tema.css. El esqueleto las pinta igual
// para todas; una asignatura sin mundo usa mundoBase (el aspecto del esqueleto).
//
// Cada tema.css va limitado a html[data-asignatura="<slug>"], así que se pueden
// importar todos aquí sin que se pisen.
import PortadaBase from './base/Portada.astro';
import AvanceBase from './base/Avance.astro';
import DecoracionBase from './base/Decoracion.astro';

// Un componente de Astro (se llama con sus props al pintarlo)
type Componente = (props: any) => any;

export type Mundo = {
  Portada: Componente;    // props: { asignatura: Asignatura, temas: Tema[] }
  Avance: Componente;     // props: { asignatura: string, tema: string }
  Decoracion: Componente; // sin props; aria-hidden, detrás del contenido
};

export const mundoBase: Mundo = { Portada: PortadaBase, Avance: AvanceBase, Decoracion: DecoracionBase };

export const mundos: Record<string, Mundo> = {};

export function mundoDe(slug: string): Mundo {
  return mundos[slug] ?? mundoBase;
}
