import type { Snapshot, StatsResponse, Today } from '../src/lib/reportTypes.ts'
import { COUNTRY_KEYS, PAGE_KEYS, REF_KEYS } from './allowlist.ts'
import { FREE_NEURONS, json, neuronBudget, TOPIC_TITLES as TITLES, type Env } from './chat.ts'
import { todayNeurons, within } from './metrics.ts'

export const MEMO_MS = 60_000
const TOPIC_TITLES = new Set([...TITLES.values(), 'other'])

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const day = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const rows = (v: unknown, allowed: Set<string>) => Array.isArray(v) && v.length <= 12 && v.every((r) => Array.isArray(r) && r.length === 2 && typeof r[0] === 'string' && allowed.has(r[0]) && num(r[1]))
const totals = (t: unknown) => !!t && typeof t === 'object' && ['views', 'visits', 'questions', 'answered', 'smallTalk', 'neurons', 'latencyMs'].every((k) => num((t as Record<string, unknown>)[k]))
const flat = (o: unknown, keys: string[]) => !!o && typeof o === 'object' && keys.every((k) => num((o as Record<string, unknown>)[k]))

/**
 * Strict check of a stored snapshot before it is served (plan S-C2-4): numbers are numbers, days are dates, and every
 * top-list key is re-checked against the same fixed allowlists. A row that fails is never shown.
 */
export function checkSnapshot(s: unknown, days: number): s is Snapshot {
  if (!s || typeof s !== 'object') return false
  const x = s as Record<string, unknown>
  const top = x.top as Record<string, unknown> | undefined
  return (
    x.days === days && day(x.from) && day(x.to) && (x.since === null || day(x.since)) &&
    Array.isArray(x.series) && x.series.length === days &&
    x.series.every((d) => flat(d, ['views', 'visits', 'answered', 'smallTalk', 'refused', 'limited', 'errors', 'neurons']) && day((d as { day: unknown }).day)) &&
    totals(x.current) && totals(x.previous) &&
    flat(x.latency, ['lt2', '2to5', '5to10', 'gt10']) && flat(x.devices, ['phone', 'desktop']) && flat(x.via, ['search', 'chat']) &&
    !!top && rows(top.pages, PAGE_KEYS) && rows(top.topics, TOPIC_TITLES) && rows(top.countries, COUNTRY_KEYS) && rows(top.refs, REF_KEYS)
  )
}

const memo = new Map<number, { at: number; body: StatsResponse }>()
/** Test hook. */
export const clearStatsMemo = () => memo.clear()

const HEADERS = { 'Cache-Control': 'public, max-age=60' }
const fail = (status: number, code: string, message: string) => json({ error: { code, message } }, status)

/**
 * `GET /api/stats?days=7|30|90`: the cron-built snapshot (1 row) and today's Neurons (1 row). No per-request
 * aggregation, so page loads cannot amplify D1 reads (plan W3). Memoized per isolate for 60 s; errors never are.
 */
export async function handleStats(request: Request, env: Env, opts: { now?: () => number } = {}): Promise<Response> {
  if (request.method !== 'GET') return fail(405, 'method', 'Use GET.')
  const m = /^\?days=(7|30|90)$/.exec(new URL(request.url).search)
  if (!m) return fail(400, 'bad_request', 'Use ?days=7, 30 or 90.')
  const days = Number(m[1])
  const now = (opts.now ?? Date.now)()
  const hit = memo.get(days)
  if (hit && now - hit.at < MEMO_MS) return json(hit.body, 200, HEADERS)
  if (!env.DB) return fail(503, 'unavailable', 'Report data is unavailable right now.')

  let stored: { json: string; built_at: string } | null
  try {
    const read = await within(env.DB.prepare('SELECT json, built_at FROM snapshot WHERE days = ?1').bind(days).first<{ json: string; built_at: string }>(), 800)
    if (read === undefined) throw new Error('timeout')
    stored = read
  } catch (e) {
    // Before the first cron run the table does not exist yet: that is "no data", not an error (plan S6).
    if (!/no such table/i.test(String((e as Error)?.message ?? e))) {
      console.error('stats: unavailable')
      return fail(503, 'unavailable', 'Report data is unavailable right now.')
    }
    stored = null
  }
  const today: Today = { neurons: Math.round((await todayNeurons(env.DB, now)) ?? 0), budget: neuronBudget(env), limit: FREE_NEURONS }
  if (!stored) return json({ empty: true, today } satisfies StatsResponse, 200, { 'Cache-Control': 'no-store' })

  let snap: unknown
  try {
    snap = JSON.parse(stored.json)
  } catch {
    snap = undefined
  }
  if (!checkSnapshot(snap, days) || typeof stored.built_at !== 'string') {
    console.error('stats: bad_snapshot')
    return fail(503, 'unavailable', 'Report data is unavailable right now.')
  }
  // Only the known fields, so a tampered row cannot add anything to the response.
  const { from, to, since, series, current, previous, latency, top, devices, via } = snap
  const body: StatsResponse = { days: snap.days, from, to, since, series, current, previous, latency, top, devices, via, builtAt: stored.built_at, today }
  memo.set(days, { at: now, body })
  return json(body, 200, HEADERS)
}
