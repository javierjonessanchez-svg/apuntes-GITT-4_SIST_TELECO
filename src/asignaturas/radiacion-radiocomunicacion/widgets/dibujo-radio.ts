// Ayudas de dibujo de los widgets de Radiación: las primitivas de Ópticas (se importan,
// no se copian) con los colores del mundo de Radiación (--ra-*, en tema.css).
// Los dibujos de Radiación solo importan de aquí.
export { t, l, r, c, p, flecha, cota, onda, type Dibujo } from '../../comunicaciones-opticas/widgets/dibujo';

// Colores de los dibujos (se definen en tema.css, con su versión oscura)
export const COL = {
  texto: 'var(--texto)', suave: 'var(--suave)', linea: 'var(--linea)', fondo: 'var(--fondo)', superficie: 'var(--superficie)',
  primario: 'var(--primario)', naranja: 'var(--ra-naranja)', azul: 'var(--ra-azul)', verde: 'var(--ra-verde)',
  rojo: 'var(--ra-rojo)', violeta: 'var(--ra-violeta)',
} as const;
