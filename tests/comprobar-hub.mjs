// Comprobador del hub de apuntes: se ejecuta antes de publicar.
// Uso: node tests/comprobar-hub.mjs [carpeta]   (por defecto, la carpeta del hub)
// Imprime una línea OK/FALLO por comprobación y sale con código 1 si algo falla.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const raiz = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

function ok(texto) { console.log('OK: ' + texto); }
function fallo(texto) { console.log('FALLO: ' + texto); process.exitCode = 1; }
function leer(ruta) { return readFileSync(join(raiz, ruta), 'utf8'); }

// Lista exacta de lo que se publicaría: lo que git sigue o añadiría (sin lo ignorado)
let archivos;
try {
  archivos = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: raiz, encoding: 'utf8' })
    .split('\0').filter(Boolean)
    .filter((ruta) => existsSync(join(raiz, ruta))); // sin los borrados aún no confirmados
} catch {
  fallo('no se pueden listar los archivos con git (¿es un repositorio?)');
  process.exit(1);
}

// 1) subjects.json válido
let asignaturas = null;
try {
  const datos = JSON.parse(leer('subjects.json'));
  if (!Array.isArray(datos) || datos.length === 0) throw new Error('debe ser una lista no vacía');
  const vistos = new Set();
  datos.forEach((a, i) => {
    const quien = `elemento ${i}${a && a.slug ? ' (' + a.slug + ')' : ''}`;
    for (const campo of ['slug', 'nombre', 'descripcion']) {
      if (typeof a?.[campo] !== 'string' || !a[campo].trim()) throw new Error(`${quien}: falta "${campo}"`);
    }
    if (a.estado !== 'activa' && a.estado !== 'pendiente') throw new Error(`${quien}: "estado" debe ser "activa" o "pendiente"`);
    // "nota" (lo que está en preparación) es opcional, pero si está debe tener texto
    if ('nota' in a && (typeof a.nota !== 'string' || !a.nota.trim())) throw new Error(`${quien}: "nota" debe ser un texto no vacío`);
    if (!/^[a-z0-9-]+$/.test(a.slug)) throw new Error(`${quien}: el slug solo admite minúsculas, cifras y guiones`);
    if (vistos.has(a.slug)) throw new Error(`${quien}: slug repetido`);
    vistos.add(a.slug);
  });
  asignaturas = datos;
  ok(`subjects.json válido (${datos.length} asignaturas)`);
} catch (e) {
  fallo('subjects.json: ' + (e instanceof SyntaxError ? 'no es un JSON válido (' + e.message + ')' : e.message));
}

// 2) cada asignatura activa tiene su carpeta con index.html
if (!asignaturas) {
  fallo('no se pueden comprobar las carpetas: subjects.json no es válido');
} else {
  const faltan = asignaturas.filter((a) => a.estado === 'activa' && !existsSync(join(raiz, a.slug, 'index.html')));
  if (faltan.length) fallo('falta index.html en: ' + faltan.map((a) => a.slug + '/').join(', '));
  else ok('todas las asignaturas activas tienen su index.html');
}

// 3) la portada tiene la lista, el aviso y la etiqueta viewport
if (!existsSync(join(raiz, 'index.html'))) {
  fallo('falta index.html (la portada)');
} else {
  const portada = leer('index.html');
  const necesarios = ['id="asignaturas"', 'id="aviso"', '<meta name="viewport"'];
  const ausentes = necesarios.filter((t) => !portada.includes(t));
  if (ausentes.length) fallo('a index.html le falta: ' + ausentes.join(', '));
  else ok('index.html tiene la lista, el aviso y la etiqueta viewport');
}

// 4) sin recursos externos (src/href/url() a http o https)
const externo = /(?:\b(?:src|href)\s*=\s*["']?\s*|url\(\s*["']?\s*)https?:\/\//i;
const conExternos = archivos.filter((ruta) =>
  /\.(html|css|js|json|svg)$/i.test(ruta) && ruta !== 'README.md' && !ruta.startsWith('tests/') &&
  externo.test(leer(ruta)));
if (conExternos.length) fallo('enlaces o recursos externos en: ' + conExternos.join(', '));
else ok('ningún archivo publicado carga recursos externos');

// 5) nada privado en las rutas publicadas
const prohibidos = new Set(['docs', 'grupo', '.claude', 'graphify-out']);
const rutasMalas = archivos.filter((ruta) => {
  const partes = ruta.toLowerCase().split('/');
  const nombre = partes[partes.length - 1];
  return partes.some((p, i) => prohibidos.has(p) || /practica|trabajo|trello/.test(p) || (p === 'tests' && i > 0)) ||
    /\.(pdf|docx?|pptx?|xlsx?|zip|rar|7z)$/.test(nombre) || nombre.startsWith('.env');
});
if (rutasMalas.length) fallo('rutas que no deben publicarse: ' + rutasMalas.join(', '));
else ok(`ninguna ruta privada entre los ${archivos.length} archivos que se publicarían`);

// 6) README.md presente y con texto
if (existsSync(join(raiz, 'README.md')) && leer('README.md').trim()) ok('README.md existe y tiene texto');
else fallo('falta README.md o está vacío');
