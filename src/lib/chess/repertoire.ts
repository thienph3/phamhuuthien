import { Chess } from 'chess.js'
import { buildTree, type GameSpec, type MoveNode } from './moveTree.ts'

/** What a line is: a lesson board, a line built from a question + answer, an example game, or my own line. */
export type SourceKind = 'lesson' | 'question' | 'game' | 'mine'

/** Where a line came from (structure only, no book text). */
export type RepertoireSource = { id: number; page: string; label: string; kind?: SourceKind }

export type RepertoireMove = {
  san: string
  /** Position key after the move. */
  to: string
  /** Source ids of every line that played this move here. */
  sources: number[]
}

/**
 * Opening repertoire as a position graph: moves only, no annotations, glyphs or captions.
 * Positions are keyed by FEN without move counters, so transpositions merge.
 */
export type Repertoire = {
  version: 1
  /** Half-move depth limit, or null for every move of every line. */
  maxPly: number | null
  root: string
  sources: RepertoireSource[]
  positions: Record<string, { toMove: 'white' | 'black'; moves: RepertoireMove[] }>
}

export type SourcedGame = { page: string; label: string; kind?: SourceKind; game: GameSpec }

const START = new Chess().fen()

/** FEN without the halfmove and fullmove counters. */
export const positionKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ')

/**
 * Merges every line (main line and variations) of every game into one position graph,
 * up to `maxPly` half-moves from the start (null = no limit, every move). Lines that start from a custom position are skipped
 * (they cannot be reached from move 1) and returned in `skipped`.
 */
export function buildRepertoire(inputs: SourcedGame[], maxPly: number | null = null): { repertoire: Repertoire; skipped: SourcedGame[] } {
  const sources: RepertoireSource[] = []
  const positions: Repertoire['positions'] = {}
  const skipped: SourcedGame[] = []
  const root = positionKey(START)

  const ensure = (fen: string) => (positions[positionKey(fen)] ??= { toMove: fen.split(' ')[1] === 'w' ? 'white' : 'black', moves: [] })

  for (const input of inputs) {
    const { game } = input
    if (game.startFen && positionKey(game.startFen) !== root) {
      skipped.push(input)
      continue
    }
    const id = sources.length
    sources.push({ id, page: input.page, label: input.label, ...(input.kind ? { kind: input.kind } : {}) })
    const walk = (node: MoveNode) => {
      if (maxPly !== null && node.ply >= maxPly) return
      const here = ensure(node.fen)
      for (const child of node.children) {
        const to = positionKey(child.fen)
        let move = here.moves.find((m) => m.san === child.san)
        if (!move) here.moves.push((move = { san: child.san!, to, sources: [] }))
        if (!move.sources.includes(id)) move.sources.push(id)
        ensure(child.fen)
        walk(child)
      }
    }
    walk(buildTree({ moves: game.moves, variations: game.variations, startFen: game.startFen }))
  }

  // Most-played first, then alphabetical, so the output is stable between runs.
  for (const p of Object.values(positions)) p.moves.sort((a, b) => b.sources.length - a.sources.length || a.san.localeCompare(b.san))
  return { repertoire: { version: 1, maxPly, root, sources, positions }, skipped }
}

/** Splits "1.d4 d5 2.Nf3" or "1. d4 d5 2. Nf3" into SAN moves (move numbers and "…" are ignored). */
export function parseMovePath(path: string): string[] {
  return path
    .replace(/\d+\.(\.\.)?|…/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Formats SAN moves from the start position as "1.d4 d5 2.Nf3". */
export function formatMovePath(moves: string[]): string {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}.${m}` : m)).join(' ')
}

/** Replays SAN moves from the start; returns the full FEN and the last move squares. Throws on an illegal move. */
export function replay(moves: string[]): { fen: string; lastMove?: [string, string] } {
  const game = new Chess()
  let last: [string, string] | undefined
  for (const [i, san] of moves.entries()) {
    try {
      const mv = game.move(san)
      last = [mv.from, mv.to]
    } catch {
      throw new Error(`Illegal move ${i + 1} "${san}" in "${formatMovePath(moves)}"`)
    }
  }
  return { fen: game.fen(), lastMove: last }
}

/**
 * Turns notes keyed by move path ("1.d4 d5 2.Nf3": "my note") into notes keyed by position,
 * so a note shows whichever move order reaches the position. Throws on an illegal path.
 */
export function resolveNotes(notes: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [path, note] of Object.entries(notes)) out[positionKey(replay(parseMovePath(path)).fen)] = note
  return out
}

/**
 * One move, flat. `before` + `toMove` is the unique key of the position the move is played from
 * (`before` is FEN fields 1-4: placement, side to move, castling, en passant, so it already contains
 * `toMove`). Two moves with the same key start from the same position, so their lines can merge.
 */
export type MoveRecord = {
  before: string
  toMove: 'white' | 'black'
  move: string
  after: string
  /** Source ids (see `sources`) of the lines that played this move here. */
  sources: number[]
}

export type MoveList = {
  version: 1
  keyFormat: string
  maxPly: number | null
  sources: RepertoireSource[]
  moves: MoveRecord[]
}

/** Flattens a repertoire into one record per (position, move), sorted by position key then most played. */
export function toMoveList(rep: Repertoire): MoveList {
  const moves: MoveRecord[] = []
  for (const key of Object.keys(rep.positions).sort()) {
    const p = rep.positions[key]
    for (const m of p.moves) moves.push({ before: key, toMove: p.toMove, move: m.san, after: m.to, sources: m.sources })
  }
  return {
    version: 1,
    keyFormat: 'before = FEN fields 1-4 (placement, side to move, castling, en passant); unique key = before + toMove',
    maxPly: rep.maxPly,
    sources: rep.sources,
    moves,
  }
}
