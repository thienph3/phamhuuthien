import { Chess, validateFen } from 'chess.js'
import type { GameSpec } from './moveTree'

export type PgnHeaders = Record<string, string>

/** True when chess.js accepts the FEN. */
export const isValidFen = (fen: string): boolean => validateFen(fen).ok

/** Side to move ('White' | 'Black') from a FEN. */
export const sideToMove = (fen: string): 'White' | 'Black' => (fen.split(' ')[1] === 'b' ? 'Black' : 'White')

/**
 * Converts a PGN string into a GameSpec for GameViewer.
 * Keeps the main line, headers and {comments}. Variations in the PGN are dropped (chess.js limit).
 * Throws if the PGN is invalid.
 */
export function pgnToGame(pgn: string): { game: GameSpec; headers: PgnHeaders } {
  const loaded = new Chess()
  loaded.loadPgn(pgn)

  const headers: PgnHeaders = {}
  for (const [k, v] of Object.entries(loaded.header())) if (v) headers[k] = v
  const startFen = headers.SetUp === '1' && headers.FEN ? headers.FEN : undefined

  // Replay to get the FEN after each move, then attach each comment to the move it follows.
  const replay = new Chess(startFen)
  const fens: string[] = []
  const moves = loaded.history()
  for (const m of moves) {
    replay.move(m)
    fens.push(replay.fen())
  }
  const comments: Record<string, string> = {}
  for (const c of loaded.getComments()) {
    const i = fens.indexOf(c.fen)
    if (i >= 0) comments[String(i)] = c.comment
  }

  const white = headers.White ?? '?'
  const black = headers.Black ?? '?'
  const startWhite = startFen ? startFen.split(' ')[1] !== 'b' : true
  const startMove = startFen ? Number(startFen.split(' ')[5]) || 1 : 1
  return { game: { moves, comments, startFen, startWhite, startMove, caption: `${white} – ${black}` }, headers }
}
