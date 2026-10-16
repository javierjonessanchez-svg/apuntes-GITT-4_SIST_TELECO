// Rutas internas: la web vive bajo /apuntes-GITT-4_SIST_TELECO/ (en local y en
// GitHub Pages), así que todo enlace interno se construye con ruta().
const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

/** ruta('conmutacion', 'capa-enlace') → '/apuntes-GITT-4_SIST_TELECO/conmutacion/capa-enlace/' */
export function ruta(...partes: string[]): string {
  return partes.length ? base + partes.join('/') + '/' : base;
}
