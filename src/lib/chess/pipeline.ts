import { Chess } from 'chess.js'
import { buildTree, type MoveNode } from './moveTree.ts'
import { positionKey, type SourcedGame } from './repertoire.ts'

/** One repertoire node. Its key is `before` + `toMove` + `move`. */
export type PipelineNode = {
  before: string
  toMove: 'white' | 'black'
  move: string
  after: string
  /** Page that first added this node. */
  addedIn: string
  /** Labels of every line that played it. */
  sources: string[]
}

export const nodeKey = (n: Pick<PipelineNode, 'before' | 'toMove' | 'move'>) => `${n.before}|${n.toMove}|${n.move}`

export type StepResult = { lines: number; nodes: number; added: number; merged: number; skipped: number; errors: string[] }

/**
 * Adds one page's lines to the repertoire. Every move is checked: the line must be legal from move 1,
 * `after` must be what the move really produces from `before`, and a key already in the repertoire must
 * lead to the same `after`. Lines from a custom start position are skipped (not reachable from move 1).
 */
export function addPage(repertoire: Map<string, PipelineNode>, page: string, lines: SourcedGame[]): StepResult {
  const r: StepResult = { lines: lines.length, nodes: 0, added: 0, merged: 0, skipped: 0, errors: [] }
  const seen = new Set<string>()
  for (const line of lines) {
    if (line.game.startFen && positionKey(line.game.startFen) !== positionKey(new Chess().fen())) {
      r.skipped++
      continue
    }
    let root: MoveNode
    try {
      root = buildTree({ moves: line.game.moves, variations: line.game.variations })
    } catch (e) {
      r.errors.push(`${line.label}: ${(e as Error).message}`)
      continue
    }
    const walk = (n: MoveNode) => {
      for (const c of n.children) {
        const before = positionKey(n.fen)
        const node = { before, toMove: (n.fen.split(' ')[1] === 'w' ? 'white' : 'black') as 'white' | 'black', move: c.san!, after: positionKey(c.fen) }
        const check = new Chess(n.fen)
        try {
          if (positionKey(check.move(node.move).after) !== node.after) r.errors.push(`${line.label}: ${node.move} from ${before} does not lead to its recorded position`)
        } catch {
          r.errors.push(`${line.label}: ${node.move} is not legal from ${before}`)
        }
        const key = nodeKey(node)
        const existing = repertoire.get(key)
        if (existing) {
          if (existing.after !== node.after) r.errors.push(`${line.label}: ${key} conflicts with ${existing.addedIn}`)
          if (!existing.sources.includes(line.label)) existing.sources.push(line.label)
          if (!seen.has(key) && existing.addedIn !== page) r.merged++
        } else {
          repertoire.set(key, { ...node, addedIn: page, sources: [line.label] })
          r.added++
        }
        if (!seen.has(key)) {
          seen.add(key)
          r.nodes++
        }
        walk(c)
      }
    }
    walk(root)
  }
  return r
}

/** Lichess win chance (0-100) for the side to move, from its centipawn score. */
export const winPct = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)

/** Engine score for the side to move: centipawns, or mate in N (negative = getting mated). */
export type Score = { cp: number } | { mate: number }

/** Centipawns used for the win-chance model; mates count as ±10000 (win chance ~100% / ~0%). */
export const scoreCp = (s: Score) => ('cp' in s ? s.cp : s.mate > 0 ? 10000 : s.mate < 0 ? -10000 : -10000)

export type Grade = 'ok' | 'inaccuracy' | 'mistake' | 'blunder'

/** Lichess thresholds, as used in the book's annotations: drop >= 10 / 20 / 30 win-chance points. */
export const grade = (drop: number): Grade => (drop >= 30 ? 'blunder' : drop >= 20 ? 'mistake' : drop >= 10 ? 'inaccuracy' : 'ok')

/**
 * Win-chance drop for the side that played the move: its chance before (best play) minus its chance after
 * the move. `before` is the score for the mover, `after` the score for the opponent (who is now to move).
 */
export const winDrop = (before: Score, after: Score) => Math.max(0, winPct(scoreCp(before)) - winPct(-scoreCp(after)))
