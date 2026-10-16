// Reúso de frecuencias: tamaño de racimo N = i² + ij + j², distancia de reúso
// D = R·√(3N) y relación portadora/interferencia con 6 interferentes cocanal.
// Las celdas van en coordenadas axiales (q, r) de una rejilla hexagonal.

/** Los (i, j) con i ≥ j ≥ 0 e i² + ij + j² = N, o null si N no es un tamaño de racimo. */
export function ijDe(N: number): [number, number] | null {
  for (let i = 0; i * i <= N; i++) {
    for (let j = 0; j <= i; j++) if (i * i + i * j + j * j === N) return [i, j];
  }
  return null;
}

export function esTamanoValido(N: number): boolean {
  return Number.isInteger(N) && N > 0 && ijDe(N) !== null;
}

/** Distancia entre centros de celdas cocanal. */
export function distanciaReuso(R: number, N: number): number {
  return R * Math.sqrt(3 * N);
}

/** C/I en dB: (D/R)^γ / interferentes. */
export function ciDb(N: number, gamma = 4, interferentes = 6): number {
  return 10 * Math.log10(Math.sqrt(3 * N) ** gamma / interferentes);
}

/**
 * Etiqueta 1…N de cada celda: dos celdas comparten etiqueta (son cocanal) si se
 * pasa de una a otra con los vectores (i, j) y (−j, i + j) del racimo. Se numeran
 * por orden de aparición, así que la primera celda de la lista lleva la 1.
 */
export function etiquetas(celdas: [number, number][], N: number): number[] {
  const [i, j] = ijDe(N)!;
  // coordenadas en la base del racimo, multiplicadas por N: enteras, y módulo N
  const mod = (x: number) => ((x % N) + N) % N;
  const vistas = new Map<string, number>();
  return celdas.map(([q, r]) => {
    const clave = `${mod((i + j) * q + j * r)},${mod(-j * q + i * r)}`;
    if (!vistas.has(clave)) vistas.set(clave, vistas.size + 1);
    return vistas.get(clave)!;
  });
}
