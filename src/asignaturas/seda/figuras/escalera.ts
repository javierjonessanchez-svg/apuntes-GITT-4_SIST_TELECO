// Ayudas para dibujar el contador TC como una escalera (un escalón por tic).
// escalera(): de (x0, yb) sube hasta (x1, yt) en «pasos» escalones, primero horizontal y luego vertical.
export function escalera(x0: number, x1: number, yb: number, yt: number, pasos: number, inicio = true): string {
  const dx = (x1 - x0) / pasos;
  const dy = (yb - yt) / pasos;
  let d = inicio ? `M${x0} ${yb}` : '';
  for (let i = 1; i <= pasos; i++) {
    d += ` H${(x0 + dx * i).toFixed(1)} V${(yb - dy * i).toFixed(1)}`;
  }
  return d;
}
// Flecha de cota horizontal entre x0 y x1 a la altura y (dos topes verticales).
export function cota(x0: number, x1: number, y: number): string {
  return `M${x0} ${y} H${x1} M${x0} ${y - 5} V${y + 5} M${x1} ${y - 5} V${y + 5}`;
}
