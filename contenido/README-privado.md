# Capa solo local (`contenido/<asignatura>/privado/`)

Aquí viven las páginas con **material del profesor** (enunciados, figuras escaneadas, soluciones oficiales), p. ej. `contenido/seda/privado/`.

- La carpeta está en `.gitignore` (`/contenido/*/privado/`): Git no la sube.
- `src/content.config.ts` la **excluye** cuando se construye en GitHub Actions (`GITHUB_ACTIONS=true`) o con `APUNTES_SIN_PRIVADO=1`. Así la web pública nunca la lleva, aunque alguien la añadiese a Git por error.
- En local (`npm.cmd run dev` / `build`) las páginas salen como un tema más, con la banda «Solo local».
- Copia maestra: `C:\Users\javie\code\seda\web-privado\` (fuera del repositorio). Para restaurarla en otra copia del repo:
  `robocopy C:\Users\javie\code\seda\web-privado contenido\seda\privado /E`
- Para probar la construcción pública: `$env:APUNTES_SIN_PRIVADO=1; npm.cmd run check`.
- Nunca quites la carpeta de `.gitignore` ni subas figuras de exámenes a `public/` o a `src/`.
