// @vitest-environment node
import { readFileSync } from 'node:fs'
import { addDays, buildSnapshot, ensureSchema, gate, latencyBucket, neuronsFor, record, runCron, todayNeurons, topRows, utcDay } from './metrics.ts'
import { testDb } from './testDb.ts'

const NOW = Date.UTC(2026, 10, 11, 12, 0, 0)
const TODAY = '2026-11-11'
const TITLES = new Map([['about', 'Hi, I’m Thien'], ['contact', 'Let’s talk']])
const limit = (ok: boolean) => ({ limit: async () => ({ success: ok }) })
const all = (db: ReturnType<typeof testDb>['sqlite']) => db.prepare('SELECT day, metric, dim, value FROM daily ORDER BY day, metric, dim').all()

describe('record', () => {
  it('adds to the day’s counters in one batch, one row written per counter', async () => {
    const { db, sqlite, state } = testDb()
    await record(db, [['view', 'home', 1], ['visit', '', 1]], NOW)
    await record(db, [['view', 'home', 1], ['neurons', '', 104.5]], NOW)
    expect(all(sqlite)).toEqual([
      { day: TODAY, metric: 'neurons', dim: '', value: 104.5 },
      { day: TODAY, metric: 'view', dim: 'home', value: 2 },
      { day: TODAY, metric: 'visit', dim: '', value: 1 },
    ])
    expect(state.writes).toBe(4) // WITHOUT ROWID: one row per upsert
  })
  it('creates the schema once per database', async () => {
    const { db, state } = testDb()
    await Promise.all([ensureSchema(db), ensureSchema(db), record(db, [['view', 'home', 1]], NOW)])
    expect(state.sql.filter((s) => s.startsWith('CREATE TABLE IF NOT EXISTS daily'))).toHaveLength(1)
  })
  it('a failed batch writes nothing', async () => {
    const { db, sqlite } = testDb()
    await ensureSchema(db)
    await expect(db.batch([db.prepare('INSERT INTO daily VALUES (?1, ?2, ?3, ?4)').bind(TODAY, 'view', 'home', 1), db.prepare('INSERT INTO nope VALUES (1)')])).rejects.toThrow()
    expect(all(sqlite)).toEqual([])
  })
})

describe('gate', () => {
  it('needs both the per-IP and the global limit, and checks the IP first', async () => {
    const calls: string[] = []
    const lim = (ok: boolean) => ({ limit: async ({ key }: { key: string }) => (calls.push(key), { success: ok }) })
    expect(await gate({ WRITE_IP_LIMIT: lim(true), WRITE_GLOBAL_LIMIT: lim(true) }, '1.2.3.4')).toBe(true)
    expect(await gate({ WRITE_IP_LIMIT: lim(false), WRITE_GLOBAL_LIMIT: lim(true) }, '1.2.3.4')).toBe(false)
    expect(await gate({ WRITE_IP_LIMIT: lim(true), WRITE_GLOBAL_LIMIT: lim(false) }, '1.2.3.4')).toBe(false)
    expect(calls).toEqual(['ip:1.2.3.4', 'global', 'ip:1.2.3.4', 'ip:1.2.3.4', 'global'])
  })
  it('is closed when a binding is missing or throws', async () => {
    expect(await gate({}, 'x')).toBe(false)
    expect(await gate({ WRITE_IP_LIMIT: { limit: async () => { throw new Error('down') } }, WRITE_GLOBAL_LIMIT: limit(true) }, 'x')).toBe(false)
  })
})

describe('todayNeurons', () => {
  it('reads today’s value, 0 when nothing yet', async () => {
    const { db } = testDb()
    await record(db, [['view', 'home', 1]], NOW)
    expect(await todayNeurons(db, NOW)).toBe(0)
    await record(db, [['neurons', '', 3712.4]], NOW)
    expect(await todayNeurons(db, NOW)).toBe(3712.4)
  })
  it('is undefined when D1 fails or is slow, so the chat skips its check', async () => {
    const { db, state } = testDb()
    expect(await todayNeurons(db, NOW)).toBeUndefined() // no table yet
    state.fail = true
    expect(await todayNeurons(db, NOW)).toBeUndefined()
    state.fail = 'slow'
    const t = Date.now()
    expect(await todayNeurons(db, NOW, 50)).toBeUndefined()
    expect(Date.now() - t).toBeLessThan(1000)
  })
})

describe('helpers', () => {
  it('Neurons from tokens use the 70B model rates', () => {
    expect(neuronsFor(1_000_000, 0)).toBe(26_668)
    expect(neuronsFor(0, 1_000_000)).toBe(204_805)
    expect(Math.round(neuronsFor(1500, 150))).toBe(71)
  })
  it.each([[100, 'lt2'], [1999, 'lt2'], [2000, '2to5'], [7000, '5to10'], [12000, 'gt10']])('%i ms → %s', (ms, b) => expect(latencyBucket(ms)).toBe(b))
  it('dates are UTC days', () => {
    expect(utcDay(Date.UTC(2026, 10, 11, 23, 59))).toBe('2026-11-11')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('top rows fold small counts, unknown keys and the tail into other', () => {
    const counts = new Map([['VN', 50], ['US', 9], ['JP', 2], ['evil text', 40], ['SG', 3], ['other', 1], ...'ABCDEFG'.split('').map((c, i): [string, number] => [`K${c}`, 4 + i])])
    const rows = topRows(counts, (k) => k !== 'evil text')
    expect(rows.slice(0, 2)).toEqual([['VN', 50], ['KG', 10]])
    expect(rows).toHaveLength(7)
    expect(rows.at(-1)).toEqual(['other', 2 + 40 + 1 + 3 + 4 + 5 + 6]) // JP, evil text, other, SG, KA, KB, KC
    expect(rows.flat().filter((x) => x === 'evil text')).toEqual([])
  })
})

describe('buildSnapshot', () => {
  const day = (n: number) => addDays(TODAY, n)
  const rows = [
    { day: day(0), metric: 'view', dim: 'home', value: 10 },
    { day: day(-1), metric: 'view', dim: 'home', value: 20 },
    { day: day(-1), metric: 'view', dim: 'book:colle-system', value: 5 },
    { day: day(0), metric: 'view', dim: 'book:colle-system', value: 99 }, // today: not in top tables
    { day: day(-1), metric: 'visit', dim: '', value: 12 },
    { day: day(-1), metric: 'chat', dim: 'answered', value: 4 },
    { day: day(-1), metric: 'chat', dim: 'small_talk', value: 2 },
    { day: day(-1), metric: 'chat', dim: 'rate_limited', value: 1 },
    { day: day(-1), metric: 'chat', dim: 'quota', value: 1 },
    { day: day(-1), metric: 'neurons', dim: '', value: 420 },
    { day: day(-1), metric: 'latency', dim: '2to5', value: 3 },
    { day: day(-1), metric: 'latency', dim: 'gt10', value: 1 },
    { day: day(-1), metric: 'latency_ms', dim: '', value: 20000 },
    { day: day(-1), metric: 'topic', dim: 'about', value: 3 },
    { day: day(-1), metric: 'topic', dim: 'contact', value: 1 },
    { day: day(-1), metric: 'country', dim: 'VN', value: 9 },
    { day: day(-1), metric: 'country', dim: 'US', value: 2 },
    { day: day(-1), metric: 'device', dim: 'phone', value: 5 },
    { day: day(-1), metric: 'via', dim: 'chat', value: 2 },
    { day: day(-8), metric: 'view', dim: 'home', value: 7 }, // previous 7-day period
    { day: day(-200), metric: 'view', dim: 'home', value: 1000 }, // older than retention: ignored
  ]
  it('builds the series, totals, previous period, buckets and top tables', () => {
    const s = buildSnapshot(rows, 7, TODAY, TITLES)
    expect(s.from).toBe(day(-6))
    expect(s.series).toHaveLength(7)
    expect(s.series.at(-2)).toMatchObject({ day: day(-1), views: 25, visits: 12, answered: 4, smallTalk: 2, limited: 2, neurons: 420 })
    expect(s.current).toMatchObject({ views: 134, visits: 12, questions: 8, answered: 4, smallTalk: 2, neurons: 420, latencyMs: 20000 })
    expect(s.previous.views).toBe(7)
    expect(s.latency).toEqual({ lt2: 0, '2to5': 3, '5to10': 0, gt10: 1 })
    expect(s.top.pages).toEqual([['home', 20], ['book:colle-system', 5]])
    expect(s.top.topics).toEqual([['Hi, I’m Thien', 3], ['other', 1]])
    expect(s.top.countries).toEqual([['VN', 9], ['other', 2]])
    expect(s.devices).toEqual({ phone: 5, desktop: 0 })
    expect(s.via).toEqual({ search: 0, chat: 2 })
    expect(s.since).toBe(day(-8))
  })
  it('the 90-day period has no previous period (retention)', () => {
    expect(buildSnapshot(rows, 90, TODAY, TITLES).previous.views).toBe(0)
  })
})

describe('runCron', () => {
  it('saves three snapshots from one read and deletes days older than 90', async () => {
    const { db, sqlite, state } = testDb()
    await record(db, [['view', 'home', 3]], NOW)
    await record(db, [['view', 'home', 5]], Date.UTC(2026, 6, 1)) // > 90 days ago
    state.sql = []
    await runCron(db, NOW, TITLES, () => {})
    expect(state.sql.filter((s) => s.startsWith('SELECT'))).toHaveLength(1)
    const snaps = sqlite.prepare('SELECT days, built_at FROM snapshot ORDER BY days').all()
    expect(snaps.map((r) => r.days)).toEqual([7, 30, 90])
    expect(all(sqlite)).toEqual([{ day: TODAY, metric: 'view', dim: 'home', value: 3 }])
  })
  it('saves each period on its own: one failed save keeps that period’s old snapshot, the rest and the prune still run', async () => {
    const { db, sqlite } = testDb()
    await runCron(db, NOW, TITLES, () => {})
    await record(db, [['view', 'home', 1]], Date.UTC(2026, 6, 1)) // old row, to be pruned
    const old = sqlite.prepare('SELECT days, built_at FROM snapshot ORDER BY days').all().map((r) => ({ ...r }))
    const flaky = { ...db, prepare: (sql: string) => {
      const st = db.prepare(sql)
      return sql.startsWith('INSERT INTO snapshot') ? { ...st, bind: (...v: unknown[]) => (v[0] === 30 ? { ...st.bind(...v), run: () => Promise.reject(new Error('D1_ERROR')) } : st.bind(...v)) } : st
    } }
    const logged: string[] = []
    await runCron(flaky, NOW + 900_000, TITLES, (c) => logged.push(c))
    const now = sqlite.prepare('SELECT days, built_at FROM snapshot ORDER BY days').all().map((r) => ({ ...r }))
    expect(logged).toEqual(['snapshot_30_error'])
    expect(now[1]).toEqual(old[1])
    expect(now[0].built_at).not.toBe(old[0].built_at)
    expect(now[2].built_at).not.toBe(old[2].built_at)
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM daily WHERE day < ?').get('2026-08-14')!.n).toBe(0)
  })
  it('keeps the previous snapshots when the read fails', async () => {
    const { db, sqlite, state } = testDb()
    await runCron(db, NOW, TITLES, () => {})
    const before = sqlite.prepare('SELECT built_at FROM snapshot WHERE days = 7').get()
    state.fail = true
    await expect(runCron(db, NOW + 900_000, TITLES, () => {})).rejects.toThrow()
    state.fail = false
    expect(sqlite.prepare('SELECT built_at FROM snapshot WHERE days = 7').get()).toEqual(before)
  })
})

describe('cron CPU (Free plan: 10 ms per run, plan S-C2-3)', () => {
  it('builds all three snapshots from a full 90-day table (≈ 110 keys a day) in a few ms', () => {
    const keys = [
      ...['home', 'report', 'book:colle-system', 'other'].map((d) => ['view', d]), ['visit', ''], ['neurons', ''], ['latency_ms', ''],
      ...'VN US SG JP KR CN TW HK TH MY ID PH IN AU NZ GB DE FR NL SE CH IE ES IT PL CA BR AE RU UA other'.split(' ').map((d) => ['country', d]),
      ...['direct', 'linkedin', 'google', 'github', 'facebook', 'bing', 'duckduckgo', 'x', 'other'].map((d) => ['ref', d]),
      ['device', 'phone'], ['device', 'desktop'], ['via', 'search'], ['via', 'chat'],
      ...['answered', 'small_talk', 'refused', 'rate_limited', 'quota', 'busy', 'error'].map((d) => ['chat', d]),
      ...['lt2', '2to5', '5to10', 'gt10'].map((d) => ['latency', d]),
      ...[...Array(51)].map((_, i) => ['topic', `doc-${i}`]),
    ]
    const rows = [...Array(90)].flatMap((_, i) => keys.map(([metric, dim]) => ({ day: addDays(TODAY, -i), metric, dim, value: 1 + (i % 7) })))
    expect(rows.length).toBeGreaterThanOrEqual(90 * 110)
    const titles = new Map([...Array(51)].map((_, i) => [`doc-${i}`, `Section ${i}`]))
    const run = () => { for (const d of [7, 30, 90] as const) JSON.stringify(buildSnapshot(rows, d, TODAY, titles)) }
    run() // warm up (JIT), as a warm isolate would be
    const t = performance.now()
    for (let i = 0; i < 5; i++) run()
    const ms = (performance.now() - t) / 5
    console.log(`cron snapshot CPU: ${ms.toFixed(2)} ms for ${rows.length} rows`)
    expect(ms).toBeLessThan(5)
  })
})

it('SQL is never built from strings: no template literals or concatenation in prepare() (plan S7)', () => {
  for (const file of ['metrics.ts', 'stats.ts', 'visit.ts', 'chat.ts']) {
    const src = readFileSync(new URL(file, import.meta.url), 'utf8')
    expect(src).not.toMatch(/prepare\(\s*`/)
    expect(src).not.toMatch(/prepare\([^)]*\+/)
  }
})
