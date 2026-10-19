// Pruebas sobre la web ya construida (dist/): enlaces con la base, página de
// tema completa y asignaturas pendientes sin enlace. Ejecutar después de build.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const BASE = '/apuntes-GITT-4_SIST_TELECO/';
const DIST = 'dist';

const paginas = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
  .filter((r) => r.endsWith('.html'))
  .map((r) => ({ ruta: r.replaceAll('\\', '/'), html: readFileSync(join(DIST, r), 'utf8') }));

const pagina = (ruta: string) => {
  const p = paginas.find((x) => x.ruta === ruta);
  if (!p) throw new Error(`no existe dist/${ruta}`);
  return p.html;
};

// Puntos "saber" de un tema, leídos de su front matter
function saberDe(slug: string): string[] {
  // En Windows, con core.autocrlf, los archivos llegan con \r\n
  const mdx = readFileSync(`contenido/conmutacion/temas/${slug}.mdx`, 'utf8').replace(/\r\n/g, '\n');
  const bloque = mdx.split('\nsaber:\n')[1]?.split(/\n[a-z]+:|\n---/)[0] ?? '';
  return bloque.split('\n').filter((l) => /^\s+- /.test(l));
}

// Temas de Conmutación por su campo "orden"
const temas = readdirSync('contenido/conmutacion/temas')
  .map((f) => ({ slug: f.replace('.mdx', ''), orden: Number(/\norden: (\d+)/.exec(readFileSync(`contenido/conmutacion/temas/${f}`, 'utf8'))![1]) }))
  .sort((a, b) => a.orden - b.orden)
  .map((t) => t.slug);

describe('toda la web', () => {
  test('hay páginas construidas', () => {
    expect(paginas.length).toBeGreaterThan(8);
  });
  test('<html lang="es"> en todas las páginas', () => {
    const sin = paginas.filter((p) => !p.html.includes('<html lang="es"')).map((p) => p.ruta);
    expect(sin).toEqual([]);
  });
  test('todo href/src interno empieza por la base', () => {
    const malos: string[] = [];
    for (const p of paginas) {
      for (const m of p.html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
        if (!m[1].startsWith(BASE)) malos.push(`${p.ruta}: ${m[1]}`);
      }
    }
    expect(malos).toEqual([]);
  });
  test('ninguna página tiene caracteres de control', () => {
    const malas = paginas.filter((p) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(p.html)).map((p) => p.ruta);
    expect(malas).toEqual([]);
  });
  test('las asignaturas pendientes no tienen páginas', () => {
    expect(existsSync(join(DIST, 'seda'))).toBe(false);
  });
  test('una pendiente con examen.yaml solo tiene el modo examen (ni portada ni temas)', () => {
    expect(readdirSync(join(DIST, 'radiacion-radiocomunicacion'))).toEqual(['examen']);
  });
});

describe('selector de asignaturas', () => {
  const html = pagina('conmutacion/capa-enlace/index.html');
  test('las pendientes no son enlaces y dicen "En preparación"', () => {
    for (const slug of ['radiacion-radiocomunicacion', 'circuitos-comunicacion', 'seda']) {
      expect(html).not.toMatch(new RegExp(`<a[^>]*data-chip="${slug}"`));
      const chip = new RegExp(`data-chip="${slug}"[^>]*>(.*?)</span>\\s*</span>`, 's').exec(html);
      expect(chip?.[1]).toContain('En preparación');
    }
  });
  test('las activas son enlaces a su portada', () => {
    expect(html).toMatch(new RegExp(`<a[^>]*href="${BASE}conmutacion/"[^>]*data-chip="conmutacion"`));
    expect(html).toMatch(new RegExp(`<a[^>]*href="${BASE}comunicaciones-opticas/"[^>]*data-chip="comunicaciones-opticas"`));
  });
});

describe('páginas de tema', () => {
  test.each(temas)('%s: un chip actual, checklist completa y anterior/siguiente', (slug) => {
    const html = pagina(`conmutacion/${slug}/index.html`);
    const selector = /<nav[^>]*data-selector[^>]*>(.*?)<\/nav>/s.exec(html)?.[1] ?? '';
    expect(selector.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain('Lo que tienes que saber');
    const lista = /data-lista-saber[^>]*>(.*?)<\/aside>/s.exec(html)?.[1] ?? '';
    expect(lista.match(/type="checkbox"/g)).toHaveLength(saberDe(slug).length);
    const i = temas.indexOf(slug);
    expect(html.includes('rel="prev"')).toBe(i > 0);
    expect(html.includes('rel="next"')).toBe(i < temas.length - 1);
  });
});

describe('búsqueda', () => {
  test('Pagefind ha creado su índice', () => {
    expect(existsSync(join(DIST, 'pagefind', 'pagefind.js'))).toBe(true);
  });
  test('el botón Buscar empieza oculto (lo muestra el script) y tiene nombre', () => {
    const html = pagina('conmutacion/capa-enlace/index.html');
    const boton = /<button[^>]*data-boton-buscar[^>]*>(.*?)<\/button>/s.exec(html);
    expect(boton).not.toBeNull();
    expect(boton![0]).toMatch(/\shidden[\s>=]/);
    expect(boton![1]).toContain('Buscar');
  });
  test('el artículo del tema se indexa con su asignatura como filtro', () => {
    const html = pagina('conmutacion/capa-enlace/index.html');
    expect(html).toMatch(/data-pagefind-body/);
    expect(html).toMatch(/data-pagefind-filter="asignatura:Conmutación"/);
  });
});

describe('portada', () => {
  const html = pagina('index.html');
  const tarjetas = [...html.matchAll(/<li[^>]*data-tarjeta="([^"]+)"[^>]*data-estado="([^"]+)"[^>]*>(.*?)<\/li>/gs)];
  test('cinco tarjetas de asignatura', () => {
    expect(tarjetas.map((t) => t[1])).toHaveLength(5);
  });
  test('un enlace por tarjeta activa y ninguno en las pendientes', () => {
    for (const [, slug, estado, dentro] of tarjetas) {
      // El enlace al modo examen va aparte (lo comprueba comprobar-hub.mjs, punto 10)
      const enlaces = dentro.match(/<a\s(?![^>]*class="tarjeta-examen")/g) ?? [];
      expect(enlaces.length, slug).toBe(estado === 'activa' ? 1 : 0);
      if (estado !== 'activa') expect(dentro, slug).toContain('En preparación');
    }
  });
  test('cada prueba de la línea de tiempo tiene una data-fecha válida', () => {
    const linea = /<section[^>]*data-linea-tiempo[^>]*>(.*?)<\/section>/s.exec(html)?.[1] ?? '';
    const items = [...linea.matchAll(/<li[^>]*data-prueba[^>]*>/g)];
    expect(items.length).toBeGreaterThan(0);
    for (const [li] of items) expect(li).toMatch(/data-fecha="\d{4}-\d{2}-\d{2}"/);
  });
  test('lista, aviso, viewport, "Esta semana" y aviso legal del pie', () => {
    expect(html).toContain('id="asignaturas"');
    expect(html).toContain('id="aviso"');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('Esta semana');
    expect(html).toContain('Apuntes no oficiales de estudiantes, no revisados ni avalados por el profesorado. Pueden contener errores.');
  });
});

test('la portada de Conmutación avisa (oculto de entrada) si el avance no se puede guardar', () => {
  expect(pagina('conmutacion/index.html')).toMatch(/<p[^>]*data-aviso-almacen[^>]*hidden[^>]*>Tu avance no se está guardando en este navegador\.<\/p>/);
});

test('el buscador no anuncia atajos de una sola tecla (WCAG 2.1.4): solo Ctrl + K', () => {
  expect(pagina('index.html')).toContain('<kbd>Ctrl</kbd> + <kbd>K</kbd>');
  expect(pagina('index.html')).not.toContain('<kbd>/</kbd>');
  expect(readFileSync('src/comun/cliente/buscador.ts', 'utf8')).not.toMatch(/e\.key === '\/'/);
});
