import { loadStats } from './Report'

const reply = (status: number, body: string) => vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status }))
afterEach(() => vi.restoreAllMocks())

describe('loadStats', () => {
  it('asks for the period and returns the data', async () => {
    const fetch = reply(200, JSON.stringify({ empty: true, today: { neurons: 0, budget: 9500, limit: 10000 } }))
    expect(await loadStats(30)).toEqual({ status: 'ready', data: { empty: true, today: { neurons: 0, budget: 9500, limit: 10000 } } })
    expect(fetch.mock.calls[0][0]).toBe('/api/stats?days=30')
  })
  it.each([
    ['a 503', () => reply(503, '{"error":{"code":"unavailable"}}')],
    ['HTML from a server without the Worker', () => reply(200, '<!doctype html>')],
    ['JSON without today', () => reply(200, '{"days":7}')],
    ['a network failure', () => vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))],
  ])('%s is the error state', async (_, mock) => {
    mock()
    expect(await loadStats(7)).toEqual({ status: 'error' })
  })
})
