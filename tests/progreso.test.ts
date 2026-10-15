// Progreso guardado en el navegador: niveles, checklist, tarjetas e importación
// del avance de la web antigua de Conmutación (claves cx-).
import { describe, expect, test } from 'vitest';
import { crearProgreso } from '../src/comun/progreso';

// Almacén falso con la misma forma que localStorage
function almacenFalso(inicial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(inicial));
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

// Como en el modo privado de algunos navegadores: todo lanza un error
function almacenBloqueado(): Storage {
  const no = () => { throw new Error('SecurityError'); };
  return { length: 0, clear: no, getItem: no, key: no, removeItem: no, setItem: no };
}

describe('niveles', () => {
  test('un tema nuevo está a 0', () => {
    expect(crearProgreso(almacenFalso()).nivel('conmutacion', 'capa-enlace')).toBe(0);
  });
  test('marcar 2 y leerlo', () => {
    const p = crearProgreso(almacenFalso());
    p.marcar('conmutacion', 'capa-enlace', 2);
    expect(p.nivel('conmutacion', 'capa-enlace')).toBe(2);
  });
  test('marcar nunca baja el nivel…', () => {
    const p = crearProgreso(almacenFalso());
    p.marcar('conmutacion', 'capa-enlace', 3);
    p.marcar('conmutacion', 'capa-enlace', 1);
    expect(p.nivel('conmutacion', 'capa-enlace')).toBe(3);
  });
  test('…salvo con forzar (botón "Desmarcar")', () => {
    const p = crearProgreso(almacenFalso());
    p.marcar('conmutacion', 'capa-enlace', 3);
    p.marcar('conmutacion', 'capa-enlace', 2, true);
    expect(p.nivel('conmutacion', 'capa-enlace')).toBe(2);
  });
  test('usa la clave gitt-<asig>-<tema>', () => {
    const a = almacenFalso();
    crearProgreso(a).marcar('conmutacion', 'capa-enlace', 1);
    expect(a.getItem('gitt-conmutacion-capa-enlace')).toBe('1');
  });
  test('un valor basura guardado se lee como 0', () => {
    const p = crearProgreso(almacenFalso({ 'gitt-conmutacion-x': 'hola' }));
    expect(p.nivel('conmutacion', 'x')).toBe(0);
  });
});

describe('checklist y tarjetas', () => {
  test('checklist vacía de n puntos, y marcar uno', () => {
    const p = crearProgreso(almacenFalso());
    expect(p.checklist('conmutacion', 't', 3)).toEqual([false, false, false]);
    p.marcarSaber('conmutacion', 't', 1, true);
    expect(p.checklist('conmutacion', 't', 3)).toEqual([false, true, false]);
  });
  test('tarjetas: guardar una nota 0/1/2', () => {
    const p = crearProgreso(almacenFalso());
    p.guardarTarjeta('conmutacion', '¿Qué es el HLR?', 2);
    expect(p.tarjetas('conmutacion')).toEqual({ '¿Qué es el HLR?': 2 });
  });
});

describe('importación del avance antiguo (cx-)', () => {
  const antiguo = () => almacenFalso({
    'cx-done': '["p-arq"]',
    'cx-seen': '["um"]',
    'cx-know': '{"¿Qué es el VLR?":1}',
  });

  test('trae vistos y dominados, y no toca las claves antiguas', () => {
    const a = antiguo();
    const p = crearProgreso(a);
    expect(p.cxPendiente()).toBe(true);
    expect(p.importarCx()).toBe(2);
    expect(p.nivel('conmutacion', 'arquitectura-gsm')).toBe(3);
    expect(p.nivel('conmutacion', 'interfaz-aerea')).toBe(1);
    expect(p.tarjetas('conmutacion')).toEqual({ '¿Qué es el VLR?': 1 });
    expect(a.getItem('cx-done')).toBe('["p-arq"]');
    expect(a.getItem('cx-seen')).toBe('["um"]');
    expect(p.cxPendiente()).toBe(false);
  });
  test('importar dos veces no cambia nada la segunda', () => {
    const p = crearProgreso(antiguo());
    p.importarCx();
    expect(p.importarCx()).toBe(0);
    expect(p.nivel('conmutacion', 'arquitectura-gsm')).toBe(3);
    expect(p.nivel('conmutacion', 'interfaz-aerea')).toBe(1);
  });
  test('no baja un nivel nuevo más alto que el antiguo', () => {
    const a = antiguo();
    a.setItem('gitt-conmutacion-interfaz-aerea', '2');
    crearProgreso(a).importarCx();
    expect(crearProgreso(a).nivel('conmutacion', 'interfaz-aerea')).toBe(2);
  });
  test('"No, gracias" marca la oferta como vista sin importar', () => {
    const p = crearProgreso(antiguo());
    p.rechazarCx();
    expect(p.cxPendiente()).toBe(false);
    expect(p.nivel('conmutacion', 'arquitectura-gsm')).toBe(0);
  });
  test('sin claves antiguas no hay nada que ofrecer', () => {
    expect(crearProgreso(almacenFalso()).cxPendiente()).toBe(false);
  });
  test('claves antiguas rotas no rompen la importación', () => {
    const p = crearProgreso(almacenFalso({ 'cx-done': '{no es json', 'cx-seen': '["rr","desconocido"]' }));
    expect(p.importarCx()).toBe(1);
    expect(p.nivel('conmutacion', 'capa-red-rr')).toBe(1);
  });
});

describe('almacén bloqueado', () => {
  test('lanza en todo: disponible es false y nada rompe', () => {
    const p = crearProgreso(almacenBloqueado());
    expect(p.disponible).toBe(false);
    expect(p.nivel('conmutacion', 'capa-enlace')).toBe(0);
    expect(() => p.marcar('conmutacion', 'capa-enlace', 2)).not.toThrow();
    expect(() => p.marcarSaber('conmutacion', 'capa-enlace', 0, true)).not.toThrow();
    expect(p.checklist('conmutacion', 'capa-enlace', 2)).toEqual([false, false]);
    expect(p.cxPendiente()).toBe(false);
    expect(p.importarCx()).toBe(0);
  });
  test('sin almacén (al construir en Node): disponible es false', () => {
    expect(crearProgreso(null).disponible).toBe(false);
  });
});

describe('tema claro/oscuro', () => {
  test('sin elección guardada: null (seguir al sistema)', () => {
    expect(crearProgreso(almacenFalso()).tema()).toBeNull();
  });
  test('guardar y leer la elección en gitt-tema', () => {
    const a = almacenFalso();
    crearProgreso(a).guardarTema('oscuro');
    expect(a.getItem('gitt-tema')).toBe('oscuro');
    expect(crearProgreso(a).tema()).toBe('oscuro');
  });
  test('un valor desconocido se ignora', () => {
    expect(crearProgreso(almacenFalso({ 'gitt-tema': 'rosa' })).tema()).toBeNull();
  });
});
