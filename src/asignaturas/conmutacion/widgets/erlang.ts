// Erlang B (pérdidas), Erlang C (cola) y dimensionado, con los pasos que
// enseñan las calculadoras. N = canales (C en el formulario), A = tráfico en Erlang.
import { fmt } from '../../../widgets/numeros';
import type { Paso } from '../../../widgets/desarrollo';

/** Número en una fórmula KaTeX: coma decimal sin el espacio que KaTeX le pondría. */
const tex = (n: number, dec = 4) => fmt(n, dec).replace(',', '{,}');

/**
 * Erlang B por la recurrencia B(k) = A·B(k−1) / (k + A·B(k−1)), con B(0) = 1.
 * No usa factoriales ni potencias, así que no se desborda con N grandes.
 */
export function erlangB(N: number, A: number): number {
  let b = 1;
  for (let k = 1; k <= N; k++) b = (A * b) / (k + A * b);
  return b;
}

/** Erlang C (probabilidad de esperar). Con A ≥ N la cola no se vacía: toda llamada espera. */
export function erlangC(N: number, A: number): number {
  if (A >= N) return 1;
  const b = erlangB(N, A);
  return (N * b) / (N - A * (1 - b));
}

/** El menor número de canales con bloqueo ≤ objetivo (en tanto por uno). */
export function canalesPara(A: number, pbObjetivo: number): number {
  let b = 1;
  for (let N = 1; N <= 5000; N++) {
    b = (A * b) / (N + A * b);
    if (b <= pbObjetivo) return N;
  }
  return NaN; // más de 5000 canales: fuera de lo que tiene sentido calcular aquí
}

/** Pasos de Erlang B. Con muchos canales enseña los primeros y los últimos. */
export function pasosErlangB(N: number, A: number): Paso[] {
  const pasos: Paso[] = [{
    texto: `Se parte de $B(0) = 1$ y se aplica la recurrencia canal a canal, con $A = ${tex(A)}$ E:`,
    formula: String.raw`B(k) = \frac{A\,B(k-1)}{k + A\,B(k-1)}`,
  }];
  const mostrar = (k: number) => N <= 8 || k <= 3 || k > N - 2;
  let b = 1;
  for (let k = 1; k <= N; k++) {
    const nuevo = (A * b) / (k + A * b);
    if (mostrar(k)) {
      pasos.push({
        texto: `Con $k = ${k}$:`,
        formula: String.raw`B(${k}) = \frac{${tex(A)} \cdot ${tex(b)}}{${k} + ${tex(A)} \cdot ${tex(b)}} = ${tex(nuevo)}`,
      });
    } else if (k === 4) {
      pasos.push({ texto: `… y así hasta $k = ${N - 2}$, siempre con la misma cuenta.` });
    }
    b = nuevo;
  }
  pasos.push({ texto: `Probabilidad de bloqueo con ${N} canales: B = ${fmt(b, 4)} (${fmt(b * 100, 2)} %).` });
  return pasos;
}

/** Pasos de Erlang C: primero Erlang B, luego C y, si se da la duración media (en minutos), la espera media. */
export function pasosErlangC(N: number, A: number, duracion?: number): Paso[] {
  if (A >= N) {
    return [{ texto: `Con $A \\ge N$ (${fmt(A)} E y ${N} canales) llega más tráfico del que se puede atender: la cola crece sin límite y toda llamada espera (C = 1).` }];
  }
  const b = erlangB(N, A);
  const c = erlangC(N, A);
  const pasos: Paso[] = [
    {
      texto: `Primero, Erlang B con los mismos datos: $B(${N};\\,${tex(A)}) = ${tex(b)}$. Después se pasa a Erlang C:`,
      formula: String.raw`C = \frac{N\,B}{N - A\,(1 - B)} = \frac{${N} \cdot ${tex(b)}}{${N} - ${tex(A)} \cdot (1 - ${tex(b)})} = ${tex(c)}`,
    },
    { texto: `Probabilidad de esperar: C = ${fmt(c, 4)} (${fmt(c * 100, 2)} %).` },
  ];
  if (duracion !== undefined) {
    const w = (duracion * c) / (N - A);
    pasos.push({
      texto: `Espera media de todas las llamadas (las que no esperan cuentan como 0): E[W] = ${fmt(w, 3)} min.`,
      formula: String.raw`E[W] = \frac{1}{\mu} \cdot \frac{C}{N - A} = ${tex(duracion, 3)} \cdot \frac{${tex(c)}}{${N} - ${tex(A)}} = ${tex(w, 3)}\ \text{min}`,
    });
  }
  return pasos;
}

/** Pasos del dimensionado: usuarios × tráfico por usuario (mE) → canales para un bloqueo objetivo (%). */
export function pasosDimensionado(usuarios: number, mEPorUsuario: number, objetivoPct: number): Paso[] {
  const A = (usuarios * mEPorUsuario) / 1000;
  const N = canalesPara(A, objetivoPct / 100);
  const pasos: Paso[] = [{
    texto: `Tráfico total: A = ${fmt(usuarios)} usuarios × ${fmt(mEPorUsuario)} mE = ${fmt(A, 3)} E.`,
    formula: String.raw`A = ${fmt(usuarios)} \cdot ${tex(mEPorUsuario / 1000, 4)}\ \text{E} = ${tex(A, 3)}\ \text{E}`,
  }];
  if (Number.isNaN(N)) {
    pasos.push({ texto: 'Harían falta más de 5000 canales: revisa los datos.' });
    return pasos;
  }
  pasos.push({
    texto: `Se prueban N = 1, 2, 3… con Erlang B hasta que el bloqueo baja del ${fmt(objetivoPct)} %. Con ${N - 1} canales aún no basta:`,
    formula: String.raw`B(${N - 1};\,${tex(A, 3)}) = ${tex(erlangB(N - 1, A))} > ${tex(objetivoPct / 100)}`,
  });
  const b = erlangB(N, A);
  pasos.push({ texto: `Hacen falta ${N} canales: con ellos el bloqueo es ${fmt(b * 100, 2)} %.` });
  return pasos;
}
