import type { ReportDay, ReportTotals, Snapshot, TopRow } from '../src/lib/reportTypes.ts'
import { COUNTRY_KEYS, PAGE_KEYS, REF_KEYS } from './allowlist.ts'
import type { RateLimit } from './chat.ts'

/** The D1 binding, typed only as far as we use it (no extra dependency). Source: docs/tech.md "Cloudflare D1". */
export type D1Stmt = {
  bind(...values: unknown[]): D1Stmt
  run(): Promise<unknown>
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
}
export type D1 = { prepare(sql: string): D1Stmt; batch(statements: D1Stmt[]): Promise<unknown[]> }
export type MetricsEnv = { DB?: D1; WRITE_IP_LIMIT?: RateLimit; WRITE_GLOBAL_LIMIT?: RateLimit }

export const DAY_MS = 86_400_000
export const RETAIN_DAYS = 90
export const PERIODS = [7, 30, 90] as const
/** Workers AI pricing for llama-3.3-70b-instruct-fp8-fast, in Neurons per million tokens (docs/tech.md, pricing page). */
export const NEURONS_PER_M_IN = 26_668
export const NEURONS_PER_M_OUT = 204_805
export const neuronsFor = (tokensIn: number, tokensOut: number) => (tokensIn * NEURONS_PER_M_IN + tokensOut * NEURONS_PER_M_OUT) / 1e6
export const latencyBucket = (ms: number) => (ms < 2000 ? 'lt2' : ms < 5000 ? '2to5' : ms < 10_000 ? '5to10' : 'gt10')
/** Rows read by the snapshot query are folded below this count (plan S3: small counts could point at one visitor). */
export const MIN_COUNT = 3
export const TOP_ROWS = 6

export const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const addDays = (day: string, n: number) => utcDay(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)

// ---- Schema (once per isolate, write path and cron only) ----

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS daily (day TEXT NOT NULL, metric TEXT NOT NULL, dim TEXT NOT NULL, value REAL NOT NULL, PRIMARY KEY (day, metric, dim)) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS snapshot (days INTEGER PRIMARY KEY, json TEXT NOT NULL, built_at TEXT NOT NULL)',
]
const ready = new WeakMap<D1, Promise<unknown>>()
export function ensureSchema(db: D1): Promise<unknown> {
  let p = ready.get(db)
  if (!p) {
    p = db.batch(SCHEMA.map((sql) => db.prepare(sql)))
    p.catch(() => ready.delete(db)) // retry next time
    ready.set(db, p)
  }
  return p
}

// ---- Writes ----

export type Row = [metric: string, dim: string, value: number]
const UPSERT = 'INSERT INTO daily (day, metric, dim, value) VALUES (?1, ?2, ?3, ?4) ON CONFLICT (day, metric, dim) DO UPDATE SET value = value + excluded.value'

/** Adds each row's value to today's counter, in one batch (one transaction). */
export async function record(db: D1, rows: Row[], now: number): Promise<void> {
  if (rows.length === 0) return
  await ensureSchema(db)
  const stmt = db.prepare(UPSERT)
  const day = utcDay(now)
  await db.batch(rows.map(([metric, dim, value]) => stmt.bind(day, metric, dim, value)))
}

/**
 * The write gate shared by the beacon and the chat (plan W1/W2): per IP 20/60 s, then global 8/60 s. A missing or
 * failing binding closes the gate (the event is simply not counted).
 */
export async function gate(env: MetricsEnv, ip: string): Promise<boolean> {
  try {
    if (!env.WRITE_IP_LIMIT || !env.WRITE_GLOBAL_LIMIT) return false
    if (!(await env.WRITE_IP_LIMIT.limit({ key: `ip:${ip}` })).success) return false
    return (await env.WRITE_GLOBAL_LIMIT.limit({ key: 'global' })).success
  } catch {
    return false
  }
}

/** Runs `task` without ever throwing: metrics must never break a page, a beacon or the chat (fail open). */
export const safely = (task: () => Promise<unknown>, log: (code: string) => void, code = 'metrics_error') =>
  task().then(
    () => undefined,
    () => log(code),
  )

/** `promise`, or undefined if it takes longer than `ms` (D1 must never hang a request). */
export async function within<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([promise, new Promise<undefined>((resolve) => (timer = setTimeout(() => resolve(undefined), ms)))])
  } finally {
    clearTimeout(timer)
  }
}

/** Today's Neurons, or undefined when D1 fails or is slower than `timeoutMs` (the caller then skips its check). */
export async function todayNeurons(db: D1, now: number, timeoutMs = 800): Promise<number | undefined> {
  try {
    const v = await within(db.prepare("SELECT value FROM daily WHERE day = ?1 AND metric = 'neurons' AND dim = ''").bind(utcDay(now)).first<number>('value'), timeoutMs)
    return v === undefined ? undefined : typeof v === 'number' ? v : 0
  } catch {
    return undefined
  }
}

// ---- Cron: snapshots and retention ----

type DailyRow = { day: string; metric: string; dim: string; value: number }
const emptyTotals = (): ReportTotals => ({ views: 0, visits: 0, questions: 0, answered: 0, smallTalk: 0, neurons: 0, latencyMs: 0 })
const LIMITED = new Set(['rate_limited', 'quota', 'busy'])

/** Sums per allowed key, folds keys under MIN_COUNT (and unknown keys) into `other`, best first, at most TOP_ROWS + other. */
export function topRows(counts: Map<string, number>, allowed: (key: string) => boolean): TopRow[] {
  let other = 0
  const rows: TopRow[] = []
  for (const [key, n] of counts) {
    if (key !== 'other' && allowed(key) && n >= MIN_COUNT) rows.push([key, n])
    else other += n
  }
  rows.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  for (const [, n] of rows.splice(TOP_ROWS)) other += n
  return other > 0 ? [...rows, ['other', other]] : rows
}

/** The report for one period, from the daily rows. Pure, so it is tested without a database. */
export function buildSnapshot(rows: DailyRow[], days: (typeof PERIODS)[number], today: string, topicTitles: Map<string, string>): Snapshot {
  const from = addDays(today, -(days - 1))
  const prevFrom = addDays(today, -(2 * days - 1))
  const series = new Map<string, ReportDay>()
  for (let d = from; d <= today; d = addDays(d, 1)) series.set(d, { day: d, views: 0, visits: 0, answered: 0, smallTalk: 0, refused: 0, limited: 0, errors: 0, neurons: 0 })
  const current = emptyTotals()
  const previous = emptyTotals()
  const latency = { lt2: 0, '2to5': 0, '5to10': 0, gt10: 0 }
  const devices = { phone: 0, desktop: 0 }
  const via = { search: 0, chat: 0 }
  const tables = { view: new Map<string, number>(), topic: new Map<string, number>(), country: new Map<string, number>(), ref: new Map<string, number>() }
  let since: string | null = null

  // Rows older than the retention window are ignored even if a prune failed (plan S7). So the 90-day period has no
  // "previous" period; the page then shows no change figure.
  const oldest = addDays(today, -(RETAIN_DAYS - 1))
  for (const { day, metric, dim, value } of rows) {
    if (day < oldest || day > today) continue
    if (since === null || day < since) since = day
    const t = day >= from ? current : day >= prevFrom ? previous : undefined
    if (!t) continue
    if (metric === 'view') t.views += value
    else if (metric === 'visit') t.visits += value
    else if (metric === 'chat') {
      t.questions += value
      if (dim === 'answered') t.answered += value
      if (dim === 'small_talk') t.smallTalk += value
    } else if (metric === 'neurons') t.neurons += value
    else if (metric === 'latency_ms') t.latencyMs += value
    if (t !== current) continue

    const s = series.get(day)
    if (!s) continue // not a real day key (only the Worker writes days; defensive)
    if (metric === 'view') s.views += value
    else if (metric === 'visit') s.visits += value
    else if (metric === 'neurons') s.neurons += value
    else if (metric === 'chat') {
      if (dim === 'answered') s.answered += value
      else if (dim === 'small_talk') s.smallTalk += value
      else if (dim === 'refused') s.refused += value
      else if (LIMITED.has(dim)) s.limited += value
      else if (dim === 'error') s.errors += value
    } else if (metric === 'latency' && Object.hasOwn(latency, dim)) latency[dim as keyof typeof latency] += value
    else if (metric === 'device' && (dim === 'phone' || dim === 'desktop')) devices[dim] += value
    else if (metric === 'via' && (dim === 'search' || dim === 'chat')) via[dim] += value
    // Top tables: completed days only (plan S3).
    if (day < today && Object.hasOwn(tables, metric)) {
      const m = tables[metric as keyof typeof tables]
      m.set(dim, (m.get(dim) ?? 0) + value)
    }
  }
  const topics = new Map<string, number>()
  for (const [id, n] of tables.topic) {
    const title = topicTitles.get(id) ?? 'other'
    topics.set(title, (topics.get(title) ?? 0) + n)
  }
  const titles = new Set(topicTitles.values())
  return {
    days, from, to: today, since, series: [...series.values()], current, previous, latency, devices, via,
    top: {
      pages: topRows(tables.view, (k) => PAGE_KEYS.has(k)),
      topics: topRows(topics, (k) => titles.has(k)),
      countries: topRows(tables.country, (k) => COUNTRY_KEYS.has(k)),
      refs: topRows(tables.ref, (k) => REF_KEYS.has(k)),
    },
  }
}

const SAVE = 'INSERT INTO snapshot (days, json, built_at) VALUES (?1, ?2, ?3) ON CONFLICT (days) DO UPDATE SET json = excluded.json, built_at = excluded.built_at'

/**
 * Cron: one read of the daily rows, then each period is built and saved on its own, so a failure keeps the previous
 * snapshot of that period (plan S-C2-3). Then deletes days older than 90.
 */
export async function runCron(db: D1, now: number, topicTitles: Map<string, string>, log: (code: string) => void): Promise<void> {
  await ensureSchema(db)
  const today = utcDay(now)
  const { results } = await db.prepare('SELECT day, metric, dim, value FROM daily WHERE day >= ?1 AND day <= ?2').bind(addDays(today, -(RETAIN_DAYS - 1)), today).all<DailyRow>()
  const builtAt = new Date(now).toISOString()
  for (const days of PERIODS)
    // async: a throw while building is caught too, so one bad period never stops the others or the prune.
    await safely(async () => db.prepare(SAVE).bind(days, JSON.stringify(buildSnapshot(results, days, today, topicTitles)), builtAt).run(), log, `snapshot_${days}_error`)
  await safely(() => db.prepare('DELETE FROM daily WHERE day < ?1').bind(addDays(today, -(RETAIN_DAYS - 1))).run(), log, 'prune_error')
}
