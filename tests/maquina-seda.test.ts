// Máquina de estados de SEDA: el horno microondas de clase (estados, eventos, entry/exit y acciones).
import { describe, expect, test } from 'vitest';
import { eventosPosibles, microondas, paso } from '../src/asignaturas/seda/widgets/maquina';

const exitDe = (e: string) => (microondas.estados[e].exit ? [microondas.estados[e].exit!] : []);
const entryDe = (e: string) => (microondas.estados[e].entry ? [microondas.estados[e].entry!] : []);
const accionDe = (de: string, ev: string) => {
  const t = microondas.transiciones.find((x) => x.de === de && x.evento === ev)!;
  return t.accion ? [t.accion] : [];
};

describe('máquina de estados del microondas', () => {
  test('empieza en IDLE', () => {
    expect(microondas.inicial).toBe('idle');
  });
  test('una transición dispara exit, acción y entry en ese orden', () => {
    const r = paso(microondas, 'ingresando', 'start');
    expect(r.estado).toBe('calentando');
    expect(r.acciones).toEqual([...exitDe('ingresando'), ...accionDe('ingresando', 'start'), ...entryDe('calentando')]);
    expect(r.acciones.length).toBeGreaterThan(1);
  });
  test('una autotransición (externa) sale y vuelve a entrar', () => {
    const r = paso(microondas, 'ingresando', 'tecla');
    expect(r.estado).toBe('ingresando');
    expect(r.acciones).toEqual([...exitDe('ingresando'), ...accionDe('ingresando', 'tecla'), ...entryDe('ingresando')]);
  });
  test('un evento que no sale del estado no hace nada', () => {
    expect(paso(microondas, 'idle', 'fin')).toEqual({ estado: 'idle', acciones: [] });
  });
  test('toda transición va de y a un estado que existe', () => {
    for (const t of microondas.transiciones) {
      expect(microondas.estados[t.de]).toBeDefined();
      expect(microondas.estados[t.a]).toBeDefined();
    }
  });
  test('eventosPosibles: solo los que salen del estado, sin repetir', () => {
    expect(eventosPosibles(microondas, 'calentando').sort()).toEqual(['abrir', 'cancelar', 'fin']);
    expect(eventosPosibles(microondas, 'idle')).toEqual(['tecla']);
  });
});
