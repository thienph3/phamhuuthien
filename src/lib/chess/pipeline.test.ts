import { addPage, grade, nodeKey, winDrop, winPct, type PipelineNode } from './pipeline'

const line = (label: string, moves: string[], extra = {}) => ({ page: 'p', label, game: { moves, ...extra } })

describe('addPage', () => {
  it('adds new nodes, then merges the same nodes from a later page', () => {
    const rep = new Map<string, PipelineNode>()
    const a = addPage(rep, 'lesson01', [line('L1', ['d4', 'd5', 'Nf3'])])
    expect(a).toMatchObject({ lines: 1, nodes: 3, added: 3, merged: 0, errors: [] })
    const b = addPage(rep, 'lesson02', [line('L2', ['d4', 'd5', 'Nf3', 'Nf6'])])
    expect(b).toMatchObject({ nodes: 4, added: 1, merged: 3, errors: [] })
    const d4 = [...rep.values()].find((n) => n.move === 'd4')!
    expect(d4).toMatchObject({ toMove: 'white', addedIn: 'lesson01', sources: ['L1', 'L2'] })
    expect(d4.before.split(' ')[1]).toBe('w')
    expect(d4.after.split(' ')[1]).toBe('b')
  })
  it('merges transpositions into the same node', () => {
    const rep = new Map<string, PipelineNode>()
    addPage(rep, 'a', [line('A', ['d4', 'd5', 'Nf3', 'Nf6', 'e3'])])
    const r = addPage(rep, 'b', [line('B', ['Nf3', 'Nf6', 'd4', 'd5', 'e3'])])
    expect(r.merged).toBe(1) // e3 from the same position
    expect([...rep.values()].filter((n) => n.move === 'e3')).toHaveLength(1)
  })
  it('reports an illegal line and keeps going', () => {
    const rep = new Map<string, PipelineNode>()
    const r = addPage(rep, 'x', [line('Bad', ['d4', 'd4']), line('Good', ['e4'])])
    expect(r.errors).toEqual([expect.stringMatching(/^Bad: Illegal move #2/)])
    expect(r.added).toBe(1)
  })
  it('skips lines from a custom start position', () => {
    const rep = new Map<string, PipelineNode>()
    expect(addPage(rep, 'x', [line('Pos', ['Kd2'], { startFen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1' })]).skipped).toBe(1)
    expect(rep.size).toBe(0)
  })
  it('keys nodes by position before, side to move and move', () => {
    expect(nodeKey({ before: 'X w', toMove: 'white', move: 'd4' })).toBe('X w|white|d4')
  })
})

describe('grading', () => {
  it('uses the Lichess win-chance model', () => {
    expect(winPct(0)).toBe(50)
    expect(winPct(1000)).toBeGreaterThan(97)
  })
  it('measures the drop for the side that moved', () => {
    expect(winDrop({ cp: 30 }, { cp: -30 })).toBeCloseTo(0) // kept the same eval
    expect(winDrop({ cp: 30 }, { cp: 500 })).toBeGreaterThan(30) // opponent is now much better
    expect(winDrop({ mate: 3 }, { mate: -2 })).toBeCloseTo(0) // still mating
  })
  it('grades with 10 / 20 / 30 point thresholds', () => {
    expect([5, 10, 20, 30].map(grade)).toEqual(['ok', 'inaccuracy', 'mistake', 'blunder'])
  })
})
