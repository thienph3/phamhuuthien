import { chapterNeighbours, type TocPart } from './privateBooks'

const load = async () => ({ default: () => null })
const toc: TocPart[] = [
  { part: 'A', chapters: [{ slug: 'a1', label: 'A1', load }, { slug: 'a2', label: 'A2', load }] },
  { part: 'B', chapters: [{ slug: 'b1', label: 'B1', load }] },
]

describe('chapterNeighbours', () => {
  it('finds previous and next across parts', () => {
    const n = chapterNeighbours(toc, 'a2')
    expect(n.prev?.slug).toBe('a1')
    expect(n.next?.slug).toBe('b1')
  })
  it('has no prev on the first chapter and no next on the last', () => {
    expect(chapterNeighbours(toc, 'a1').prev).toBeUndefined()
    expect(chapterNeighbours(toc, 'b1').next).toBeUndefined()
  })
  it('returns no chapter for an unknown slug, but still the first chapter', () => {
    const n = chapterNeighbours(toc, 'zzz')
    expect(n.chapter).toBeUndefined()
    expect(n.first?.slug).toBe('a1')
  })
})
