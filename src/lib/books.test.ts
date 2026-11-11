import { books } from '@/content/site'
import { testBooks } from '@/test/fixtures'
import { filterBooks, topicsOf } from './books'

describe('filterBooks', () => {
  it('returns everything for topic all and empty query', () => {
    expect(filterBooks(testBooks, 'all', '')).toHaveLength(testBooks.length)
  })
  it('filters by topic', () => {
    expect(filterBooks(testBooks, 'chess', '').every((b) => b.topics.includes('chess'))).toBe(true)
  })
  it('matches title, author and topic text case-insensitively', () => {
    expect(filterBooks(testBooks, 'all', 'KOLTANOWSKI')).toHaveLength(1)
    expect(filterBooks(testBooks, 'all', 'english')).toHaveLength(1)
  })
  it('returns nothing when nothing matches', () => {
    expect(filterBooks(testBooks, 'all', 'zzz')).toEqual([])
  })
  it('lists unique sorted topics', () => {
    expect(topicsOf(testBooks)).toEqual(['chess', 'data', 'english', 'ml'])
  })
})

describe('book data', () => {
  it('has unique slugs', () => {
    expect(new Set(books.map((b) => b.slug)).size).toBe(books.length)
  })
})

describe('book pages', () => {
  it('every repertoire demo has a generated tree file', async () => {
    const trees = import.meta.glob('/src/content/books/*.repertoire.json')
    for (const d of books.flatMap((b) => [...(b.demos ?? []), ...(b.sections ?? []).flatMap((s) => (s.demo ? [s.demo] : []))])) if (d.type === 'repertoire') expect(trees[`/src/content/books/${d.slug}.repertoire.json`]).toBeDefined()
  })
  it('every repertoire notes file uses legal move paths', async () => {
    const files = import.meta.glob<{ notes: Record<string, string> }>('/src/content/books/*.notes.ts', { eager: true })
    const { resolveNotes } = await import('@/lib/chess/repertoire')
    for (const f of Object.values(files)) expect(() => resolveNotes(f.notes)).not.toThrow()
  })
})
