import { tokenize } from './text.ts'

/** One searchable section of the site. `url` is a path with an anchor, e.g. '/#experience-tiki'. */
export type SearchDoc = { id: string; page: string; section: string; title: string; text: string; url: string }

export type SearchHit = { doc: SearchDoc; score: number }
export type SearchResult = { terms: string[]; hits: SearchHit[] }

const K1 = 1.2
const B = 0.75
/** A match in the title counts this many times, so sections whose title matches rank first. */
const TITLE_WEIGHT = 2
/** At most this many words are tried for the word still being typed ("c" → chatbot, colle, …). */
const MAX_PREFIX_TERMS = 8

/**
 * Okapi BM25 over the site's sections (k1 = 1.2, b = 0.75). The last word of the query also matches as a
 * prefix, so results appear while typing.
 */
export function createIndex(docs: SearchDoc[]) {
  const entries = docs.map((doc) => {
    const words = [...Array<string[]>(TITLE_WEIGHT).fill(tokenize(doc.title)).flat(), ...tokenize(doc.section), ...tokenize(doc.text)]
    const tf = new Map<string, number>()
    for (const w of words) tf.set(w, (tf.get(w) ?? 0) + 1)
    return { doc, tf, length: words.length }
  })
  const avgLength = entries.reduce((n, e) => n + e.length, 0) / Math.max(1, entries.length)
  const df = new Map<string, number>()
  for (const e of entries) for (const w of e.tf.keys()) df.set(w, (df.get(w) ?? 0) + 1)
  const vocabulary = [...df.keys()].sort()
  const idf = (w: string) => {
    const n = df.get(w) ?? 0
    return Math.log(1 + (entries.length - n + 0.5) / (n + 0.5))
  }

  /**
   * Ranked sections for a query, best first, plus the words used (for highlighting).
   * `prefix: false` matches whole words only (the chatbot uses it; typing-as-you-go search does not).
   */
  function search(query: string, limit = 8, { prefix = true }: { prefix?: boolean } = {}): SearchResult {
    const words = tokenize(query)
    if (words.length === 0) return { terms: [], hits: [] }
    const last = words[words.length - 1]
    const groups = prefix
      ? [...words.slice(0, -1).map((w) => [w]), vocabulary.filter((v) => v.startsWith(last)).slice(0, MAX_PREFIX_TERMS)]
      : words.map((w) => [w])
    const hits = entries
      .map(({ doc, tf, length }) => {
        let score = 0
        for (const group of groups)
          for (const w of group) {
            const f = tf.get(w)
            if (f) score += (idf(w) * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * length) / avgLength))
          }
        return { doc, score }
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    // Highlight what the user typed; the last word highlights as a prefix anyway (see matchRanges).
    return { terms: words, hits }
  }

  return { search, size: entries.length }
}
