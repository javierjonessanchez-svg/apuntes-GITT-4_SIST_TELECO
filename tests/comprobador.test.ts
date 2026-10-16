// El comprobador del hub (tests/comprobar-hub.mjs) sobre sitios de prueba diminutos.
// «bueno» es un árbol completo que pasa todo; cada «malo-*» solo trae los archivos
// que lo estropean, y se copia encima de «bueno» en una carpeta temporal.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const COMPROBADOR = join(import.meta.dirname, 'comprobar-hub.mjs');
const temporales: string[] = [];

function comprobar(fixture: string): { codigo: number | null; salida: string } {
  const raiz = mkdtempSync(join(tmpdir(), 'comprobador-'));
  temporales.push(raiz);
  cpSync(join(FIXTURES, 'bueno'), raiz, { recursive: true });
  if (fixture !== 'bueno') cpSync(join(FIXTURES, fixture), raiz, { recursive: true });
  const r = spawnSync(process.execPath, [COMPROBADOR, join(raiz, 'salida')], { encoding: 'utf8' });
  return { codigo: r.status, salida: r.stdout + r.stderr };
}

const fallos = (salida: string) => salida.split(/\r?\n/).filter((l) => l.startsWith('FALLO:'));

afterAll(() => { for (const t of temporales) rmSync(t, { recursive: true, force: true }); });

describe('comprobar-hub.mjs', () => {
  test('bueno: todo OK y sale con 0', () => {
    const { codigo, salida } = comprobar('bueno');
    expect(fallos(salida)).toEqual([]);
    expect(salida).toMatch(/^OK: 7\)/m); // también ha aplicado las reglas de contraste
    expect(codigo).toBe(0);
  });

  test('malo-externo: falla la 4 por el <link> y el @import, no por el <a href>', () => {
    const { codigo, salida } = comprobar('malo-externo');
    expect(codigo).toBe(1);
    const f = fallos(salida);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatch(/^FALLO: 4\)/);
    expect(f[0]).toContain('prueba/fuentes.html');
    expect(f[0]).toContain('externo.css');
    expect(f[0]).not.toContain('prueba/index.html');
  });

  test('malo-privado: falla la 5 por una ruta del PC', () => {
    const { codigo, salida } = comprobar('malo-privado');
    expect(codigo).toBe(1);
    const f = fallos(salida);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatch(/^FALLO: 5\).*prueba\/notas\.html/);
  });

  test('malo-lab: falla la 8 por material de prácticas', () => {
    const { codigo, salida } = comprobar('malo-lab');
    expect(codigo).toBe(1);
    const f = fallos(salida);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatch(/^FALLO: 8\).*prueba\/practica\.html/);
  });
});
