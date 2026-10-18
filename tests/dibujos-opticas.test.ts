// Dibujos de los widgets de Ópticas: cada estado da el SVG y la frase que le tocan.
import { describe, expect, test } from 'vitest';
import { nombreLuz } from '../src/asignaturas/comunicaciones-opticas/widgets/dibujo';
import {
  dibujarBandas, dibujarCoherencia, dibujarCurvaPI, dibujarDbrDfb, dibujarEspectros, dibujarHaz,
  dibujarModulacion, dibujarPozo, dibujarResonador,
} from '../src/asignaturas/comunicaciones-opticas/widgets/dibujos-emisores';

describe('nombreLuz', () => {
  test('visible, infrarrojo cercano e infrarrojo', () => {
    expect(nombreLuz(470)).toBe('azul');
    expect(nombreLuz(873)).toBe('infrarrojo cercano');
    expect(nombreLuz(1550)).toBe('infrarrojo');
  });
});

describe('dibujos de los emisores', () => {
  test('LED de GaAs: ≈ 0,87 µm en el infrarrojo cercano; con gap indirecto, calor', () => {
    expect(dibujarBandas({ tipo: 'directo', gap: 1.42 }).info).toContain('0,87 µm');
    expect(dibujarBandas({ tipo: 'directo', gap: 1.42 }).info).toContain('infrarrojo cercano');
    const indirecto = dibujarBandas({ tipo: 'indirecto', gap: 1.12 });
    expect(indirecto.svg).toContain('calor, no luz');
    expect(indirecto.svg).not.toContain('fotón');
  });
  test('haz: el LED sin lente acopla ≈ 1 %; el láser, la mayor parte', () => {
    expect(dibujarHaz({ fuente: 'led', lente: false }).info).toContain('1 %');
    expect(dibujarHaz({ fuente: 'laser', lente: true }).info).toContain('mayor parte');
  });
  test('espectros: la frase sigue al emisor más fino que se dibuja', () => {
    expect(dibujarEspectros({ led: true, fp: true, dfb: true }).info).toContain('DWDM');
    expect(dibujarEspectros({ led: true, fp: false, dfb: false }).info).toContain('decenas de canales');
    expect(dibujarEspectros({ led: false, fp: false, dfb: false }).svg).not.toContain('LED ≈ 50 nm');
  });
  test('coherencia: estimulada → coherente; espontánea → incoherente', () => {
    expect(dibujarCoherencia({ modo: 'estimulada' }).info).toContain('100 %');
    expect(dibujarCoherencia({ modo: 'espontanea' }).info).toContain('incoherente');
  });
  test('resonador: espejos peores dan fineza baja; los buenos, alta', () => {
    expect(dibujarResonador({ R: 0.5, alineamiento: 1 }).info).toContain('fineza baja');
    expect(dibujarResonador({ R: 0.99, alineamiento: 1 }).info).toContain('fineza alta');
  });
  test('curva P-I: aviso de degradación por encima de 50 °C y jitter bajo el umbral', () => {
    expect(dibujarCurvaPI({ vista: 'pi', T: 60, bias: 120 }).svg).toContain('50 °C');
    expect(dibujarCurvaPI({ vista: 'pi', T: 25, bias: 120 }).svg).not.toContain('se degrada');
    expect(dibujarCurvaPI({ vista: 'bits', T: 25, bias: 50 }).info).toContain('jitter');
    expect(dibujarCurvaPI({ vista: 'bits', T: 25, bias: 120 }).info).not.toContain('jitter');
  });
  test('pozo: más estrecho, luz más azul', () => {
    expect(dibujarPozo({ ancho: 20 }).info).toContain('infrarrojo');
    expect(dibujarPozo({ ancho: 3 }).info).not.toContain('infrarrojo');
  });
  test('FP con varios modos; DBR y DFB con uno', () => {
    expect(dibujarDbrDfb({ tipo: 'FP' }).svg).toContain('varios modos');
    expect(dibujarDbrDfb({ tipo: 'DFB' }).svg).toContain('un solo modo');
  });
  test('modulación: la directa trae chirp; la externa lo evita', () => {
    expect(dibujarModulacion({ modo: 'directa' }).svg).toContain('chirp');
    expect(dibujarModulacion({ modo: 'externa' }).info).toContain('evita el chirp');
  });
});
