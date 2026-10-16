// Prueba de humo: la construcción produce una portada en español.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('dist/index.html existe y está en español', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  expect(html).toContain('<html lang="es"');
});
