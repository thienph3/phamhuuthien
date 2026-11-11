/**
 * Pipeline stage 1: build the repertoire lesson by lesson, then pause.
 *
 *   node scripts/pipeline-build.ts [book-slug]        (default: colle-system)
 *
 * Reads the lesson pages in book order (example games are left out). For each page it adds the page's
 * board lines and question/answer lines as nodes { before, toMove, move, after }, merging nodes that are
 * already in the repertoire (same before + toMove + move). Every node is checked for legality and
 * consistency. Writes the checkpoint private/books/<slug>/pipeline/build.json and stops; run
 * pipeline-validate.ts next. Exits 1 if any lesson has an error (then validation will refuse to run).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { addPage, type PipelineNode, type StepResult } from '../src/lib/chess/pipeline.ts'
import { readBook } from './lib/readBook.ts'

const [slug = 'colle-system'] = process.argv.slice(2)
const book = await readBook(slug)
const lessons = book.pages.filter((p) => p.kind === 'lesson' && p.lines.length > 0)

const repertoire = new Map<string, PipelineNode>()
const steps: (StepResult & { page: string; label: string; total: number })[] = []
console.log(`Stage 1: build the repertoire from ${lessons.length} lesson pages (example games left out)\n`)
console.log('page                  lines  nodes  new  merged  skipped  total  status')
for (const p of lessons) {
  const r = addPage(repertoire, p.page, p.lines)
  steps.push({ ...r, page: p.page, label: p.label, total: repertoire.size })
  console.log(`${p.page.padEnd(22)}${String(r.lines).padStart(5)}${String(r.nodes).padStart(7)}${String(r.added).padStart(5)}${String(r.merged).padStart(8)}${String(r.skipped).padStart(9)}${String(repertoire.size).padStart(7)}  ${r.errors.length ? `${r.errors.length} ERROR(S)` : 'ok'}`)
  for (const e of r.errors) console.log(`    ! ${e}`)
}

const ok = steps.every((s) => s.errors.length === 0)
const outDir = join(book.dir, 'pipeline')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'build.json'), JSON.stringify({ slug, ok, steps, nodes: [...repertoire.values()] }, null, 1) + '\n')
console.log(`\n${repertoire.size} nodes. Checkpoint: ${join(outDir, 'build.json')}`)
if (book.unresolved.length) console.log(`Note: ${book.unresolved.length} questions have moves that could not be attached (see questions-unresolved.txt); they are not in the repertoire.`)
if (!ok) {
  console.log('\nBuild FAILED: fix the errors above. Validation will not run.')
  process.exit(1)
}
console.log('\nAll lessons OK. Paused before validation. Next: npm run pipeline:validate')
