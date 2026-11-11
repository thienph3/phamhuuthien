import { createIndex, type SearchDoc } from './bm25'

const doc = (id: string, title: string, text: string): SearchDoc => ({ id, page: 'Home', section: 'Test', title, text, url: `/#${id}` })
const docs = [
  doc('chat', 'Chatbot answers faster', 'I added ML models to the chatbot pipeline.'),
  doc('lead', 'Leading a team', 'I lead seven ML engineers, including on the chatbot.'),
  doc('etl', 'ELT platform', 'One YAML file brings a new source into the warehouse.'),
  doc('long', 'Notes', 'chatbot ' + 'filler '.repeat(200)),
]
const { search } = createIndex(docs)

describe('BM25 search', () => {
  it('ranks a section whose title matches above one that only mentions the word', () => {
    expect(search('chatbot').hits.map((h) => h.doc.id).slice(0, 2)).toEqual(['chat', 'lead'])
  })
  it('scores short sections above long ones for the same single mention (length normalisation)', () => {
    const ids = search('chatbot').hits.map((h) => h.doc.id)
    expect(ids.indexOf('lead')).toBeLessThan(ids.indexOf('long'))
  })
  it('matches the word being typed as a prefix', () => {
    expect(search('yam').hits[0].doc.id).toBe('etl')
  })
  it('only treats the last word as a prefix ("yam" adds nothing when it is not last)', () => {
    expect(search('yam file').hits[0].score).toBeCloseTo(search('file').hits[0].score)
  })
  it('combines words', () => {
    expect(search('ml chatbot').hits[0].doc.id).toBe('chat')
  })
  it('returns no hits for stop words, blanks or unknown words', () => {
    expect(search('the').hits).toEqual([])
    expect(search('   ').hits).toEqual([])
    expect(search('zzzz').hits).toEqual([])
  })
  it('returns the query words for highlighting', () => {
    expect(search('ML Chatbot').terms).toEqual(['ml', 'chatbot'])
  })
})
