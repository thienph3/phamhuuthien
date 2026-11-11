/**
 * Builds public move data for a private book: moves only, no book text.
 *
 *   node scripts/build-repertoire.ts [book-slug] [max-ply|all]   (default: colle-system all)
 *
 * Sorts every line into lesson / question / game / mine (see scripts/lib/readBook.ts) and writes
 * src/content/books/ (safe to commit: moves, positions and page labels only):
 *   <slug>.lessons.moves.json  <slug>.questions.moves.json  <slug>.games.moves.json   one flat list per kind
 *   <slug>.moves.json          the repertoire: lesson + question + mine, as a flat list
 *   <slug>.repertoire.json     the same repertoire as a position graph (used by the site's explorer)
 * and private/books/<slug>/questions-unresolved.txt: question moves that could not be attached (book text).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildRepertoire, toMoveList, type SourceKind } from '../src/lib/chess/repertoire.ts'
import { readBook } from './lib/readBook.ts'

const [slug = 'colle-system', plyArg = 'all'] = process.argv.slice(2)
const maxPly = plyArg === 'all' ? null : Number(plyArg)
if (maxPly !== null && (!Number.isInteger(maxPly) || maxPly < 1)) throw new Error(`max-ply must be a positive whole number or "all", got ${plyArg}`)

const book = await readBook(slug)
const inputs = [...book.pages.flatMap((p) => p.lines), ...book.mine]
const questionCount = book.pages.reduce((n, p) => n + p.questions, 0)

const outDir = join('src', 'content', 'books')
mkdirSync(outDir, { recursive: true })
const write = (name: string, data: unknown) => writeFileSync(join(outDir, name), JSON.stringify(data, null, 1) + '\n')
const build = (kinds: SourceKind[]) => buildRepertoire(inputs.filter((i) => kinds.includes(i.kind!)), maxPly)

for (const [kind, file] of [['lesson', 'lessons'], ['question', 'questions'], ['game', 'games']] as const) {
  const { repertoire } = build([kind])
  const list = toMoveList(repertoire)
  write(`${slug}.${file}.moves.json`, list)
  console.log(`${file.padEnd(9)} ${String(repertoire.sources.length).padStart(4)} lines  ${String(list.moves.length).padStart(5)} moves`)
}
const { repertoire, skipped } = build(['lesson', 'question', 'mine'])
const list = toMoveList(repertoire)
write(`${slug}.repertoire.json`, repertoire)
write(`${slug}.moves.json`, list)
console.log(`repertoire (lesson + question + mine): ${repertoire.sources.length} lines, ${Object.keys(repertoire.positions).length} positions, ${list.moves.length} moves`)
console.log(`${skipped.length} line(s) skipped (start from a custom position); questions: ${questionCount}, with moves not attached: ${book.unresolved.length}`)
writeFileSync(join(book.dir, 'questions-unresolved.txt'), book.unresolved.join('\n') || 'All question moves were attached.\n')
console.log(`Unattached question moves listed in ${join(book.dir, 'questions-unresolved.txt')} (private)`)
