# Apuntes GITT 4º

Apuntes interactivos de cuarto del Grado en Ingeniería de Tecnologías de Telecomunicación (mención en Sistemas de Telecomunicación) de la Universidad de Alcalá, curso 2026/27. Es una sola web con una portada común y un «mundo» por asignatura: Conmutación ya tiene sus temas, con calculadoras, diagramas y tarjetas de repaso; Comunicaciones Ópticas, Radiación y Radiocomunicación, Circuitos de Comunicación y SEDA están en preparación.

**Son apuntes no oficiales de estudiantes**, basados en sus notas de clase: no están revisados ni avalados por el profesorado y pueden contener errores. El material del curso solo se cita por su título.

Web: https://javierjonessanchez-svg.github.io/apuntes-GITT-4_SIST_TELECO/

## Cómo se trabaja en ella

Hace falta Node 24. En Windows (PowerShell), desde la carpeta del repositorio:

```
npm.cmd install
npm.cmd run dev
npm.cmd run check
```

- `npm.cmd install` instala las dependencias (solo la primera vez o cuando cambie `package.json`).
- `npm.cmd run dev` abre la web en local, en http://localhost:4321/apuntes-GITT-4_SIST_TELECO/, y se recarga al guardar.
- `npm.cmd run check` lo comprueba todo antes de confirmar un cambio: tipos y esquema del contenido, construcción, pruebas y el comprobador del hub sobre `dist/` (recursos externos, rutas privadas, contraste y material de prácticas). Tiene que terminar sin ningún `FALLO`.

Al subir a `main`, la acción de `.github/workflows/deploy.yml` vuelve a pasar `npm run check` y, si todo va bien, publica en GitHub Pages.

## Cómo añadir un tema

1. Crea `contenido/<asignatura>/temas/<tema>.mdx`. El nombre del archivo es la dirección del tema.
2. Empieza con su ficha (la valida el esquema de `src/content.config.ts`):

   ```
   ---
   titulo: "Capa de enlace"
   orden: 3
   bloque: "Señalización"
   resumen: "HDLC, LAPDm, LAPD, MTP/SCCP"
   saber:
     - "Lo primero que hay que saber del tema"
     - "Lo segundo"
   fuentes:
     - "Título del material del curso"
   ---
   ```

   `orden` coloca el tema en la portada de la asignatura y en «anterior / siguiente»; `saber` es la lista que el estudiante marca al repasar.
3. Escribe el texto en Markdown, con fórmulas entre `$…$` o `$$…$$`.
4. Para un widget, impórtalo al principio del texto y colócalo donde toque, por ejemplo:

   ```
   import ErlangB from '../../../src/asignaturas/conmutacion/widgets/ErlangB.astro';

   <ErlangB N={10} A={5} />
   ```

5. Pasa `npm.cmd run check` y revisa el tema con `npm.cmd run dev`.

Una asignatura nueva se describe en `contenido/<asignatura>/asignatura.md` (nombre, slug, estado `activa` o `pendiente`, descripción y fechas de pruebas).
