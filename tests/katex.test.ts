// El HTML lo genera la copia de KaTeX que usa rehype-katex y el CSS sale del
// paquete `katex` de primer nivel: si sus versiones difieren, las clases no
// casan (p. ej. `.base` vs `.katex-base`) y las fórmulas en línea se parten.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
// Carpeta del paquete: sube desde su entrada hasta dar con su package.json
// (algunos paquetes no exportan `package.json` y `resolve` lo rechazaría).
const raiz = (desde: NodeRequire, paquete: string) => {
  let dir = dirname(desde.resolve(paquete));
  while (!existsSync(`${dir}/package.json`) || JSON.parse(readFileSync(`${dir}/package.json`, 'utf8')).name !== paquete) {
    dir = dirname(dir);
  }
  return dir;
};
const version = (dir: string) => JSON.parse(readFileSync(`${dir}/package.json`, 'utf8')).version;

describe('KaTeX', () => {
  const rehype = createRequire(require.resolve('rehype-katex'));
  const dirHtml = raiz(rehype, 'katex');
  const dirCss = raiz(require, 'katex');

  test('el CSS y el HTML vienen de la misma versión de KaTeX', () => {
    expect(version(dirCss)).toBe(version(dirHtml));
  });

  test('el CSS tiene la regla que impide partir una fórmula en línea', () => {
    const css = readFileSync(`${dirCss}/dist/katex.min.css`, 'utf8');
    expect(css).toMatch(/\.katex \.base\{[^}]*white-space:nowrap/);
  });
});
