import { markVia, resetVisit, sendVisit, shouldCount } from './visit'

const sent = () => {
  const send = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  return { send, body: (i: number) => JSON.parse((send.mock.calls[i][1] as RequestInit).body as string) }
}
beforeEach(() => resetVisit())

describe('visit beacon', () => {
  it('the first beacon of a page load is the visit, with the referrer host; later ones are not', () => {
    Object.defineProperty(document, 'referrer', { value: 'https://www.linkedin.com/feed/?x=1', configurable: true })
    const { send, body } = sent()
    sendVisit('/', send)
    sendVisit('/books/colle-system', send)
    expect(body(0)).toEqual({ path: '/', ref: 'www.linkedin.com', first: true, phone: false })
    expect(body(1)).toEqual({ path: '/books/colle-system', ref: '', first: false, phone: false })
    expect((send.mock.calls[0][1] as RequestInit).keepalive).toBe(true)
  })
  it('"via" counts once, and only for the page it was set for', () => {
    const { send, body } = sent()
    sendVisit('/', send)
    markVia('chat', '/books/colle-system')
    sendVisit('/books/colle-system', send)
    sendVisit('/', send)
    markVia('search', '/') // a jump within the same page: no page change follows
    sendVisit('/books/colle-system', send)
    expect(body(1).via).toBe('chat')
    expect(body(2).via).toBeUndefined()
    expect(body(3).via).toBeUndefined()
  })
  it('nothing is stored on the device', () => {
    const { send } = sent()
    sendVisit('/', send)
    expect(localStorage.length + sessionStorage.length).toBe(0)
    expect(document.cookie).toBe('')
  })
  it('automation, Global Privacy Control and Do Not Track are not counted', () => {
    expect(shouldCount({ webdriver: true } as Navigator)).toBe(false)
    expect(shouldCount({ webdriver: false, globalPrivacyControl: true } as Navigator & { globalPrivacyControl: boolean })).toBe(false)
    expect(shouldCount({ webdriver: false, doNotTrack: '1' } as Navigator)).toBe(false)
    expect(shouldCount({ webdriver: false, doNotTrack: null } as Navigator)).toBe(true)
  })
  it('a failed request is ignored', async () => {
    const send = vi.fn().mockRejectedValue(new TypeError('offline'))
    expect(() => sendVisit('/', send)).not.toThrow()
  })
})
