import { buildTree } from './moveTree'
import { indexTree, kingSquare, navigate } from './navigation'

const game = {
  moves: ['d4', 'd5', 'Nf3', 'Nf6'],
  variations: [{ atMoveIndex: 1, moves: ['Nf6', 'c4'] }],
}

describe('buildTree', () => {
  it('builds the main line and attaches a variation as children[1]', () => {
    const root = buildTree(game)
    expect(root.children[0].san).toBe('d4')
    expect(root.children[0].children[0].san).toBe('d5')
    expect(root.children[0].children).toHaveLength(2)
    expect(root.children[0].children[1].san).toBe('Nf6')
  })
  it('throws with a clear message on an illegal move', () => {
    expect(() => buildTree({ moves: ['d4', 'e5xx'] })).toThrow(/Illegal move #2/)
  })
  it('reads annotation glyphs off the move', () => {
    expect(buildTree({ moves: ['e4!'] }).children[0]).toMatchObject({ san: 'e4', glyph: '!' })
  })
})

describe('navigate', () => {
  const root = buildTree(game)
  const tree = indexTree(root)
  const d4 = root.children[0]
  it('goes next, prev, first and last along the main line', () => {
    expect(navigate(root, tree, root.id, 'next')).toBe(d4.id)
    expect(navigate(root, tree, d4.id, 'prev')).toBe(root.id)
    expect(navigate(root, tree, d4.id, 'first')).toBe(root.id)
    const last = navigate(root, tree, root.id, 'last')
    expect(tree.index.get(last)?.san).toBe('Nf6')
  })
  it('enters a sub-line and exits back to the move it replaces', () => {
    const d5 = d4.children[0]
    const entered = navigate(root, tree, d4.id, 'enter')
    expect(entered).toBe(d4.children[1].id)
    expect(navigate(root, tree, entered, 'exit')).toBe(d5.id)
  })
  it('stays put when there is nowhere to go', () => {
    expect(navigate(root, tree, root.id, 'exit')).toBe(root.id)
    const last = navigate(root, tree, root.id, 'last')
    expect(navigate(root, tree, last, 'next')).toBe(last)
  })
})

describe('kingSquare', () => {
  it('finds both kings in the start position', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(kingSquare(fen, 'white')).toBe('e1')
    expect(kingSquare(fen, 'black')).toBe('e8')
  })
})

import { isValidFen, pgnToGame, sideToMove } from './pgn'
// A Colle-style middlegame position, White to move.
const sampleDiagramFen = 'r1bq1rk1/pp3ppp/2nbpn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQ1RK1 w - - 5 8'

describe('pgnToGame', () => {
  const pgn = '[White "A"]\n[Black "B"]\n[Result "1-0"]\n\n1. e4 {King pawn.} e5 2. Nf3 Nc6 1-0'
  it('reads moves, comments and headers', () => {
    const { game, headers } = pgnToGame(pgn)
    expect(game.moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
    expect(game.comments).toEqual({ '0': 'King pawn.' })
    expect(headers.White).toBe('A')
    expect(game.caption).toBe('A – B')
  })
  it('produces a game the move tree accepts', () => {
    expect(() => buildTree(pgnToGame(pgn).game)).not.toThrow()
  })
  it('throws on a PGN with an illegal move', () => {
    expect(() => pgnToGame('1. e4 e4')).toThrow()
  })
})

describe('fen helpers', () => {
  it('validates FENs and reports side to move', () => {
    expect(isValidFen(sampleDiagramFen)).toBe(true)
    expect(isValidFen('nonsense')).toBe(false)
    expect(sideToMove(sampleDiagramFen)).toBe('White')
  })
})
