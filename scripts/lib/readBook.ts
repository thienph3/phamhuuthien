import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractGames, extractQuestions } from '../../src/lib/chess/mdxGames.ts'
import { questionLines } from '../../src/lib/chess/questions.ts'
import type { SourcedGame, SourceKind } from '../../src/lib/chess/repertoire.ts'

export type BookPage = { page: string; label: string; part: string; kind: 'lesson' | 'game'; lines: SourcedGame[]; questions: number }
export type Book = { dir: string; pages: BookPage[]; mine: SourcedGame[]; unresolved: string[] }

/**
 * Reads a private book in table-of-contents order. Each page gets its board lines (kind lesson or game)
 * and, on every page, the lines built from its questions + answers (kind question). Your repertoire lines
 * come back separately as kind mine. Unattached question moves are returned as readable text (book text:
 * keep it private).
 */
export async function readBook(slug: string): Promise<Book> {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid book slug: ${slug}`)
  const dir = join('private', 'books', slug)
  if (!existsSync(join(dir, 'toc.ts'))) throw new Error(`No private book at ${dir} (it is git-ignored and only exists on your machine).`)
  const root = new URL('../../', import.meta.url)
  const { NAV } = (await import(new URL(`${dir}/toc.ts`, root).href)) as { NAV: { part: string; links: { slug: string; label: string }[] }[] }
  const gameParts: string[] = existsSync(join(dir, 'categories.ts')) ? (await import(new URL(`${dir}/categories.ts`, root).href)).exampleGameParts : []

  const pages: BookPage[] = []
  const unresolved: string[] = []
  for (const part of NAV) {
    const kind = gameParts.includes(part.part) ? 'game' : 'lesson'
    for (const link of part.links) {
      const mdx = readFileSync(join(dir, 'pages', `${link.slug}.mdx`), 'utf8')
      const games = extractGames(mdx)
      const lines: SourcedGame[] = games.map((game, i) => ({ page: link.slug, kind, label: games.length > 1 ? `${link.label} (line ${i + 1})` : link.label, game }))
      const qs = extractQuestions(mdx)
      qs.forEach((q, qi) => {
        const r = questionLines(q.question, q.answer, games)
        r.lines.forEach((moves, li) => lines.push({ page: link.slug, kind: 'question', label: `${link.label}, question ${qi + 1}${r.lines.length > 1 ? ` (line ${li + 1})` : ''}`, game: { moves } }))
        if (r.unresolved.length)
          unresolved.push(`${link.label}, question ${qi + 1}\n  Q: ${q.question}\n  A: ${q.answer}\n  not attached: ${r.unresolved.map((run) => run.map((t) => `${Math.ceil(t.ply / 2)}${t.ply % 2 ? '.' : '...'}${t.san}`).join(' ')).join(' | ')}\n`)
      })
      pages.push({ page: link.slug, label: link.label, part: part.part, kind, lines, questions: qs.length })
    }
  }

  const mine: SourcedGame[] = []
  if (existsSync(join(dir, 'repertoire.ts'))) {
    const { REPERTOIRE } = (await import(new URL(`${dir}/repertoire.ts`, root).href)) as { REPERTOIRE: { lines: { vs: string; line: SourcedGame['game'] }[] }[] }
    for (const l of REPERTOIRE.flatMap((g) => g.lines)) mine.push({ page: 'my-repertoire', kind: 'mine' as SourceKind, label: `My repertoire: vs ${l.vs}`, game: l.line })
  }
  return { dir, pages, mine, unresolved }
}
