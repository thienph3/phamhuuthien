import { countryKey, pageKey, refKey } from './allowlist.ts'
import { error, postCheck, readBody, type Env } from './chat.ts'
import { gate, record, safely, type Row } from './metrics.ts'

export const MAX_VISIT_BYTES = 1024
const KEYS = new Set(['path', 'ref', 'first', 'phone', 'via'])

/** The same empty 204 for success and for anything rejected, so the endpoint is not an oracle (plan S8). */
const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

type Visit = { path: string; ref: string; first: boolean; phone: boolean; via?: 'search' | 'chat' }
/** Exactly `{ path, ref, first, phone, via? }` with the right types; anything else is rejected. */
export function parseVisit(body: unknown): Visit | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return
  const b = body as Record<string, unknown>
  if (Object.keys(b).some((k) => !KEYS.has(k))) return
  if (typeof b.path !== 'string' || typeof b.ref !== 'string' || typeof b.first !== 'boolean' || typeof b.phone !== 'boolean') return
  if (b.via !== undefined && b.via !== 'search' && b.via !== 'chat') return
  return b as Visit
}

/** Report rows for one page view: ≤ 5 on the first view of a page load, ≤ 2 after (plan Metrics). */
export function visitRows(v: Visit, page: string, country: unknown, ownHost: string): Row[] {
  const rows: Row[] = [['view', page, 1]]
  if (v.first) {
    rows.push(['visit', '', 1], ['country', countryKey(country), 1], ['device', v.phone ? 'phone' : 'desktop', 1])
    const ref = refKey(v.ref, ownHost)
    if (ref) rows.push(['ref', ref, 1])
  } else if (v.via) rows.push(['via', v.via, 1])
  return rows
}

/** `POST /api/visit`: the page-view beacon. Writes go through the shared gate, after the response. */
export async function handleVisit(request: Request, env: Env, opts: { waitUntil?: (p: Promise<unknown>) => void; now?: () => number; log?: (code: string) => void } = {}) {
  const refused = postCheck(request)
  if (refused === 'method') return error('method')
  if (refused) return done()
  const raw = await readBody(request, MAX_VISIT_BYTES)
  if (raw === 'too_long') return done()
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return done()
  }
  const visit = parseVisit(body)
  const page = visit && pageKey(visit.path)
  const db = env.DB
  if (!visit || !page || !db || !opts.waitUntil) return done()
  const url = new URL(request.url)
  const rows = visitRows(visit, page, (request as Request & { cf?: { country?: unknown } }).cf?.country, url.hostname)
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const now = opts.now ?? Date.now
  opts.waitUntil(safely(async () => {
    if (await gate(env, ip)) await record(db, rows, now())
  }, opts.log ?? ((code) => console.error(`visit: ${code}`))))
  return done()
}
