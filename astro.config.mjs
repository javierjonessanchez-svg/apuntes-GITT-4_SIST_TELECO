// Configuración de Astro para el sitio unificado de apuntes.
// La web se publica en https://javierjonessanchez-svg.github.io/apuntes-GITT-4_SIST_TELECO/
// por eso todos los enlaces internos llevan delante "base" (usar import.meta.env.BASE_URL).
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://javierjonessanchez-svg.github.io',
  base: '/apuntes-GITT-4_SIST_TELECO',
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    // Fórmulas en LaTeX ($…$ y $$…$$), dibujadas al construir: se ven sin JavaScript
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
