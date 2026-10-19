import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { ARISTAS, BANDAS, NODOS, conexionesDeTema, validarMapa, vecinos } from '../src/asignaturas/comunicaciones-opticas/mapa';

// Los temas que existen de verdad: los .mdx de la carpeta de Ópticas
const TEMAS = readdirSync('contenido/comunicaciones-opticas/temas')
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

describe('mapa de conceptos de Ópticas', () => {
  it('los datos cuadran: ids únicos, temas reales, sin aristas repetidas ni nodos sueltos', () => {
    expect(validarMapa(TEMAS)).toEqual([]);
  });

  it('el validador detecta un tema que no existe', () => {
    expect(validarMapa(TEMAS.filter((t) => t !== 'led')).some((e) => e.includes('led'))).toBe(true);
  });

  it('cada nodo está en una banda conocida', () => {
    const bandas = new Set(BANDAS.map((b) => b.id));
    for (const n of NODOS) expect(bandas.has(n.banda)).toBe(true);
  });

  it('cada tema tiene entre 2 y 4 conexiones con otros temas, sin repetirse a sí mismo', () => {
    for (const t of TEMAS) {
      const cx = conexionesDeTema(t);
      expect(cx.length, t).toBeGreaterThanOrEqual(2);
      expect(cx.length, t).toBeLessThanOrEqual(4);
      expect(cx.every((c) => c.tema !== t && TEMAS.includes(c.tema))).toBe(true);
      expect(new Set(cx.map((c) => c.tema)).size).toBe(cx.length);
    }
  });

  it('el LED conecta con WDM porque es demasiado ancho', () => {
    const wdm = conexionesDeTema('led').find((c) => c.tema === 'wdm');
    expect(wdm?.porque).toMatch(/ancho/);
  });

  it('la dispersión conecta con los efectos no lineales por la mezcla de cuatro ondas', () => {
    const fwm = conexionesDeTema('dispersion').find((c) => c.tema === 'efectos-no-lineales');
    expect(fwm?.porque).toMatch(/cuatro ondas/);
  });

  it('vecinos devuelve las dos direcciones de las aristas', () => {
    const v = vecinos('dwdm').map((x) => x.otro.id);
    expect(v).toContain('dfb');
    expect(v).toContain('edfa');
    expect(v.length).toBe(ARISTAS.filter((a) => a.de === 'dwdm' || a.a === 'dwdm').length);
  });

  it('un tema que no existe no tiene conexiones', () => {
    expect(conexionesDeTema('no-existe')).toEqual([]);
  });
});
