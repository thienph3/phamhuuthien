import { extractGames, literalValue } from './mdxGames'
import { buildRepertoire, positionKey } from './repertoire'

const mdx = `export const metadata = { title: "t" };

# Lesson

<div><ChessGame
  caption="Some caption"
  moves={["d4", "d5", "Nf3", "Nf6"]}
  comments={{ "1": "<b>(a)</b> A secret note from the book." }}
  variations={[{ atMoveIndex: 1, moves: [\`Nf6\`, "c4"] }]}
/></div>

<ChessGame moves={["Nf3", "Nf6", "d4", "d5"]} />
`

describe('extractGames', () => {
  it('reads every ChessGame, including ones nested in HTML', () => {
    const games = extractGames(mdx)
    expect(games).toHaveLength(2)
    expect(games[0].moves).toEqual(['d4', 'd5', 'Nf3', 'Nf6'])
    expect(games[0].variations?.[0]).toEqual({ atMoveIndex: 1, moves: ['Nf6', 'c4'] })
  })
  it('refuses props that are not plain values instead of running them', () => {
    expect(() => extractGames('<ChessGame moves={makeMoves()} />')).toThrow(/Not a plain value/)
    expect(() => extractGames('<ChessGame moves={[`${x}`]} />')).toThrow(/Template literal/)
  })
  it('handles negative numbers and nested objects', () => {
    expect(extractGames('<ChessGame moves={[]} n={-2} o={{ a: [1, "b"] }} />')[0]).toMatchObject({ n: -2, o: { a: [1, 'b'] } })
    expect(() => literalValue({ type: 'Identifier', name: 'x' })).toThrow()
  })
})

describe('buildRepertoire', () => {
  const games = extractGames(mdx)
  const inputs = games.map((game, i) => ({ page: 'p', label: `Line ${i + 1}`, game }))
  const { repertoire } = buildRepertoire(inputs, 24)

  it('merges transpositions into one position', () => {
    // 1.d4 d5 2.Nf3 Nf6 and 1.Nf3 Nf6 2.d4 d5 reach the same position.
    const after = (moves: string[]) => {
      let key = repertoire.root
      for (const san of moves) key = repertoire.positions[key].moves.find((m) => m.san === san)!.to
      return key
    }
    expect(after(['d4', 'd5', 'Nf3', 'Nf6'])).toBe(after(['Nf3', 'Nf6', 'd4', 'd5']))
    const merged = repertoire.positions[after(['d4', 'd5', 'Nf3', 'Nf6'])]
    expect(merged.toMove).toBe('white')
  })
  it('counts the lines that played each move and includes variations', () => {
    const root = repertoire.positions[repertoire.root]
    expect(root.moves.map((m) => m.san).sort()).toEqual(['Nf3', 'd4'])
    const afterD4 = repertoire.positions[root.moves.find((m) => m.san === 'd4')!.to]
    expect(afterD4.moves.map((m) => m.san).sort()).toEqual(['Nf6', 'd5']) // d5 main line, Nf6 variation
  })
  it('keeps every move when there is no limit', () => {
    const long = { page: 'p', label: 'long', game: { moves: ['d4', 'd5', 'Nf3', 'Nf6', 'e3', 'e6', 'Bd3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'O-O', 'O-O', 'dxc5', 'Bxc5'] } }
    const { repertoire: all } = buildRepertoire([long])
    expect(all.maxPly).toBeNull()
    expect(Object.values(all.positions).reduce((n, p) => n + p.moves.length, 0)).toBe(16)
  })
  it('stops at maxPly', () => {
    const { repertoire: short } = buildRepertoire(inputs, 1)
    const root = short.positions[short.root]
    expect(root.moves).toHaveLength(2)
    for (const m of root.moves) expect(short.positions[m.to].moves).toEqual([])
  })
  it('skips lines that start from a custom position', () => {
    const custom = { page: 'p', label: 'x', game: { moves: ['Kd2'], startFen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1' } }
    expect(buildRepertoire([custom], 24).skipped).toEqual([custom])
  })
  it('contains moves only: no comments, captions, glyphs or HTML', () => {
    const text = JSON.stringify(repertoire)
    expect(text).not.toMatch(/secret note|Some caption|<b>|comment|caption/)
    expect(positionKey('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(repertoire.root)
  })
  it('strips annotation glyphs from moves', () => {
    const { repertoire: r } = buildRepertoire([{ page: 'p', label: 'g', game: { moves: ['e4!'] } }], 4)
    expect(r.positions[r.root].moves[0].san).toBe('e4')
  })
})

import { formatMovePath, parseMovePath, replay, resolveNotes } from './repertoire'

describe('move paths and notes', () => {
  it('parses and formats move paths', () => {
    expect(parseMovePath('1.d4 d5 2. Nf3 2...Nf6')).toEqual(['d4', 'd5', 'Nf3', 'Nf6'])
    expect(parseMovePath('1.d4 d5 2.Nf3 … Nf6')).toEqual(['d4', 'd5', 'Nf3', 'Nf6'])
    expect(formatMovePath(['d4', 'd5', 'Nf3'])).toBe('1.d4 d5 2.Nf3')
  })
  it('replays moves and reports the last move squares', () => {
    expect(replay(['d4']).lastMove).toEqual(['d2', 'd4'])
    expect(replay([]).lastMove).toBeUndefined()
    expect(() => replay(['d4', 'd4'])).toThrow(/Illegal move 2/)
  })
  it('keys notes by position so transpositions share a note', () => {
    const notes = resolveNotes({ '1.d4 d5 2.Nf3 Nf6': 'Colle setup' })
    const key = positionKey(replay(['Nf3', 'Nf6', 'd4', 'd5']).fen)
    expect(notes[key]).toBe('Colle setup')
  })
})

import { toMoveList } from './repertoire'

describe('toMoveList', () => {
  const games = [
    { page: 'a', label: 'A', game: { moves: ['d4', 'd5', 'Nf3', 'Nf6'] } },
    { page: 'b', label: 'B', game: { moves: ['Nf3', 'Nf6', 'd4', 'd5', 'e3'] } },
  ]
  const list = toMoveList(buildRepertoire(games).repertoire)

  it('has one record per position and move, with before, toMove, move and after', () => {
    const keys = list.moves.map((m) => `${m.before}|${m.toMove}|${m.move}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(list.moves[0]).toEqual(expect.objectContaining({ before: expect.any(String), toMove: expect.stringMatching(/white|black/), move: expect.any(String), after: expect.any(String) }))
  })
  it('keeps toMove consistent with the side field of the position', () => {
    for (const m of list.moves) expect(m.before.split(' ')[1]).toBe(m.toMove === 'white' ? 'w' : 'b')
  })
  it('chains: every after is the before of the next move or a line end', () => {
    const befores = new Set(list.moves.map((m) => m.before))
    const ends = list.moves.filter((m) => !befores.has(m.after))
    // A ends where B continues (same position), so the only line end is B's last move.
    expect(ends.map((m) => m.move)).toEqual(['e3'])
  })
  it('gives transposed lines the same key, so they can merge', () => {
    const e3 = list.moves.find((m) => m.move === 'e3')!
    const reachedByA = list.moves.find((m) => m.sources.includes(0) && m.move === 'Nf6')!
    expect(e3.before).toBe(reachedByA.after) // B's e3 is playable from the position line A ends in
  })
})
