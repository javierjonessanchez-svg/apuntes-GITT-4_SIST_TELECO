// Registro de mundos: cada asignatura con mundo propio aporta las mismas piezas
// (Portada, Avance, Decoracion) y su tema.css. El esqueleto las pinta igual
// para todas; una asignatura sin mundo usa mundoBase (el aspecto del esqueleto).
//
// Cada tema.css va limitado a html[data-asignatura="<slug>"], así que se pueden
// importar todos aquí sin que se pisen.
import '@fontsource-variable/bricolage-grotesque';
import './portada/tema.css';
import '@fontsource-variable/archivo/wdth.css';
import './conmutacion/tema.css';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import './comunicaciones-opticas/tema.css';
import '@fontsource-variable/jetbrains-mono';
import './seda/tema.css';
import PortadaBase from './base/Portada.astro';
import AvanceBase from './base/Avance.astro';
import DecoracionBase from './base/Decoracion.astro';
import PortadaConmutacion from './conmutacion/Portada.astro';
import AvanceConmutacion from './conmutacion/Avance.astro';
import DecoracionConmutacion from './conmutacion/Decoracion.astro';
import PortadaOpticas from './comunicaciones-opticas/Portada.astro';
import AvanceOpticas from './comunicaciones-opticas/Avance.astro';
import DecoracionOpticas from './comunicaciones-opticas/Decoracion.astro';
import PortadaSeda from './seda/Portada.astro';
import AvanceSeda from './seda/Avance.astro';
import DecoracionSeda from './seda/Decoracion.astro';

// Un componente de Astro (se llama con sus props al pintarlo)
type Componente = (props: any) => any;

export type Mundo = {
  Portada: Componente;    // props: { asignatura: Asignatura, temas: Tema[] }
  Avance: Componente;     // props: { asignatura: string, tema: string }
  Decoracion: Componente; // sin props; aria-hidden, detrás del contenido
};

export const mundoBase: Mundo = { Portada: PortadaBase, Avance: AvanceBase, Decoracion: DecoracionBase };

export const mundos: Record<string, Mundo> = {
  conmutacion: { Portada: PortadaConmutacion, Avance: AvanceConmutacion, Decoracion: DecoracionConmutacion },
  'comunicaciones-opticas': { Portada: PortadaOpticas, Avance: AvanceOpticas, Decoracion: DecoracionOpticas },
  seda: { Portada: PortadaSeda, Avance: AvanceSeda, Decoracion: DecoracionSeda },
};

export function mundoDe(slug: string): Mundo {
  return mundos[slug] ?? mundoBase;
}
