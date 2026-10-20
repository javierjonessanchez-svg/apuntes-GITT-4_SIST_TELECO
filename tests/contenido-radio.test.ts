// Comprobaciones de texto en las páginas de Radiación: cifras y definiciones que un
// alumno podría aprender mal si el texto se contradice.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const tema = (slug: string) => readFileSync(`contenido/radiacion-radiocomunicacion/temas/${slug}.mdx`, 'utf8');

describe('textos de Radiación', () => {
  test('K en atmósfera estándar: 157/(157 − 315/7,35) no se presenta como 4/3', () => {
    const k = 157 / (157 - 315 / 7.35);
    expect(k).toBeCloseTo(1.38, 2);
    expect(tema('atmosfera-factor-k')).not.toMatch(/315\/7\{,\}35\)\s*\\approx\s*4\/3/);
    expect(tema('atmosfera-factor-k')).toContain('1{,}38');
  });

  test('el primer elipsoide de Fresnel son los caminos de hasta media longitud de onda más', () => {
    expect(tema('difraccion')).not.toContain('entre media longitud de onda y una más');
  });

  test('K99,9 se define sobre el peor mes, como en el modo examen', () => {
    const texto = tema('atmosfera-factor-k');
    const menciones = texto.match(/99,9 % del (tiempo|peor mes)/g) ?? [];
    expect(menciones.length).toBeGreaterThan(0);
    expect(menciones.every((m) => m.endsWith('peor mes'))).toBe(true);
  });
});
