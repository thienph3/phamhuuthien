import { fold, foldWithMap, matchRanges, tokenize } from './text'

describe('fold', () => {
  it('ignores case and Vietnamese accents', () => {
    expect(fold('Phạm Hữu Thiên')).toBe('pham huu thien')
    expect(fold('Đà Nẵng')).toBe('da nang')
  })
  it('maps folded characters back to the original string, emoji included', () => {
    const { folded, map } = foldWithMap('a😀Ữb')
    expect(folded).toBe('a😀ub')
    expect(map[folded.indexOf('u')]).toBe(3)
    expect(map[folded.length]).toBe(5)
  })
})

describe('tokenize', () => {
  it('splits on punctuation and drops stop words', () => {
    expect(tokenize('The eKYC service, at FE Credit!')).toEqual(['ekyc', 'service', 'fe', 'credit'])
  })
})

describe('matchRanges', () => {
  it('finds word starts and returns offsets in the original text', () => {
    const text = 'Chatbot: the chatbot’s pipeline'
    expect(matchRanges(text, ['chat']).map(([s, e]) => text.slice(s, e))).toEqual(['Chatbot', 'chatbot'])
  })
  it('matches without accents but highlights the accented original', () => {
    const text = 'Tôi là Phạm Hữu Thiên.'
    expect(matchRanges(text, ['huu', 'thien']).map(([s, e]) => text.slice(s, e))).toEqual(['Hữu', 'Thiên'])
  })
  it('does not match inside a word', () => {
    expect(matchRanges('database', ['base'])).toEqual([])
  })
  it('returns nothing for no terms', () => {
    expect(matchRanges('anything', [])).toEqual([])
  })
})
