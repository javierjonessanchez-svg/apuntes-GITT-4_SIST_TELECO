// Dibujos de los widgets de Radiación: cada estado da su SVG y su frase, y los
// extremos de cada control no dejan NaN ni Infinity en el SVG.
import { describe, expect, test } from 'vitest';
import { fmt } from '../src/widgets/numeros';
import { lbf } from '../src/asignaturas/radiacion-radiocomunicacion/widgets/fisica-radio';
import {
  dibujarBullington, dibujarDosRayos, dibujarEscalera, dibujarFactorK, dibujarFresnel, dibujarLobulos, dibujarMecanismos,
} from '../src/asignaturas/radiacion-radiocomunicacion/widgets/dibujos-propagacion';

const limpio = (svg: string) => expect(svg).not.toMatch(/NaN|Infinity|undefined/);

describe('tema 1: balance y atmósfera', () => {
  test('escalera de potencias: PIRE 63 dBm y Lbf de 30 km a 10 GHz', () => {
    const d = dibujarEscalera({ d_km: 30, f_GHz: 10 });
    expect(d.info).toContain('63 dBm');
    expect(d.info).toContain(`${fmt(lbf(30e3, 10e9), 1)} dB`);
    limpio(d.svg);
  });
  test('escalera: extremos de distancia y frecuencia', () => {
    for (const d_km of [1, 100]) for (const f_GHz of [1, 40]) limpio(dibujarEscalera({ d_km, f_GHz }).svg);
  });
  test('mecanismos de propagación: frontera de 30 MHz y onda de espacio', () => {
    const d = dibujarMecanismos();
    expect(d.svg).toContain('30 MHz');
    expect(d.svg).toContain('onda de espacio');
    limpio(d.svg);
  });
  test('factor K: estándar, subrefractiva y Tierra plana', () => {
    expect(dibujarFactorK({ K: 4 / 3 }).info).toContain('estándar');
    expect(dibujarFactorK({ K: 0.8 }).info).toContain('subrefractiva');
    expect(dibujarFactorK({ K: 0.8 }).info).toContain('sin visión directa');
    expect(dibujarFactorK({ K: 4 / 3 }).info).toContain('hay visión directa');
    for (const K of [0.5, 5, Infinity]) limpio(dibujarFactorK({ K }).svg);
  });
});

describe('tema 1: difracción y reflexión', () => {
  test('perfil con elipsoide: despejamiento nulo da J = 6,0 dB', () => {
    const d = dibujarFresnel({ c_m: 0 });
    expect(d.info).toContain('J(ν)');
    expect(d.info).toContain('6,0 dB');
  });
  test('perfil con elipsoide: con c = −40 m no hay difracción; extremos limpios', () => {
    expect(dibujarFresnel({ c_m: -40 }).info).toMatch(/no hay difracción/i);
    for (const c_m of [-40, 30]) limpio(dibujarFresnel({ c_m }).svg);
  });
  test('Bullington: el obstáculo ficticio solo sale con el rayo obstruido', () => {
    expect(dibujarBullington({ caso: 'ficticio' }).svg).toContain('obstáculo ficticio');
    expect(dibujarBullington({ caso: 'despejado' }).svg).not.toContain('obstáculo ficticio');
    for (const caso of ['despejado', 'ficticio'] as const) limpio(dibujarBullington({ caso }).svg);
  });
  test('dos rayos sobre el mar: plano tangente y ángulo rasante', () => {
    const d = dibujarDosRayos();
    expect(d.svg).toContain('plano tangente');
    expect(d.svg).toContain('φ');
    limpio(d.svg);
  });
  test('lóbulos: sin reflexión es una línea plana; con |Re| = 1 los nulos llegan al tope', () => {
    expect(dibujarLobulos({ re: 0 }).info).toContain('línea plana en 0 dB');
    expect(dibujarLobulos({ re: 1 }).info).toContain('40 dB');
    for (const re of [0, 1]) limpio(dibujarLobulos({ re }).svg);
  });
});
