// Física de los dibujos de Radiación: funciones puras con las fórmulas públicas de las
// transparencias (implementación propia en TypeScript, no el código de MATLAB).
// Unidades del SI salvo que el nombre diga otra cosa (_dB, _km, _MHz, _GHz, _pct…).

export const C0 = 3e8;        // velocidad de la luz (m/s)
export const RT = 6371e3;     // radio de la Tierra (m)
export const T0 = 290;        // temperatura de referencia (K)
export const KB = 1.38e-23;   // constante de Boltzmann (J/K)

const log10 = Math.log10;
const dB = (x: number) => 10 * log10(x);
const lineal = (x_dB: number) => 10 ** (x_dB / 10);

// ---------- Tema 1: propagación ----------

/** Pérdidas en espacio libre: Lbf = 20·log10(4πd/λ) (dB). */
export function lbf(d_m: number, f_Hz: number): number {
  return 20 * log10((4 * Math.PI * d_m * f_Hz) / C0);
}

/** Friis: Prx = PIRE − Lb + Gr − Lr (dBm). */
export function prx(pire_dBm: number, lb_dB: number, gr_dB: number, lr_dB: number): number {
  return pire_dBm - lb_dB + gr_dB - lr_dB;
}

/** Flecha de la Tierra ficticia: b = d1·d2/(2·K·RT) (m). Con K = ∞ (Tierra plana), 0. */
export function flecha(d1_m: number, d2_m: number, K: number): number {
  return (d1_m * d2_m) / (2 * K * RT);
}

/** Horizonte radioeléctrico de una antena a h metros: √(2·K·RT·h) (m). */
export function horizonte(h_m: number, K: number): number {
  return Math.sqrt(2 * K * RT * h_m);
}

/** K superado el 99,9 % del tiempo en un vano de d km: 157/(144 + 2670/d). */
export function k999(d_km: number): number {
  return 157 / (144 + 2670 / d_km);
}

/** Radio del primer elipsoide de Fresnel: R1 = √(λ·d1·d2/d) (m). */
export function radioFresnel(d1_m: number, d2_m: number, f_Hz: number): number {
  return Math.sqrt(((C0 / f_Hz) * d1_m * d2_m) / (d1_m + d2_m));
}

/** Parámetro del filo de cuchillo: ν = √2·c/R1. */
export function nu(c_m: number, r1_m: number): number {
  return (Math.SQRT2 * c_m) / r1_m;
}

/** Pérdida por difracción en filo de cuchillo J(ν) (dB); 0 si ν ≤ −0,78 (no hay difracción). */
export function jNu(v: number): number {
  if (v <= -0.78) return 0;
  return 6.9 + 20 * log10(Math.sqrt((v - 0.1) ** 2 + 1) + v - 0.1);
}

/** Ángulo rasante mínimo para que haya reflexión: φmin = (5400/f)^(1/3) (mrad, f en MHz). */
export function phiMin_mrad(f_MHz: number): number {
  return Math.cbrt(5400 / f_MHz);
}

/**
 * Dos rayos: Lad = −20·log10|1 + Re·e^(−j2πΔl/λ)| (dB). Re es real (su signo da la fase, 0 o π).
 * El módulo de la suma se limita a 0,01, así que en un nulo la pérdida máxima es 40 dB.
 */
export function ladDosRayos(re: number, dl_m: number, f_Hz: number): number {
  const fase = (2 * Math.PI * dl_m * f_Hz) / C0;
  const modulo = Math.hypot(1 + re * Math.cos(fase), re * Math.sin(fase));
  return -20 * log10(Math.max(modulo, 0.01));
}

// ---------- Tema 2: antenas ----------

/** Ganancia desapuntada θ grados: G(θ) = Gmax − 12·(θ/θ3dB)² (dBi). */
export function gDesapuntado(gmax_dB: number, theta3_deg: number, theta_deg: number): number {
  return gmax_dB - 12 * (theta_deg / theta3_deg) ** 2;
}

// ---------- Tema 3: lluvia y disponibilidad ----------

/** Coeficientes C1, C2, C3 del Fq terrenal (dependen de f en GHz). */
function coefLluvia(f_GHz: number) {
  const c0 = f_GHz >= 10 ? 0.12 + 0.4 * log10((f_GHz / 10) ** 0.8) : 0.12;
  return {
    c1: 0.07 ** c0 * 0.12 ** (1 - c0),
    c2: 0.855 * c0 + 0.546 * (1 - c0),
    c3: 0.139 * c0 + 0.043 * (1 - c0),
  };
}

/** Atenuación por lluvia superada el q % del tiempo (terrenal): Fq = F0,01·C1·q^−(C2 + C3·log q) (dB). */
export function fq(f001_dB: number, q_pct: number, f_GHz: number): number {
  const { c1, c2, c3 } = coefLluvia(f_GHz);
  return f001_dB * c1 * q_pct ** -(c2 + c3 * log10(q_pct));
}

/**
 * Indisponibilidad por lluvia: el q (%) con Fq = FM. Se resuelve C3·x² + C2·x + log(FM/(F0,01·C1)) = 0
 * con x = log q y se toma la raíz mayor. Sin raíz real (FM demasiado grande para el modelo): NaN.
 */
export function qDeFM(fm_dB: number, f001_dB: number, f_GHz: number): number {
  const { c1, c2, c3 } = coefLluvia(f_GHz);
  const disc = c2 * c2 - 4 * c3 * log10(fm_dB / (f001_dB * c1));
  if (disc < 0) return NaN;
  return 10 ** ((-c2 + Math.sqrt(disc)) / (2 * c3));
}

/** XPD por lluvia (terrenal, 8 < f ≤ 35 GHz): XPD = U − V·log Fq (dB). */
export function xpdLluvia(f_GHz: number, fq_dB: number): number {
  const u = 15 + 30 * log10(f_GHz);
  const v = f_GHz <= 20 ? 12.8 * f_GHz ** 0.19 : 22.6;
  return u - v * log10(fq_dB);
}

/** Indisponibilidad por equipos en serie: Σ MTTR·100/(MTBF + MTTR) (%). */
export function uEquipos(mtbf_h: number[], mttr_h: number): number {
  return mtbf_h.reduce((s, m) => s + (mttr_h * 100) / (m + mttr_h), 0);
}

// ---------- Tema 4: ruido ----------

/** Temperatura equivalente de un pasivo de L dB a T0: T = T0·(l − 1) (K). */
export function tPasiva(l_dB: number): number {
  return T0 * (lineal(l_dB) - 1);
}

/** Friis de ruido: T = T1 + T2/g1 + T3/(g1·g2) + …, referida a la entrada de la primera etapa (K). */
export function tCadena(T_K: number[], G_dB: number[]): number {
  let total = 0;
  let g = 1;
  T_K.forEach((t, i) => {
    total += t / g;
    g *= lineal(G_dB[i]);
  });
  return total;
}

/** Umbral por ruido: TH = 10·log(k·T·Rb) + 30 + Eb/N0 + degradación (dBm). */
export function umbral_dBm(T_K: number, rb_bps: number, ebn0_dB: number, degr_dB: number): number {
  return dB(KB * T_K * rb_bps) + 30 + ebn0_dB + degr_dB;
}
