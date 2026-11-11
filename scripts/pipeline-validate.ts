/**
 * Pipeline stage 2: validate every repertoire node with Stockfish and point out invalid ones.
 *
 *   node scripts/pipeline-validate.ts [book-slug] [depth]     (default: colle-system 20)
 *   STOCKFISH=/path/to/stockfish  (default: ../chess/opening/tools/stockfish/stockfish-macos-universal)
 *
 * Needs a successful stage 1 checkpoint (private/books/<slug>/pipeline/build.json with ok: true).
 * Evaluates every position once (cached per depth), then grades each node by the win-chance drop for the
 * side that moved (Lichess model, as in the book: >= 10 inaccuracy, >= 20 mistake, >= 30 blunder).
 *
 *   invalid   White moves (the repertoire's own moves) graded mistake or blunder
 *   warning   White moves graded inaccuracy
 *   opponent  Black moves graded inaccuracy or worse: errors the lessons show on purpose, listed for review
 *
 * Writes private/books/<slug>/pipeline/validation.json and validation.md.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { join } from 'node:path'
import { Chess } from 'chess.js'
import { grade, winDrop, type Grade, type PipelineNode, type Score } from '../src/lib/chess/pipeline.ts'
import { formatMovePath } from '../src/lib/chess/repertoire.ts'
import { analyseAll, type Analysis } from './lib/stockfish.ts'

const [slug = 'colle-system', depthArg = '20'] = process.argv.slice(2)
const depth = Number(depthArg)
if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid book slug: ${slug}`)
if (!Number.isInteger(depth) || depth < 1 || depth > 60) throw new Error(`depth must be 1..60, got ${depthArg}`)
const engine = process.env.STOCKFISH ?? '../chess/opening/tools/stockfish/stockfish-macos-universal'
if (!existsSync(engine)) throw new Error(`Stockfish not found at ${engine}; set STOCKFISH=/path/to/stockfish`)

const dir = join('private', 'books', slug, 'pipeline')
const checkpoint = join(dir, 'build.json')
if (!existsSync(checkpoint)) throw new Error(`No checkpoint at ${checkpoint}; run npm run pipeline:build first`)
const build = JSON.parse(readFileSync(checkpoint, 'utf8')) as { ok: boolean; nodes: PipelineNode[] }
if (!build.ok) throw new Error('Stage 1 did not pass; fix the lesson errors and rebuild before validating')

const full = (key: string) => `${key} 0 1`
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'

// Positions: game-over positions are scored directly; the rest go to Stockfish (cached per depth).
const cacheFile = join(dir, `evals-depth${depth}.json`)
const cache: Record<string, Analysis> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {}
const positions = [...new Set(build.nodes.flatMap((n) => [n.before, n.after]))]
const terminal = new Map<string, Score>()
for (const p of positions) {
  const c = new Chess(full(p))
  if (c.isCheckmate()) terminal.set(p, { mate: 0 })
  else if (c.isDraw()) terminal.set(p, { cp: 0 })
}
const todo = positions.filter((p) => !terminal.has(p) && !cache[p])
const workers = Math.max(1, cpus().length - 2)
console.log(`Stage 2: validate ${build.nodes.length} nodes (${positions.length} positions, ${positions.length - todo.length} cached or final) with Stockfish at depth ${depth}, ${workers} engines`)
const t0 = Date.now()
if (todo.length) {
  const fresh = await analyseAll(engine, todo.map(full), depth, workers, (n) => {
    if (n % 50 === 0 || n === todo.length) process.stdout.write(`\r  ${n}/${todo.length} positions`)
  })
  for (const p of todo) cache[p] = fresh.get(full(p))!
  writeFileSync(cacheFile, JSON.stringify(cache))
  process.stdout.write(`  (${Math.round((Date.now() - t0) / 1000)} s)\n`)
}
const scoreOf = (p: string): Score => terminal.get(p) ?? cache[p].score

// Shortest move path from the start to each position, to show where a node is.
const byBefore = new Map<string, PipelineNode[]>()
for (const n of build.nodes) byBefore.set(n.before, [...(byBefore.get(n.before) ?? []), n])
const pathTo = new Map<string, string[]>([[START, []]])
const queue = [START]
while (queue.length) {
  const p = queue.shift()!
  for (const n of byBefore.get(p) ?? []) if (!pathTo.has(n.after)) (pathTo.set(n.after, [...pathTo.get(p)!, n.move]), queue.push(n.after))
}

const fmt = (s: Score, flip = false) => ('cp' in s ? `${(((flip ? -1 : 1) * s.cp) / 100).toFixed(2)}` : `#${(flip ? -1 : 1) * s.mate}`)
const toSan = (before: string, uci?: string) => {
  if (!uci) return undefined
  try {
    return new Chess(full(before)).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
  } catch {
    return uci
  }
}
type Row = PipelineNode & { grade: Grade; drop: number; best?: string; evalBefore: string; evalAfter: string; path: string }
const rows: Row[] = build.nodes.map((n) => {
  const drop = winDrop(scoreOf(n.before), scoreOf(n.after))
  const path = pathTo.get(n.before)
  return {
    ...n,
    grade: grade(drop),
    drop: Math.round(drop * 10) / 10,
    best: toSan(n.before, cache[n.before]?.best),
    // Both evals from the mover's point of view.
    evalBefore: fmt(scoreOf(n.before)),
    evalAfter: fmt(scoreOf(n.after), true),
    path: path ? formatMovePath([...path, n.move]) : `(not reachable from the start) ${n.move}`,
  }
})

const bad = (g: Grade) => g === 'mistake' || g === 'blunder'
const invalid = rows.filter((r) => r.toMove === 'white' && bad(r.grade)).sort((a, b) => b.drop - a.drop)
const warnings = rows.filter((r) => r.toMove === 'white' && r.grade === 'inaccuracy').sort((a, b) => b.drop - a.drop)
const opponent = rows.filter((r) => r.toMove === 'black' && r.grade !== 'ok').sort((a, b) => b.drop - a.drop)

const table = (list: Row[]) =>
  list.length === 0
    ? '_None._\n'
    : '| # | Line | Played | Stockfish best | Eval before → after (mover) | Win % lost | Grade | Seen in |\n|---|---|---|---|---|---|---|---|\n' +
      list.map((r, i) => `| ${i + 1} | ${r.path} | ${r.move} | ${r.best ?? '-'} | ${r.evalBefore} → ${r.evalAfter} | ${r.drop} | ${r.grade} | ${r.sources.slice(0, 3).join('; ')}${r.sources.length > 3 ? `; +${r.sources.length - 3} more` : ''} |`).join('\n') +
      '\n'
const md = `# Stockfish validation: ${slug}

Depth ${depth}. ${rows.length} nodes from the lesson-by-lesson build. Grades use the Lichess win-chance drop for the
side that moved (>= 10 inaccuracy, >= 20 mistake, >= 30 blunder). Evals are in pawns from the mover's point of view.

## Invalid nodes: White mistakes and blunders (${invalid.length})
${table(invalid)}
## Warnings: White inaccuracies (${warnings.length})
${table(warnings)}
## Opponent errors: Black moves graded inaccuracy or worse (${opponent.length})
Lessons often show these on purpose, to teach the refutation. Listed for review, not counted as invalid.

${table(opponent)}`
writeFileSync(join(dir, 'validation.md'), md)
writeFileSync(join(dir, 'validation.json'), JSON.stringify({ slug, depth, invalid, warnings, opponent }, null, 1) + '\n')

console.log(`\n${invalid.length} invalid (White mistakes/blunders), ${warnings.length} warnings (White inaccuracies), ${opponent.length} opponent errors (Black)`)
for (const r of invalid.slice(0, 15)) console.log(`  ${r.grade.padEnd(8)} -${String(r.drop).padStart(5)}%  ${r.path}  (best ${r.best ?? '-'}; ${r.evalBefore} → ${r.evalAfter})  [${r.sources[0]}]`)
if (invalid.length > 15) console.log(`  … ${invalid.length - 15} more`)
console.log(`Report: ${join(dir, 'validation.md')}`)
