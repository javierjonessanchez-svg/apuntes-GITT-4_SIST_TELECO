// La capa solo local (contenido/*/privado/) no debe poder llegar a la web pública.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('.gitignore excluye contenido/*/privado/', () => {
  expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\/contenido\/\*\/privado\/\s*$/m);
});

test('Git no sigue ningún archivo de contenido/*/privado/', () => {
  const seguidos = execSync('git ls-files contenido', { encoding: 'utf8' })
    .split(/\r?\n/).filter((f) => /^contenido\/[^/]+\/privado\//.test(f));
  expect(seguidos).toEqual([]);
});

test('el cargador de temas excluye la capa privada en GitHub Actions', () => {
  const cfg = readFileSync('src/content.config.ts', 'utf8');
  expect(cfg).toContain("process.env.GITHUB_ACTIONS === 'true'");
  expect(cfg).toContain("sinPrivado ? ['*/temas/*.mdx']");
});
