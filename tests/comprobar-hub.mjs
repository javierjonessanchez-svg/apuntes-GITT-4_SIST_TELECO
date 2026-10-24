// Comprobador del sitio construido: se ejecuta en «npm.cmd run check», antes de publicar.
// Uso: node tests/comprobar-hub.mjs <carpeta>   (normalmente dist; la carpeta de
// encima es la raíz del repositorio, con contenido/, src/ y README.md)
// Imprime una línea OK/FALLO por comprobación y sale con código 1 si algo falla.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { leerTokens, reglasContraste } from './lib/contraste.ts';

if (!process.argv[2]) {
  console.log('Uso: node tests/comprobar-hub.mjs <carpeta construida, p. ej. dist>');
  process.exit(1);
}
const sitio = resolve(process.argv[2]);
const raiz = dirname(sitio);

function ok(n, texto) { console.log(`OK: ${n}) ${texto}`); }
function fallo(n, texto) { console.log(`FALLO: ${n}) ${texto}`); process.exitCode = 1; }

if (!existsSync(sitio)) {
  fallo(0, `no existe ${process.argv[2]}: construye antes el sitio (npm.cmd run build)`);
  process.exit(1);
}

// Archivos de texto del sitio construido (las fuentes y el índice de Pagefind son binarios)
const TEXTO = /\.(html|css|js|mjs|json|svg|xml|txt|webmanifest)$/i;
function listar(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? listar(join(carpeta, d.name)) : [join(carpeta, d.name)]);
}
const todos = listar(sitio).map((f) => relative(sitio, f).replaceAll('\\', '/'));
const textos = todos.filter((f) => TEXTO.test(f)).map((f) => ({ ruta: f, texto: readFileSync(join(sitio, f), 'utf8') }));

// 1) y 2) asignaturas: solo salen de contenido/*/asignatura.md, y las activas tienen sus páginas
const campo = (md, nombre) => md.match(new RegExp(`^${nombre}:\\s*["']?([^"'\\r\\n]*?)["']?\\s*$`, 'm'))?.[1] ?? '';
const dirContenido = join(raiz, 'contenido');
const fichas = existsSync(dirContenido)
  ? readdirSync(dirContenido, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(dirContenido, d.name, 'asignatura.md')))
    .map((d) => ({ carpeta: d.name, md: readFileSync(join(dirContenido, d.name, 'asignatura.md'), 'utf8') }))
  : [];
if (!fichas.length) {
  fallo(1, 'no hay ninguna contenido/*/asignatura.md');
} else {
  const problemas = [];
  for (const { carpeta, md } of fichas) {
    const [nombre, slug, estado] = ['nombre', 'slug', 'estado'].map((c) => campo(md, c));
    if (!nombre || !slug || !estado) problemas.push(`${carpeta}: faltan nombre, slug o estado`);
    else if (estado !== 'activa' && estado !== 'pendiente') problemas.push(`${carpeta}: estado «${estado}» (debe ser activa o pendiente)`);
    else if (estado === 'activa' && !existsSync(join(sitio, slug, 'index.html'))) problemas.push(`${slug}: activa pero sin ${slug}/index.html`);
  }
  if (problemas.length) fallo(1, 'asignaturas: ' + problemas.join('; '));
  else ok(1, `${fichas.length} asignaturas bien descritas, y las activas tienen sus páginas`);
}

// 3) la portada tiene la lista, el aviso y la etiqueta viewport
const portada = textos.find((t) => t.ruta === 'index.html');
if (!portada) {
  fallo(3, 'falta index.html (la portada)');
} else {
  const ausentes = ['id="asignaturas"', 'id="aviso"', '<meta name="viewport"'].filter((t) => !portada.texto.includes(t));
  if (ausentes.length) fallo(3, 'a la portada le falta: ' + ausentes.join(', '));
  else ok(3, 'la portada tiene la lista, el aviso y la etiqueta viewport');
}

// 4) nada se carga de fuera: src, <link href>, url() y @import a http(s).
//    Los enlaces normales (<a href="https://…">) sí valen: son los de «Lo real».
const CARGAS = [
  /\bsrc(?:set)?\s*=\s*["']?\s*(?:https?:)?\/\//i,
  /<link\b[^>]*\bhref\s*=\s*["']?\s*(?:https?:)?\/\//i,
  /url\(\s*["']?\s*(?:https?:)?\/\//i,
  /@import\s+(?:url\(\s*)?["']?\s*(?:https?:)?\/\//i,
];
const conCargas = textos.filter((t) => CARGAS.some((re) => re.test(t.texto))).map((t) => t.ruta);
if (conCargas.length) fallo(4, 'recursos cargados de fuera en: ' + conCargas.join(', '));
else ok(4, `ninguno de los ${textos.length} archivos de texto carga recursos de fuera`);

// Busca patrones en las rutas y en el texto de lo publicado
function buscar(patrones) {
  const malos = [];
  for (const ruta of todos) {
    const t = textos.find((x) => x.ruta === ruta)?.texto ?? '';
    const vistos = patrones.filter((p) => p.test(ruta) || p.test(t)).map((p) => p.source.replaceAll('\\', ''));
    if (vistos.length) malos.push(`${ruta} (${vistos.join(', ')})`);
  }
  return malos;
}

// 5) nada privado: rutas del PC ni nombres de herramientas o envíos
const privados = buscar([/C:\\/, /Users[\\/]javie/i, /\.claude\b/i, /TRELLO/i, /envios\//i]);
if (privados.length) fallo(5, 'rutas o nombres privados en: ' + privados.join('; '));
else ok(5, 'ninguna ruta ni nombre privado en lo publicado');

// 6) README.md presente y con texto
const readme = join(raiz, 'README.md');
if (existsSync(readme) && readFileSync(readme, 'utf8').trim()) ok(6, 'README.md existe y tiene texto');
else fallo(6, 'falta README.md o está vacío');

// 7) contraste WCAG de cada mundo, en claro y en oscuro (las reglas de tests/lib/contraste.ts)
const dirMundos = join(raiz, 'src', 'asignaturas');
const hojas = existsSync(dirMundos)
  ? readdirSync(dirMundos, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(dirMundos, d.name, 'tema.css'))).map((d) => d.name)
  : [];
if (!hojas.length) {
  fallo(7, 'no hay ninguna src/asignaturas/*/tema.css');
} else {
  const problemas = [];
  for (const mundo of hojas) {
    const t = leerTokens(readFileSync(join(dirMundos, mundo, 'tema.css'), 'utf8'));
    if (JSON.stringify(t.oscuroMedia) !== JSON.stringify(t.oscuro)) problemas.push(`${mundo}: el oscuro del @media no es copia del [data-tema="oscuro"]`);
    for (const modo of ['claro', 'oscuro']) {
      for (const r of reglasContraste(t[modo]).filter((x) => !x.pasa)) problemas.push(`${mundo} (${modo}) ${r.par}: ${r.valor.toFixed(2)} < ${r.minimo}`);
    }
  }
  if (problemas.length) fallo(7, 'contraste: ' + problemas.join('; '));
  else ok(7, `contraste WCAG correcto en ${hojas.length} mundos, en claro y en oscuro`);
}

// 8) regla de las prácticas: nada de material de grupo, del profesor ni de las memorias
const lab = buscar([/grupo\//i, /plantilla_profesor/i, /MEMORIA_/, /proyecto-final/i, /\bP[123]\//]);
if (lab.length) fallo(8, 'material de prácticas en: ' + lab.join('; '));
else ok(8, 'nada de material de prácticas en lo publicado');

// 9) modo examen: cada asignatura con examen.yaml tiene su página, los «ver código» solo
//    apuntan a funciones/ o plantillas/ de un repo de GitHub, y cada casilla tiene su etiqueta.
//    La hoja de repaso (data-hoja-examen) no enlaza código, así que no se le exigen «ver código».
const conExamen = fichas.filter(({ carpeta }) => existsSync(join(dirContenido, carpeta, 'examen.yaml'))).map(({ md }) => campo(md, 'slug'));
if (!conExamen.length) {
  ok(9, 'ninguna asignatura tiene modo examen (nada que comprobar)');
} else {
  const problemas = [];
  for (const slug of conExamen) {
    const pagina = textos.find((t) => t.ruta === `${slug}/examen/index.html`);
    if (!pagina) { problemas.push(`${slug}: tiene examen.yaml pero falta ${slug}/examen/index.html`); continue; }
    const enlaces = [...pagina.texto.matchAll(/<a\b[^>]*class="ver-codigo"[^>]*>/g)].map((m) => m[0].match(/href="([^"]*)"/)?.[1] ?? '');
    const hoja = pagina.texto.includes('data-hoja-examen');
    if (!enlaces.length && !hoja) problemas.push(`${slug}: la página no tiene ningún «ver código»`);
    for (const href of enlaces) {
      if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/main\/(funciones|plantillas)\//.test(href) || href.includes('..')) problemas.push(`${slug}: enlace «${href}»`);
    }
    for (const m of pagina.texto.matchAll(/<input\b[^>]*type="checkbox"[^>]*>/g)) {
      if (!/<label\b[^>]*>$/.test(pagina.texto.slice(0, m.index))) problemas.push(`${slug}: casilla sin etiqueta: ${m[0]}`);
    }
  }
  if (problemas.length) fallo(9, 'modo examen: ' + problemas.join('; '));
  else ok(9, `modo examen correcto en ${conExamen.length} asignatura(s)`);
}

// 10) la portada enlaza el modo examen desde la tarjeta de cada asignatura que lo tiene
//     (aunque esté pendiente), y solo desde esas
if (portada) {
  const problemas = [];
  for (const { md } of fichas) {
    const slug = campo(md, 'slug');
    const tarjeta = portada.texto.match(new RegExp(`<li\\b[^>]*data-tarjeta="${slug}"[\\s\\S]*?</li>`))?.[0] ?? '';
    const enlaza = new RegExp(`href="[^"]*/${slug}/examen/"`).test(tarjeta);
    if (conExamen.includes(slug) && !enlaza) problemas.push(`${slug}: tiene modo examen pero su tarjeta no lo enlaza`);
    if (!conExamen.includes(slug) && enlaza) problemas.push(`${slug}: su tarjeta enlaza un modo examen que no existe`);
  }
  if (problemas.length) fallo(10, 'portada: ' + problemas.join('; '));
  else ok(10, 'las tarjetas enlazan el modo examen solo donde existe');
}
