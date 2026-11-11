# phamhuuthien

Personal site of Thien Pham (Phạm Hữu Thiên). React + TypeScript + MUI, built with Vite, hosted on
Cloudflare (Workers static assets).

## Develop

Needs Node 22 (`.nvmrc`).

```bash
nvm use
npm install
npm run dev      # local dev server (http://localhost:5173)
npm test         # unit and component tests
npm run build    # type-check + production build into dist/
npm run preview  # serve dist/ (http://localhost:4173)
```

## Structure

```
src/
  theme/        design tokens (green palette, light/dark) and the MUI theme
  components/   reusable component library (import from '@/components')
    layout/     PageContainer, Section, SiteHeader, SiteFooter, SiteLayout, SkipLink
    ui/         LinkButton, Eyebrow, Tag/TagList, StatusPill, ThemeToggle
    cards/      ContentCard, ProjectCard
    sections/   Hero, AboutSection, ProjectsSection, ContactSection
  content/      all page copy and data (site.ts) and its types
  pages/        pages only assemble components + content (Home, NotFound)
  App.tsx       route table: add new pages here
```

To change text, edit `src/content/site.ts`. Lines marked `DRAFT` there still need your own facts.
New colours or spacing belong in `src/theme/tokens.ts`, not in components.

- **Projects:** `projects` in `site.ts`. The section is hidden on the home page for now; re-add
  `<ProjectsSection projects={projects} />` in `src/pages/Home.tsx` and its link in `navLinks`.

## Deploy (Cloudflare)

Connect this repo in Workers & Pages with:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (serves `dist/`, see `wrangler.jsonc`)
- Worker name must match `name` in `wrangler.jsonc` (`phamhuuthien`)

Check the config locally with `npx wrangler deploy --dry-run` after a build.