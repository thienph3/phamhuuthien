/** Folds one character for matching: lower case, accents removed, đ → d ("Ữ" → "u"). */
const foldChar = (ch: string): string => ch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace('đ', 'd')

/**
 * Folds a whole string and keeps a map back to the original: `map[i]` is the index in `text` (UTF-16)
 * of folded character `i`, and `map[folded.length] === text.length`. Lets matches found in the folded
 * text be highlighted at the exact original characters, accents and emoji included.
 */
export function foldWithMap(text: string): { folded: string; map: number[] } {
  let folded = ''
  const map: number[] = []
  let at = 0
  for (const ch of text) {
    const f = foldChar(ch)
    for (let i = 0; i < f.length; i++) map.push(at)
    folded += f
    at += ch.length
  }
  map.push(text.length)
  return { folded, map }
}

export const fold = (text: string): string => foldWithMap(text).folded

const STOP = new Set('a an and the of to in on at for with by is it as or i my me be was are this that from into than then'.split(' '))

/** Search words in a text: folded, split on anything that is not a letter or digit, stop words removed. */
export const tokenize = (text: string): string[] => fold(text).split(/[^a-z0-9]+/).filter((t) => t.length > 0 && !STOP.has(t))

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Where the search terms occur in `text`, as [start, end) offsets into the ORIGINAL string. A term matches
 * the start of a word and runs to the end of that word ("chat" matches "Chatbot"). Overlaps are dropped.
 */
export function matchRanges(text: string, terms: string[]): [number, number][] {
  if (terms.length === 0) return []
  const { folded, map } = foldWithMap(text)
  const re = new RegExp(`(^|[^a-z0-9])((?:${[...new Set(terms)].map(escapeRe).join('|')})[a-z0-9]*)`, 'g')
  const out: [number, number][] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(folded))) {
    const start = m.index + m[1].length
    const end = start + m[2].length
    out.push([map[start], map[end]])
    if (re.lastIndex === m.index) re.lastIndex++
  }
  return out.sort((a, b) => a[0] - b[0]).filter((r, i, all) => i === 0 || r[0] >= all[i - 1][1])
}
