// Números de los widgets: leer lo que escribe el usuario (coma o punto decimal)
// y mostrar resultados en formato español.
import { describe, expect, test } from 'vitest';
import { fmt, leerNumero } from '../src/widgets/numeros';

describe('leerNumero', () => {
  test('acepta coma decimal', () => {
    expect(leerNumero('0,02')).toBe(0.02);
  });
  test('acepta punto decimal', () => {
    expect(leerNumero('0.02')).toBe(0.02);
    // un punto solo es decimal, como en MATLAB y C (4.615 ms, no 4615)
    expect(leerNumero('4.615')).toBe(4.615);
  });
  test('punto de miles con coma decimal, y espacios alrededor', () => {
    expect(leerNumero('1.234,5')).toBe(1234.5);
    expect(leerNumero(' 1.234,5 ')).toBe(1234.5);
  });
  test('lo que no es un número da NaN', () => {
    expect(Number.isNaN(leerNumero('abc'))).toBe(true);
    expect(Number.isNaN(leerNumero(''))).toBe(true);
    expect(Number.isNaN(leerNumero('12abc'))).toBe(true);
    expect(Number.isNaN(leerNumero('1,2,3'))).toBe(true);
  });
});

describe('fmt', () => {
  test('redondea a los decimales pedidos con coma', () => {
    expect(fmt(0.018385, 4)).toBe('0,0184');
    expect(fmt(4.615, 3)).toBe('4,615');
  });
  test('sin ceros de sobra y con 4 decimales por defecto', () => {
    expect(fmt(0.5)).toBe('0,5');
    expect(fmt(10)).toBe('10');
    expect(fmt(1 / 3)).toBe('0,3333');
  });
});

describe('conMates', async () => {
  const { conMates } = await import('../src/widgets/mates');
  test('escapa el HTML del texto', () => {
    expect(conMates('a < b & c')).toBe('a &lt; b &amp; c');
  });
  test('convierte $…$ en KaTeX y deja el resto como texto', () => {
    const html = conMates('Con $A = 5$ Erlang');
    expect(html.startsWith('Con ')).toBe(true);
    expect(html).toContain('class="katex"');
    expect(html.endsWith(' Erlang')).toBe(true);
  });
  test('una fórmula mal escrita no rompe: se muestra como texto', () => {
    expect(conMates('$\\frac{1$')).toContain('\\frac{1');
  });
});
