import { findTextRanges, HIGHLIGHT_NAME, setNativeHighlight, supportsNativeHighlight } from './highlight'

const page = (html: string) => {
  const root = document.createElement('main')
  root.innerHTML = html
  document.body.append(root)
  return root
}

describe('findTextRanges', () => {
  it('finds every match in the visible text, across elements', () => {
    const root = page('<h2>Chatbot answers</h2><p>The <b>chatbot</b>’s pipeline.</p>')
    expect(findTextRanges(root, ['chatbot']).map((r) => r.toString())).toEqual(['Chatbot', 'chatbot'])
  })
  it('skips form fields, hidden text and anything marked data-search-ignore', () => {
    const root = page('<p>chatbot</p><div data-search-ignore><p>chatbot</p></div><span aria-hidden="true">chatbot</span><textarea>chatbot</textarea>')
    expect(findTextRanges(root, ['chatbot'])).toHaveLength(1)
  })
  it('does not change the page', () => {
    const root = page('<p>Phạm Hữu Thiên</p>')
    const before = root.innerHTML
    expect(findTextRanges(root, ['thien']).map((r) => r.toString())).toEqual(['Thiên'])
    expect(root.innerHTML).toBe(before)
  })
})

describe('native highlight', () => {
  afterEach(() => {
    // @ts-expect-error test stubs
    delete globalThis.Highlight
  })
  it('is only used when the browser supports it', () => {
    expect(supportsNativeHighlight()).toBe(false) // jsdom has no CSS Custom Highlight API
  })
  it('registers the ranges under one name, and clears it when there are none', () => {
    const registry = new Map<string, { ranges: Range[] }>()
    vi.stubGlobal('CSS', { highlights: registry })
    vi.stubGlobal('Highlight', class { ranges: Range[]; constructor(...r: Range[]) { this.ranges = r } })
    expect(supportsNativeHighlight()).toBe(true)
    const root = page('<p>chatbot chatbot</p>')
    setNativeHighlight(findTextRanges(root, ['chatbot']))
    expect(registry.get(HIGHLIGHT_NAME)?.ranges).toHaveLength(2)
    setNativeHighlight([])
    expect(registry.has(HIGHLIGHT_NAME)).toBe(false)
    vi.unstubAllGlobals()
  })
})
