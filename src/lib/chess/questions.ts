import { Chess } from 'chess.js'
import type { GameSpec } from './moveTree.ts'

/**
 * A move found in text: half-move number from the start (1 = White's first move) and SAN.
 * `ply` is 0 for a Black move written without a number ("...Nb4"); questionLines places it.
 */
export type MoveToken = { ply: number; san: string }

const SAN = String.raw`(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h](?:x[a-h])?[1-8](?:=[QRBN])?)[+#]?`
const NUMBERED = new RegExp(String.raw`^(\d{1,3})\s*(\.{3}|…|\.)?\s*(${SAN})[!?]*$`)
const BARE = new RegExp(String.raw`^(${SAN})[!?]*$`)
const BLACK_UNNUMBERED = new RegExp(String.raw`^(?:\.{3}|…)(${SAN})[!?]*$`)

/**
 * Finds runs of consecutive moves in prose, e.g. "After 17.Qh5+ g6 18.Qh7+ Bg7 Black…" gives one run of
 * four moves. A numbered move ("17.Qh5+", "3 ... cxd4", "6 Bxd2") starts or continues a run; an un-numbered
 * move counts only directly after another move. Any other word ends the run, unless the next numbered
 * move continues straight on (so "Qe5 (forced) 32.Rg7+" stays one run).
 */
export function moveRuns(text: string): MoveToken[][] {
  // Join "3 ... cxd4" / "4. d5" / "17.Qh5+" into single words first.
  const words = text
    .replace(/(\d{1,3})\s*(\.{3}|…|\.)\s+(?=[KQRBNOa-h])/g, '$1$2')
    .replace(/(\d{1,3})\s+(?=[KQRBNa-h][a-h1-8x]|O-O)/g, '$1 ')
    .split(/\s+/)
    .map((w) => w.replace(/^[("'“]+|[)"'”,;:.]+$/g, (m) => (m.startsWith('.') && /\d\.$/.test(w) ? m : '')))
  const runs: MoveToken[][] = []
  let run: MoveToken[] = []
  let broken = true
  const push = (t: MoveToken) => {
    const last = run[run.length - 1]
    if (last && t.ply === last.ply + 1) run.push(t)
    else {
      if (run.length) runs.push(run)
      run = [t]
    }
    broken = false
  }
  for (let i = 0; i < words.length; i++) {
    let w = words[i]
    // "6 Bxd2" arrives as two words: a bare number followed by a move.
    if (/^\d{1,3}$/.test(w) && words[i + 1] && BARE.test(words[i + 1])) w = `${w} ${words[++i]}`
    const n = w.match(NUMBERED)
    if (n) {
      push({ ply: Number(n[1]) * 2 - (n[2] && n[2] !== '.' ? 0 : 1), san: n[3] })
      continue
    }
    const u = w.match(BLACK_UNNUMBERED)
    if (u) {
      // "...Nb4": its own run; the move number is unknown until the question's anchor is found.
      if (run.length) runs.push(run)
      runs.push([{ ply: 0, san: u[1] }])
      run = []
      broken = true
      continue
    }
    const b = w.match(BARE)
    if (b && !broken && run.length) {
      push({ ply: run[run.length - 1].ply + 1, san: b[1] })
      continue
    }
    broken = true
  }
  if (run.length) runs.push(run)
  return runs
}

const strip = (san: string) => san.replace(/[!?]+$/, '')

/** Main-line SAN moves of a board (glyphs removed), or undefined for boards that start from a custom position. */
const mainLine = (g: GameSpec) => (g.startFen ? undefined : g.moves.map(strip))

const legal = (moves: string[]) => {
  const c = new Chess()
  try {
    for (const m of moves) c.move(m)
    return true
  } catch {
    return false
  }
}

export type QuestionLines = { lines: string[][]; unresolved: MoveToken[][] }

/**
 * Turns one question + answer into full lines from move 1, branching off the lesson boards.
 * A run is accepted only if it (a) continues the previous accepted line with no gap, or (b) starts on a
 * board's main line at the move the question is about (the anchor) or the move right after it, or
 * (c) starts with the board's own main-line move. Every line is checked for legality from move 1.
 * Runs that fit none of these are returned in `unresolved` instead of being guessed.
 */
export function questionLines(question: string, answer: string, boards: GameSpec[]): QuestionLines {
  const raw = [...moveRuns(question), ...moveRuns(answer)]
  const mains = boards.map(mainLine).filter((m): m is string[] => !!m)
  const first = raw.find((r) => r[0].ply > 0)?.[0]

  // For each board, the question's first numbered move must sit on its main line at the stated number.
  // (Shifting numbers to make a question fit was tried and attached answers to the wrong position, so a
  // question whose numbering does not match the board is left unattached.)
  const anchorsFor = (main: string[]): number[] => (first && strip(main[first.ply - 1] ?? '') === strip(first.san) ? [0] : [])
  const candidates = mains.flatMap((main) => anchorsFor(main).map((shift) => ({ main, shift })))
  if (!first || candidates.length === 0) candidates.push(...mains.map((main) => ({ main, shift: 0 })))

  let best: QuestionLines = { lines: [], unresolved: raw }
  for (const { main, shift } of candidates) {
    const anchor = first && strip(main[first.ply + shift - 1] ?? '') === strip(first.san) ? first.ply + shift : undefined
    // Place "...X" (Black, no number) at the anchor if the anchor is a Black move, else right after it.
    const runs = raw.flatMap((r) => {
      if (r[0].ply > 0) return [r.map((t) => ({ ...t, ply: t.ply + shift }))]
      if (anchor === undefined) return [r]
      return [r.map((t) => ({ ...t, ply: anchor % 2 === 0 ? anchor : anchor + 1 }))]
    })
    const lines: string[][] = []
    const unresolved: MoveToken[][] = []
    let current: string[] | undefined
    for (const r of runs) {
      const sans = r.map((t) => strip(t.san))
      const start = r[0].ply
      if (start < 1) {
        unresolved.push(r)
        continue
      }
      if (current && start === current.length + 1 && legal([...current, ...sans])) {
        current.push(...sans)
        continue
      }
      const onMain = strip(main[start - 1] ?? '') === sans[0]
      const nearAnchor = anchor !== undefined && (start === anchor || start === anchor + 1)
      const candidate = [...main.slice(0, start - 1), ...sans]
      if ((onMain || nearAnchor) && start - 1 <= main.length && legal(candidate)) {
        current = candidate
        lines.push(current)
      } else unresolved.push(r)
    }
    const better = unresolved.length < best.unresolved.length || (unresolved.length === best.unresolved.length && lines.length > best.lines.length)
    if (better) best = { lines, unresolved }
    if (unresolved.length === 0) break
  }
  return best
}
