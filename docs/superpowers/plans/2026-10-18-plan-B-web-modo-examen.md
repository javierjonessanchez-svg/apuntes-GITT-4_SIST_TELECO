# Radiación exam mode, Plan B (website) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a data-driven "Modo examen" page to the course website: problem-type workflows plus a master formula checklist with "a mano" / "en MATLAB" ticks, each item linked to its MATLAB file in the private `radiacion-radiocom` repo.

**Architecture:** A YAML data file per subject (`contenido/<slug>/examen.yaml`) validated by a new Astro content collection. Pure helpers in `src/comun/examen.ts` (unit-tested) check references and group the data. One static page `src/pages/[asignatura]/examen.astro` renders it; a small client script saves ticks through `progreso.ts`. The home card links to it.

**Tech Stack:** Astro 7.3.8 content collections + zod, KaTeX 0.19 (`src/widgets/mates.ts → formula()`), vitest 5, TypeScript 6. Windows: use `npm.cmd`.

**Spec:** `radiacion-radiocom/especificaciones/2026-10-18-modo-examen-design.md` §6 (private repo; this plan is public-safe and can be copied into the site repo's `docs/superpowers/plans/`).

## Global Constraints
- Work in a **new git worktree off `main`**, branch `radiacion-modo-examen`. Never edit the shared checkout `C:\Users\javie\code\apuntes-GITT-4_SIST_TELECO` (other sessions use it).
- **Public site.** Only formula text, function names, example calls and paths under `funciones/` or `plantillas/` of the private repo. No MATLAB code, no exercises, nothing from past exams (spec X1–X2).
- Repo link base: `https://github.com/javierjonessanchez-svg/radiacion-radiocom/blob/main/`.
- localStorage key `gitt-<asig>-examen` = JSON `{ [id]: { mano: boolean, matlab: boolean } }`, only via `src/comun/progreso.ts` (try/catch, like the other keys).
- UI copy and code comments in Spanish (Spain). Both colour modes, 375 px width, keyboard-operable ticks. Apply `make-interfaces-feel-better` checks before finishing (CLAUDE.md UI rule).
- Done = `npm.cmd run check` passes + browser check + PR opened (spec §6–7).
- **Delegation (CLAUDE.md):** the page component's first draft (Task 3, > 40 lines of markup/CSS) may go to Pi or agy with the `make-interfaces-feel-better` SKILL.md text pasted in; integration, data and tests stay in-session.

## Review Focus
1. **Data entry typos** (a workflow step pointing to a formula id that doesn't exist): build fails with the file and the id. Test in Task 1.
2. **Leaking private paths** (an `archivo` under `examen/`, `docs/`, `problemas/`): test fails. Task 1.
3. **Storage blocked** (private mode): page still renders, ticks work for the session, and a note says progress isn't saved. Task 2 test + Task 3 markup.
4. **Bad TeX** in a formula: shows as `<code>` (existing `formula()` fallback), doesn't break the build. Task 1 test.
5. **Subject with exam data but `estado: pendiente`** (Radiación today): page and home link still appear. Task 3/4 tests.

---

### Task 1: Data schema and helpers

**Files:**
- Modify: `src/content.config.ts` (new collection `examenes`)
- Create: `src/comun/examen.ts`
- Test: `tests/examen.test.ts`, fixture `tests/fixtures/examen-ejemplo.yaml`

**Interfaces:**
- Produces (in `examen.ts`):
  - `type Formula = { id: string; tema: string; prueba: 'PEI1' | 'PEI2'; nombre: string; tex: string; funcion: string; llamada: string; archivo: string; notas?: string }`
  - `type Paso = { formula: string; nota?: string }`, `type Flujo = { id: string; titulo: string; cuando: string; pasos: Paso[] }`
  - `type Examen = { repo: string; formulas: Formula[]; flujos: Flujo[] }`
  - `validarExamen(e: Examen, archivo: string): void`: throws `Error` naming `archivo` and the bad id for: duplicate formula id, step pointing to an unknown id, `archivo` not starting with `funciones/` or `plantillas/`, or any text field containing `PEI 1 RADIO` or `2025-2026`.
  - `porTema(f: Formula[]): { tema: string; formulas: Formula[] }[]` (keeps first-appearance order of `tema`).
  - `enlace(e: Examen, f: Formula): string` = `e.repo + f.archivo`.
- Collection: `glob({ base: './contenido', pattern: '*/examen.yaml' })`, zod schema mirroring `Examen` (ids `^[a-z0-9-]+$`, `repo` must start with `https://github.com/`).

- [ ] **Step 1: Write failing tests** in `tests/examen.test.ts`: `valida el ejemplo` (fixture passes); `falla con paso a id inexistente` (message contains the id and the file name); `falla con id repetido`; `falla con archivo fuera de funciones/plantillas` (`examen/ejercicios/E1.md`); `falla con texto de examen antiguo`; `porTema conserva el orden`; `enlace concatena repo y archivo`.
- [ ] **Step 2:** `npm.cmd run test -- examen` → FAIL.
- [ ] **Step 3:** Implement `examen.ts` + collection.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `Modo examen: esquema y validación de datos`.

### Task 2: Ticks in progreso.ts

**Files:**
- Modify: `src/comun/progreso.ts` (add to `crearProgreso` and the key list in the header comment)
- Test: `tests/progreso.test.ts`

**Interfaces:**
- Produces: on the progress object, `examen(asig): Record<string, { mano: boolean; matlab: boolean }>` and `marcarExamen(asig, id, campo: 'mano' | 'matlab', valor: boolean): void`. Corrupt JSON → `{}`.
- [ ] **Step 1: Tests** (same fake-storage style as the existing file): round trip of one tick; second field kept when setting the first; corrupt JSON returns `{}`; `null` storage → `examen()` is `{}` and `marcarExamen` doesn't throw.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit.

### Task 3: Page, component and client script

**Files:**
- Create: `src/pages/[asignatura]/examen.astro`, `src/comun/ModoExamen.astro`, `src/comun/modo-examen.css`, `src/comun/cliente/examen.ts`
- Modify: `src/comun/datos.ts` (add `examenDe(slug): Promise<Examen | undefined>`, which calls `validarExamen`)
- Test: `tests/comprobar-hub.mjs` (add the page to its checks) and a vitest for the pure `resumen(ticks, ids)` helper exported from `src/comun/cliente/examen.ts` → `{ mano: n, matlab: n, total: n }`.

**Interfaces:**
- Consumes: `Examen`, `porTema`, `enlace` (Task 1); `progreso.examen` / `marcarExamen` (Task 2); `formula(tex, bloque)` from `src/widgets/mates.ts`; `BaseLayout`, `ruta`.
- `getStaticPaths()`: every subject from `asignaturasOrdenadas()` for which `examenDe(slug)` is defined, **whatever its `estado`**. The static segment `examen` wins over `[tema]`.
- Layout (`ModoExamen.astro`, data attributes for the script: `data-modo-examen`, `data-asig`, `data-id`, `data-campo`):
  1. Header: subject name, "Modo examen", the progress summary ("12/30 a mano · 8/30 en MATLAB"), PEI1/PEI2 filter chips (`aria-pressed`).
  2. "Flujos por tipo de problema": one `<details>` per workflow, its `cuando` as subtitle, an ordered list of steps (formula rendered with KaTeX, `funcion` in `<code>`, `llamada` in a copyable `<code>`, "ver código ↗" link opening in a new tab with `rel="noopener"`).
  3. "Todas las fórmulas": grouped by `porTema`, each row with the formula, the two checkboxes (`<label>` "a mano" / "en MATLAB"), function, call and link, plus `notas` if present.
  4. A hidden note shown when `progreso.disponible` is false: "Tu navegador no deja guardar el avance; las marcas se pierden al cerrar".
- [ ] **Step 1:** Write the `resumen` vitest → FAIL → implement → PASS.
- [ ] **Step 2:** Build the page with the Task 1 fixture copied as `contenido/radiacion-radiocomunicacion/examen.yaml` (temporary content). `npm.cmd run build` succeeds and `dist/radiacion-radiocomunicacion/examen/index.html` exists.
- [ ] **Step 3:** Extend `comprobar-hub.mjs`: the exam page exists, every "ver código" href starts with the repo base, every checkbox has a label.
- [ ] **Step 4:** Commit `Modo examen: página, componente y marcas`.

### Task 4: Entry point on the home page

**Files:**
- Modify: `src/asignaturas/portada/TarjetaAsignatura.astro` (new prop `examen: boolean`), its caller in `src/pages/index.astro` / portada (pass `!!(await examenDe(a.slug))`), and `src/asignaturas/base/Portada.astro` (same link for active subjects using the base world)
- Test: `tests/comprobar-hub.mjs`

- [ ] **Step 1:** Add to `comprobar-hub.mjs`: the Radiación card on `index.html` contains a link to `/radiacion-radiocomunicacion/examen/` even though the subject is `pendiente`; subjects without data have no such link.
- [ ] **Step 2:** Run `npm.cmd run check` → FAIL. **Step 3:** Implement ("Modo examen" link, styled with the card's existing tokens). **Step 4:** → PASS. **Step 5:** Commit.

### Task 5: Radiación content

**Files:**
- Modify: `contenido/radiacion-radiocomunicacion/examen.yaml` (replace the fixture)

**Interfaces:**
- Consumes: the function names and files of Plan A (Tasks 1–7) plus the existing ones listed in the private README index. Before writing, run in the private repo: `ls funciones/*/*.m plantillas/*.m` and use only names that exist.
- Content:
  - ~25 formulas over 4 temas (Propagación, Antenas, Desvanecimientos, Ruido e interferencias), all `prueba: PEI1`, each `tex` taken from the private FORMULARIO.
  - 4 workflows: "Radioenlace con obstáculos → Prx → margen dinámico → disponibilidad", "Interferencia y XPD por lluvia", "Espacio libre: campo, flujo y potencia", "Trayecto sobre el mar: dos rayos". Each `cuando` = the words in a statement that identify it.
- [ ] **Step 1:** Write the YAML. **Step 2:** `npm.cmd run check` → PASS (the validator catches typos).
- [ ] **Step 3:** Browser check via the preview tools (`.claude/launch.json` dev server): light and dark, 375 px, tick a box → reload → still ticked; "ver código" opens GitHub. Screenshot as proof.
- [ ] **Step 4:** Commit, push the branch, open the PR (body ends with the Claude Code line). Ask Javier before merging.
