import { extractQuestions } from './mdxGames'
import { moveRuns, questionLines } from './questions'

describe('moveRuns', () => {
  it('reads numbered moves in the usual spellings', () => {
    expect(moveRuns('3 ... cxd4 — How should White answer 3 ... dxc4 instead?')).toEqual([[{ ply: 6, san: 'cxd4' }], [{ ply: 6, san: 'dxc4' }]])
    expect(moveRuns('Then 4. d5! wins')).toEqual([[{ ply: 7, san: 'd5' }]])
    expect(moveRuns('after 5 ... Qxd2+? 6 Bxd2 Nf6 7 Nxd4 Nxd5 8 ____')).toEqual([
      [{ ply: 10, san: 'Qxd2+' }, { ply: 11, san: 'Bxd2' }, { ply: 12, san: 'Nf6' }, { ply: 13, san: 'Nxd4' }, { ply: 14, san: 'Nxd5' }],
    ])
  })
  it('continues with un-numbered moves only right after a move', () => {
    expect(moveRuns('After 17.Qh5+ g6 18.Qh7+ Bg7 Black consolidates with e4')).toEqual([
      [{ ply: 33, san: 'Qh5+' }, { ply: 34, san: 'g6' }, { ply: 35, san: 'Qh7+' }, { ply: 36, san: 'Bg7' }],
    ])
  })
  it('keeps a run across a remark when the numbering continues', () => {
    expect(moveRuns('31.Nxf5 Qe5 (forced) 32.Rg7+ Kh8').flat().map((t) => t.san)).toEqual(['Nxf5', 'Qe5', 'Rg7+', 'Kh8'])
  })
  it('ignores words that only look like squares', () => {
    expect(moveRuns("opens the b2-bishop's diagonal")).toEqual([])
  })
  it('marks Black moves written without a number', () => {
    expect(moveRuns("reply to ...Nb4, threatening …Nxd3")).toEqual([[{ ply: 0, san: 'Nb4' }], [{ ply: 0, san: 'Nxd3' }]])
  })
})

describe('questionLines', () => {
  const board = { moves: ['d4', 'd5', 'Nf3', 'c5', 'dxc5', 'e6'] }
  it('branches at the move asked about and continues with the answer', () => {
    const r = questionLines('2...c5 — What about 2...Nc6 instead?', '3. c4 is strong.', [board])
    expect(r.lines).toEqual([['d4', 'd5', 'Nf3', 'c5'], ['d4', 'd5', 'Nf3', 'Nc6', 'c4']])
    expect(r.unresolved).toEqual([])
  })
  it('reports a run it cannot attach instead of guessing', () => {
    const r = questionLines('2...c5 — Why not 2...Qd6?', 'After it moves, 5. Qxd4 wins.', [board])
    expect(r.lines).toContainEqual(['d4', 'd5', 'Nf3', 'Qd6'])
    expect(r.unresolved).toEqual([[{ ply: 9, san: 'Qxd4' }]])
  })
  it('places a Black move written without a number at the move asked about', () => {
    const r = questionLines("2...c5 — What is White's reply to ...Nc6, threatening ...Nb4?", '3. c4 hits the centre.', [board])
    expect(r.lines).toContainEqual(['d4', 'd5', 'Nf3', 'Nc6', 'c4'])
    expect(r.lines).not.toContainEqual(['d4', 'd5', 'Nf3', 'c5', 'c4']) // c4 answers ...Nc6, not 2...c5
    expect(r.unresolved).toEqual([[{ ply: 4, san: 'Nb4' }]]) // the threat is illegal there, so it is reported
  })
  it('does not shift book numbering that differs from the board; it reports the question instead', () => {
    const r = questionLines('4.dxc5 — How about 4.c3 instead?', '', [board]) // board has dxc5 as move 3
    expect(r.lines).toEqual([])
    expect(r.unresolved).toHaveLength(2)
  })
  it('rejects illegal lines', () => {
    expect(questionLines('3. Nxd5?', '', [board]).lines).toEqual([])
  })
})

describe('extractQuestions', () => {
  it('splits question text and answer text', () => {
    const mdx = `<div className="qrow">\n<div className="qtext">\n<p><strong>Q1.</strong> After <code>2... c5</code>, what now?</p>\n<details className="answer">\n<summary>Show answer</summary>\n<p><code>3. c4</code> strikes.</p>\n</details>\n</div>\n</div>\n`
    expect(extractQuestions(mdx)).toEqual([{ question: 'Q1. After 2... c5, what now?', answer: '3. c4 strikes.' }])
  })
})
