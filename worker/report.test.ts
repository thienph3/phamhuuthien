// @vitest-environment node
import type { Env } from './chat.ts'
import worker from './index.ts'
import { record, runCron, utcDay } from './metrics.ts'
import { checkSnapshot, clearStatsMemo, handleStats } from './stats.ts'
import { testDb } from './testDb.ts'
import { handleVisit } from './visit.ts'

const ORIGIN = 'https://phamhuuthien.thienph3.workers.dev'
const NOW = Date.UTC(2026, 10, 11, 12, 0, 0)
const TODAY = utcDay(NOW)

function setup({ gateOpen = true, answer = { response: 'Thien leads seven ML engineers.', usage: { prompt_tokens: 1500, completion_tokens: 150 } } as unknown } = {}) {
  const { db, sqlite, state } = testDb()
  const pending: Promise<unknown>[] = []
  const calls = { model: 0, gate: 0 }
  const lim = (ok: boolean, count = false) => ({ limit: async () => (count && calls.gate++, { success: ok }) })
  const env: Env = {
    DB: db,
    AI: { run: async () => (calls.model++, answer) },
    CHAT_IP_LIMIT: lim(true),
    CHAT_GLOBAL_LIMIT: lim(true),
    WRITE_IP_LIMIT: lim(gateOpen, true),
    WRITE_GLOBAL_LIMIT: lim(gateOpen),
    ASSETS: { fetch: async () => new Response('asset') },
  }
  const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p) }
  const flush = () => Promise.all(pending.splice(0))
  const hasTable = () => !!sqlite.prepare("SELECT 1 FROM sqlite_master WHERE name = 'daily'").get()
  const rows = () => (hasTable() ? sqlite.prepare('SELECT metric, dim, value FROM daily ORDER BY metric, dim').all().map((r) => ({ ...r })) : [])
  return { env, ctx, flush, rows, sqlite, state, calls }
}

const beacon = (body: unknown, headers: Record<string, string> = {}, raw?: string) =>
  Object.assign(
    new Request(`${ORIGIN}/api/visit`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '203.0.113.9', ...headers },
      body: raw ?? JSON.stringify(body),
    }),
    { cf: { country: 'VN' } },
  )
const chat = (content: string) =>
  new Request(`${ORIGIN}/api/chat`, {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9' },
    body: JSON.stringify({ messages: [{ role: 'user', content }] }),
  })
const FIRST = { path: '/', ref: 'www.linkedin.com', first: true, phone: true }

describe('POST /api/visit', () => {
  it('a first view writes view, visit, country, device and referrer (5 rows)', async () => {
    const t = setup()
    const r = await handleVisit(beacon(FIRST), t.env, { waitUntil: t.ctx.waitUntil, now: () => NOW })
    await t.flush()
    expect(r.status).toBe(204)
    expect(r.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(t.rows()).toEqual([
      { metric: 'country', dim: 'VN', value: 1 },
      { metric: 'device', dim: 'phone', value: 1 },
      { metric: 'ref', dim: 'linkedin', value: 1 },
      { metric: 'view', dim: 'home', value: 1 },
      { metric: 'visit', dim: '', value: 1 },
    ])
  })
  it('a later view writes the view and how it was opened (≤ 2 rows)', async () => {
    const t = setup()
    await handleVisit(beacon({ path: '/books/colle-system', ref: '', first: false, phone: false, via: 'chat' }), t.env, { waitUntil: t.ctx.waitUntil, now: () => NOW })
    await t.flush()
    expect(t.rows()).toEqual([{ metric: 'via', dim: 'chat', value: 1 }, { metric: 'view', dim: 'book:colle-system', value: 1 }])
  })
  it.each([
    ['foreign origin', FIRST, { Origin: 'https://evil.example' }, undefined],
    ['cross-site', FIRST, { 'Sec-Fetch-Site': 'cross-site' }, undefined],
    ['not JSON', FIRST, { 'Content-Type': 'text/plain' }, undefined],
    ['bad JSON', null, {}, '{oops'],
    ['over 1 KB', null, {}, JSON.stringify({ ...FIRST, ref: 'a'.repeat(1100) })],
    ['extra key', { ...FIRST, note: 'hi' }, {}, undefined],
    ['wrong type', { ...FIRST, first: 'yes' }, {}, undefined],
    ['bad via', { ...FIRST, first: false, via: 'evil' }, {}, undefined],
    ['path not a string', { ...FIRST, path: ['/'] }, {}, undefined],
  ])('%s → the same 204, nothing written', async (_, body, headers, raw) => {
    const t = setup()
    const r = await handleVisit(beacon(body, headers, raw), t.env, { waitUntil: t.ctx.waitUntil, now: () => NOW })
    await t.flush()
    expect(r.status).toBe(204)
    expect(await r.text()).toBe('')
    expect(t.rows()).toEqual([])
  })
  it('visitor text can never become a report key', async () => {
    const t = setup()
    for (const [path, ref] of [['/books/<script>alert(1)</script>', 'visit-evil.com'], ['/visit evil.com', 'google.com.evil.com'], ['/books/colle-system', 'Evil Text']])
      await handleVisit(beacon({ path, ref, first: true, phone: false }), t.env, { waitUntil: t.ctx.waitUntil, now: () => NOW })
    await t.flush()
    const dims = new Set(t.rows().map((r) => r.dim))
    expect([...dims].sort()).toEqual(['', 'VN', 'book:colle-system', 'desktop', 'other'])
  })
  it('over the write gate nothing is written; GET → 405', async () => {
    const t = setup({ gateOpen: false })
    expect((await handleVisit(beacon(FIRST), t.env, { waitUntil: t.ctx.waitUntil })).status).toBe(204)
    await t.flush()
    expect(t.rows()).toEqual([])
    expect((await handleVisit(new Request(`${ORIGIN}/api/visit`), t.env)).status).toBe(405)
  })
  it('a D1 failure is swallowed (the page never notices)', async () => {
    const t = setup()
    t.state.fail = true
    const logged: string[] = []
    expect((await handleVisit(beacon(FIRST), t.env, { waitUntil: t.ctx.waitUntil, log: (c) => logged.push(c) })).status).toBe(204)
    await t.flush()
    expect(logged).toEqual(['metrics_error'])
  })
})

describe('chat metrics', () => {
  it('an answer records outcome, Neurons from usage, latency and topics (not gated)', async () => {
    const t = setup({ gateOpen: false })
    await worker.fetch(chat('Has he led a team?'), t.env, t.ctx)
    await t.flush()
    const rows = t.rows()
    expect(rows.find((r) => r.metric === 'chat')).toEqual({ metric: 'chat', dim: 'answered', value: 1 })
    expect(Math.round(rows.find((r) => r.metric === 'neurons')!.value as number)).toBe(71)
    expect(rows.filter((r) => r.metric === 'latency')).toEqual([{ metric: 'latency', dim: 'lt2', value: 1 }])
    expect(rows.filter((r) => r.metric === 'topic').length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThanOrEqual(8)
  })
  it('1,000 "hi" requests write only what the gate allows', async () => {
    const t = setup()
    let open = 20
    t.env.WRITE_IP_LIMIT = { limit: async () => ({ success: open-- > 0 }) }
    for (let i = 0; i < 1000; i++) await worker.fetch(chat('hi'), t.env, t.ctx)
    await t.flush()
    expect(t.rows()).toEqual([{ metric: 'chat', dim: 'small_talk', value: 20 }])
    expect(t.calls.model).toBe(0)
  })
  it('stops with "quota" before the model once the own budget is reached', async () => {
    const t = setup()
    await record(t.env.DB!, [['neurons', '', 9500]], Date.now())
    const r = await worker.fetch(chat('Has he led a team?'), t.env, t.ctx)
    expect(r.status).toBe(429)
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe('quota')
    expect(t.calls.model).toBe(0)
  })
  it('D1 down: the chat still answers', async () => {
    const t = setup()
    t.state.fail = true
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = await worker.fetch(chat('Has he led a team?'), t.env, t.ctx)
    await t.flush()
    expect(r.status).toBe(200)
    expect(t.calls.model).toBe(1)
    spy.mockRestore()
  })
})

describe('GET /api/stats', () => {
  beforeEach(() => clearStatsMemo())
  const get = (q: string, method = 'GET') => new Request(`${ORIGIN}/api/stats${q}`, { method })

  it.each(['', '?days=14', '?days=7&x=1', '?days=7&days=30', '?days=07', '?Days=7'])('"%s" → 400', async (q) => {
    expect((await handleStats(get(q), setup().env)).status).toBe(400)
  })
  it('HEAD and POST → 405', async () => {
    for (const m of ['HEAD', 'POST']) expect((await handleStats(get('?days=7', m), setup().env)).status).toBe(405)
  })
  it('before the first cron run: empty, with today’s quota', async () => {
    const t = setup()
    const r = await handleStats(get('?days=7'), t.env, { now: () => NOW })
    expect(await r.json()).toEqual({ empty: true, today: { neurons: 0, budget: 9500, limit: 10000 } })
    expect(r.headers.get('Cache-Control')).toBe('no-store')
  })
  it('serves the cron snapshot with 2 row reads, memoized for 60 s', async () => {
    const t = setup()
    await record(t.env.DB!, [['view', 'home', 4], ['neurons', '', 210]], NOW)
    await runCron(t.env.DB!, NOW, new Map(), () => {})
    t.state.reads = 0
    const r = await handleStats(get('?days=30'), t.env, { now: () => NOW })
    const body = (await r.json()) as { days: number; current: { views: number }; today: { neurons: number }; builtAt: string }
    expect(body.days).toBe(30)
    expect(body.current.views).toBe(4)
    expect(body.today.neurons).toBe(210)
    expect(typeof body.builtAt).toBe('string')
    expect(t.state.reads).toBe(2)
    expect(r.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff')
    await handleStats(get('?days=30'), t.env, { now: () => NOW + 30_000 })
    expect(t.state.reads).toBe(2)
  })
  it('a tampered snapshot is never served', async () => {
    const t = setup()
    await runCron(t.env.DB!, NOW, new Map(), () => {})
    const snap = JSON.parse(t.sqlite.prepare('SELECT json FROM snapshot WHERE days = 7').get()!.json as string)
    snap.top.refs = [['visit evil.com', 99]]
    t.sqlite.prepare('UPDATE snapshot SET json = ? WHERE days = 7').run(JSON.stringify(snap))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await handleStats(get('?days=7'), t.env, { now: () => NOW })).status).toBe(503)
    spy.mockRestore()
    expect(checkSnapshot(snap, 7)).toBe(false)
  })
  it('a D1 failure is a 503 and is not memoized', async () => {
    const t = setup()
    await runCron(t.env.DB!, NOW, new Map(), () => {})
    t.state.fail = true
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await handleStats(get('?days=7'), t.env, { now: () => NOW })).status).toBe(503)
    t.state.fail = false
    expect((await handleStats(get('?days=7'), t.env, { now: () => NOW })).status).toBe(200)
    spy.mockRestore()
  })
})

describe('routing and cron', () => {
  it('routes /api/visit and /api/stats; the cron builds snapshots', async () => {
    const t = setup()
    expect((await worker.fetch(beacon(FIRST), t.env, t.ctx)).status).toBe(204)
    await t.flush()
    await worker.scheduled({ scheduledTime: Date.now() }, t.env, t.ctx)
    await t.flush()
    clearStatsMemo()
    const r = await worker.fetch(new Request(`${ORIGIN}/api/stats?days=7`), t.env, t.ctx)
    expect(((await r.json()) as { current: { visits: number } }).current.visits).toBe(1)
    expect(TODAY).toMatch(/^\d{4}-/)
  })
})
