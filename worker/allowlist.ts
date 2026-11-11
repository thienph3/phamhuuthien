import { books } from '../src/content/site.ts'

/**
 * The only values a visitor's beacon can turn into report rows. Everything else becomes `other` (or is dropped), so no
 * visitor-supplied text can ever appear on the public report (plan W4). Used on write and again when building snapshots.
 */
export const BOOK_SLUGS = new Set(books.filter((b) => b.sections || b.notes || b.demos).map((b) => b.slug))
export const PAGE_KEYS = new Set(['home', 'cv', 'report', 'other', ...[...BOOK_SLUGS].map((s) => `book:${s}`)])

export const REFS = ['direct', 'linkedin', 'google', 'github', 'facebook', 'bing', 'duckduckgo', 'x', 'other'] as const
export const REF_KEYS = new Set<string>(REFS)

export const COUNTRIES = new Set('VN US SG JP KR CN TW HK TH MY ID PH IN AU NZ GB DE FR NL SE CH IE ES IT PL CA BR AE RU UA'.split(' '))
export const COUNTRY_KEYS = new Set([...COUNTRIES, 'other'])

/** `/` → home, `/report` → report, `/books/<known slug>` → `book:<slug>`, else `other`; not a short string → undefined. */
export function pageKey(path: unknown): string | undefined {
  if (typeof path !== 'string' || path.length > 200) return undefined
  if (path === '/') return 'home'
  if (path === '/report') return 'report'
  if (path === '/cv') return 'cv'
  const m = /^\/books\/([a-z0-9-]{1,40})$/.exec(path)
  return m && BOOK_SLUGS.has(m[1]) ? `book:${m[1]}` : 'other'
}

const GOOGLE_TLDS = new Set(['com', 'com.vn', 'co.jp', 'co.uk', 'de', 'fr', 'sg', 'com.au', 'ca'])
const HOSTS: [string, (typeof REFS)[number]][] = [
  ['linkedin.com', 'linkedin'], ['lnkd.in', 'linkedin'], ['github.com', 'github'], ['facebook.com', 'facebook'], ['fb.com', 'facebook'],
  ['bing.com', 'bing'], ['duckduckgo.com', 'duckduckgo'], ['x.com', 'x'], ['t.co', 'x'], ['twitter.com', 'x'],
]
/** Exact host or a `.`-prefixed suffix: `evil-github.com` and `github.com.evil.com` do not match. */
const isHost = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

/**
 * Referrer host → a fixed key. `''` → direct, our own host → undefined (not recorded), unknown → other. Not a string,
 * longer than 253 chars, or with userinfo → undefined.
 */
export function refKey(input: unknown, ownHost: string): string | undefined {
  if (typeof input !== 'string' || input.length > 253 || input.includes('@')) return undefined
  const host = input.toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '')
  if (host === '') return 'direct'
  if (host === ownHost.toLowerCase()) return undefined
  if (!/^[a-z0-9.-]+$/.test(host)) return 'other'
  const g = /^(?:www\.)?google\.(.+)$/.exec(host)
  if (g && GOOGLE_TLDS.has(g[1])) return 'google'
  return HOSTS.find(([d]) => isHost(host, d))?.[1] ?? 'other'
}

/** Cloudflare's 2-letter country → one of 30 codes, else `other` (`XX` unknown, `T1` Tor, missing). */
export function countryKey(country: unknown): string {
  return typeof country === 'string' && /^[A-Z]{2}$/.test(country) && COUNTRIES.has(country) ? country : 'other'
}
