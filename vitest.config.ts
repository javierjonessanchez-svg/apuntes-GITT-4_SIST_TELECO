// Pruebas unitarias (matemáticas de los widgets, fechas, progreso) y de la salida construida.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
