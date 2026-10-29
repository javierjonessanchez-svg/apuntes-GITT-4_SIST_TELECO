// Guía «¿qué tipo de problema es?» de Radiación (clave `guia` de examen.yaml): el árbol no
// tiene huecos, cada función citada está en el índice y la búsqueda ignora acentos y mayúsculas.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';
import { esquemaExamen, validarExamen, type ExamenMatlab } from '../src/comun/examen';
import { buscarFunciones, coincide, normalizar } from '../src/comun/cliente/guia';

const RUTA = 'contenido/radiacion-radiocomunicacion/examen.yaml';
// Copia fresca del examen real para estropearla en cada prueba
const real = (): ExamenMatlab => esquemaExamen.parse(parse(readFileSync(RUTA, 'utf8'))) as ExamenMatlab;

describe('guía de Radiación', () => {
  test('el examen real, con su guía, es válido', () => {
    const e = real();
    expect(e.guia).toBeDefined();
    expect(() => validarExamen(e, RUTA)).not.toThrow();
  });

  test('toda función del índice existe en el repo con la ruta que dice su carpeta', () => {
    for (const i of real().guia!.indice) {
      expect(i.archivo.endsWith(`/${i.funcion}.m`)).toBe(true);
    }
  });

  test('el índice agrupa por los cuatro temas de la PEI1 más comunes y resolutores', () => {
    const temas = [...new Set(real().guia!.indice.map((i) => i.tema))];
    expect(temas).toEqual(['Propagación', 'Antenas', 'Desvanecimientos', 'Ruido e interferencias', 'Comunes', 'Resolutores']);
  });

  test('la tabla cubre los cuatro temas y cada función de las filas está en el índice', () => {
    const g = real().guia!;
    expect(new Set(g.filas.map((f) => f.tema))).toEqual(new Set(['Propagación', 'Antenas', 'Desvanecimientos', 'Ruido e interferencias']));
    const indice = new Set(g.indice.map((i) => i.funcion));
    for (const f of g.filas) for (const fn of f.funciones) expect(indice.has(fn)).toBe(true);
  });

  test('todas las hojas del árbol dan al menos una función', () => {
    for (const n of real().guia!.arbol.nodos) {
      for (const o of n.opciones) if (o.resultado) expect(o.resultado.funciones.length).toBeGreaterThan(0);
    }
  });

  test('el índice no contiene ninguna ruta fuera de funciones/', () => {
    for (const i of real().guia!.indice) expect(i.archivo.startsWith('funciones/')).toBe(true);
  });
});

describe('validación de la guía', () => {
  test('falla si una opción salta a un nodo que no existe', () => {
    const e = real();
    e.guia!.arbol.nodos[0].opciones[0].a = 'no-existe';
    expect(() => validarExamen(e, RUTA)).toThrow(/no-existe/);
  });
  test('falla si una opción no tiene ni destino ni resultado', () => {
    const e = real();
    delete e.guia!.arbol.nodos[0].opciones[0].a;
    expect(() => validarExamen(e, RUTA)).toThrow(/«a» o «resultado»/);
  });
  test('falla si un resultado cita una función que no está en el índice', () => {
    const e = real();
    const hoja = e.guia!.arbol.nodos.flatMap((n) => n.opciones).find((o) => o.resultado)!;
    hoja.resultado!.funciones.push('Calcular_Inventada');
    expect(() => validarExamen(e, RUTA)).toThrow(/Calcular_Inventada/);
  });
  test('falla si una fila de la tabla cita una función que no está en el índice', () => {
    const e = real();
    e.guia!.filas[0].funciones = ['Otra_Inventada'];
    expect(() => validarExamen(e, RUTA)).toThrow(/Otra_Inventada/);
  });
  test('falla si el árbol da una vuelta', () => {
    const e = real();
    const perdidas = e.guia!.arbol.nodos.find((n) => n.id === 'perdidas')!;
    perdidas.opciones[0] = { texto: 'Volver', a: 'que-piden' };
    expect(() => validarExamen(e, RUTA)).toThrow(/vuelta/);
  });
  test('falla si un nodo no se alcanza desde el inicio', () => {
    const e = real();
    e.guia!.arbol.nodos.push({ id: 'huerfano', pregunta: '¿?', opciones: [
      { texto: 'a', resultado: { titulo: 't', texto: 'x', funciones: ['Calcular_PIRE'] } },
      { texto: 'b', resultado: { titulo: 't', texto: 'x', funciones: ['Calcular_PIRE'] } },
    ] });
    expect(() => validarExamen(e, RUTA)).toThrow(/huerfano/);
  });
  test('falla si el índice enlaza fuera de funciones/', () => {
    const e = real();
    e.guia!.indice[0].archivo = 'examen/E1.m';
    expect(() => validarExamen(e, RUTA)).toThrow(/examen\/E1\.m/);
  });
  test('falla si una función del índice se repite', () => {
    const e = real();
    e.guia!.indice.push({ ...e.guia!.indice[0] });
    expect(() => validarExamen(e, RUTA)).toThrow(/repetida/);
  });
});

describe('búsqueda', () => {
  test('normalizar quita acentos y mayúsculas', () => {
    expect(normalizar('Ángulo del Interferente')).toBe('angulo del interferente');
  });
  test('coincide exige todas las palabras, en cualquier orden', () => {
    const t = normalizar('Tres distancias (triángulo) ángulo del interferente Calcular_angulo_triangulo');
    expect(coincide('angulo triangulo', t)).toBe(true);
    expect(coincide('triángulo ÁNGULO', t)).toBe(true);
    expect(coincide('angulo satelite', t)).toBe(false);
  });
  test('una consulta vacía o de espacios lo encuentra todo', () => {
    expect(coincide('', 'cualquier cosa')).toBe(true);
    expect(coincide('   ', 'cualquier cosa')).toBe(true);
  });
});

describe('selector de casillas', () => {
  const filas = [
    { datos: ['Pt', 'Lt', 'Gt'], busco: ['PIRE'] },
    { datos: ['PIRE', 'Lb'], busco: ['Prx'] },
    { datos: ['Pt', 'Lb'], busco: ['Prx'] },
  ];
  test('pone antes las filas que ya puedes resolver y dice qué te falta en las demás', () => {
    expect(buscarFunciones(filas, ['Pt', 'Lb'], ['Prx'])).toEqual([
      { indice: 2, faltan: [] },
      { indice: 1, faltan: ['PIRE'] },
    ]);
  });
  test('sin nada pedido no devuelve filas', () => {
    expect(buscarFunciones(filas, ['Pt'], [])).toEqual([]);
  });
  test('varias cosas pedidas suman resultados', () => {
    expect(buscarFunciones(filas, ['Pt', 'Lt', 'Gt'], ['PIRE', 'Prx']).map((a) => a.indice)).toEqual([0, 2, 1]);
  });
  test('en la guía real, cada fila se puede encontrar marcando sus propias etiquetas', () => {
    const f = real().guia!.filas;
    f.forEach((fila, i) => {
      const r = buscarFunciones(f, fila.datos, fila.busco);
      expect(r.find((a) => a.indice === i)?.faltan).toEqual([]);
    });
  });
  test('«tengo Pt, Lt y Gt; piden la PIRE» da Calcular_PIRE', () => {
    const f = real().guia!.filas;
    const r = buscarFunciones(f, ['Pt', 'Lt', 'Gt'], ['PIRE']);
    expect(f[r[0].indice].funciones).toContain('Calcular_PIRE');
    expect(r[0].faltan).toEqual([]);
  });
});

describe('ejemplo resuelto', () => {
  test('cada paso se encuentra con el selector: marcando sus casillas sale su función sin que falte nada', () => {
    const g = real().guia!;
    for (const ap of g.ejemplo!.apartados) {
      for (const p of ap.pasos) {
        const r = buscarFunciones(g.filas, p.dan, p.piden).filter((a) => a.faltan.length === 0);
        const funciones = r.flatMap((a) => g.filas[a.indice].funciones);
        expect(funciones, `${ap.titulo}: ${p.funcion}`).toContain(p.funcion);
      }
    }
  });
  test('la llamada de cada paso usa la función que dice', () => {
    for (const ap of real().guia!.ejemplo!.apartados) for (const p of ap.pasos) expect(p.llamada).toContain(p.funcion);
  });
  test('avisa de que todo está pensado para MATLAB R2023b', () => {
    const g = real().guia!;
    expect(g.avisos!.join(' ')).toContain('R2023b');
    expect(g.ejemplo!.aviso).toContain('R2023b');
  });
});
