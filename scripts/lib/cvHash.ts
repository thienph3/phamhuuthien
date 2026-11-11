import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { awards, education, experience, publications, site, timelineExtras } from '../../src/content/site.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
/** Every file that can change how the printed CV looks: its page, the components it renders, the theme, the anchors. */
const DIRS = ['src/components/layout', 'src/components/ui', 'src/components/cv', 'src/components/sections', 'src/theme']
const sources = () => [
  'src/pages/Cv.tsx',
  'src/lib/anchors.ts',
  ...DIRS.flatMap((d) => (readdirSync(root + d, { recursive: true }) as string[]).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f)).map((f) => `${d}/${f}`)),
].sort()

/** Fingerprint of the CV. `npm run cv:pdf` stores it next to the PDF; a test fails when they no longer match. */
export function cvHash(): string {
  const h = createHash('sha256')
  // The year is part of it: the timeline axis runs to the current year, so the PDF is remade each new year.
  h.update(JSON.stringify({ year: new Date().getFullYear(), site, experience, education, awards, publications, timelineExtras }))
  for (const f of sources()) h.update(f + readFileSync(root + f, 'utf8'))
  return h.digest('hex').slice(0, 16)
}

export const PDF_PATH = 'public/Thien-Pham-CV.pdf'
export const HASH_PATH = 'scripts/cv-pdf.hash'
