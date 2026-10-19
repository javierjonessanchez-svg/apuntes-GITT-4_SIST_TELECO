// Mazo de tarjetas de repaso. Las preguntas salen de la sección de preguntas
// de cada tema («Autoevaluación» en Conmutación, «Preguntas de examen» en Ópticas, «Preguntas de repaso» en Radiación) (bloques <details>) y de su lista «saber»; las notas (0 no la sé,
// 1 más o menos, 2 la sé) se guardan con progreso.guardarTarjeta.

export type Pregunta = { pregunta: string; respuesta: string };

/** Pares pregunta/respuesta de los <details> de las secciones «## <nombre>» indicadas. */
export function extraerPreguntas(cuerpo: string, secciones = ['Autoevaluación', 'Preguntas de examen', 'Preguntas de repaso']): Pregunta[] {
  return secciones.flatMap((nombre) => {
    const titulo = new RegExp(`^## ${nombre}\\s*$`, 'm');
    const inicio = cuerpo.search(titulo);
    if (inicio < 0) return [];
    const resto = cuerpo.slice(inicio).replace(titulo, '');
    const fin = resto.search(/^## /m);
    const seccion = fin < 0 ? resto : resto.slice(0, fin);
    return [...seccion.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
      .map((m) => ({ pregunta: m[1].trim(), respuesta: m[2].trim() }));
  });
}

/** Markdown de la respuesta → texto para conMates: sin negritas ni código, subíndices como fórmula. */
export function textoTarjeta(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/<sub>(.*?)<\/sub>/g, '$$_{$1}$$')
    .replace(/<sup>(.*?)<\/sup>/g, '$$^{$1}$$')
    .replace(/<[^>]+>/g, '')
    .replace(/\s*\n\s*/g, ' ');
}

/** Orden de repaso: primero las nunca vistas, luego de peor a mejor nota. Los empates conservan su orden. */
export function ordenarMazo<T extends { pregunta: string }>(mazo: T[], notas: Record<string, 0 | 1 | 2>): T[] {
  const peso = (t: T) => notas[t.pregunta] ?? -1;
  return [...mazo].sort((x, y) => peso(x) - peso(y));
}
