import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { books } from '@/content/site'
import type { ReportTotals, Snapshot, StatsResponse } from '@/lib/reportTypes'
import { chartColors, tokens } from '@/theme'
import { Bars, compact, Gauge, Legend, MeterTable, TimeChart, type Series } from './charts'

export type Period = 7 | 30 | 90
export type ReportState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: StatsResponse }

/** Fallback Neurons per answer for "answers left" before there is data (plan estimate). */
const NEURONS_PER_ANSWER = 105

const BOOK_TITLES = new Map(books.map((b) => [`book:${b.slug}`, b.title]))
const PAGE_NAMES: Record<string, string> = { home: 'Home', cv: 'CV', report: 'Report', other: 'Other' }
const REF_NAMES: Record<string, string> = { direct: 'Direct', linkedin: 'LinkedIn', google: 'Google', github: 'GitHub', facebook: 'Facebook', bing: 'Bing', duckduckgo: 'DuckDuckGo', x: 'X', other: 'Other' }
const regions = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : undefined
export const pageName = (k: string) => BOOK_TITLES.get(k) ?? PAGE_NAMES[k] ?? 'Other'
export const countryName = (k: string) => (k === 'other' ? 'Other' : (regions?.of(k) ?? k))
const otherLabel = (k: string) => (k === 'other' ? 'Other' : k)

/**
 * "▲ 12% vs previous", only when data covers the whole previous period (`complete`); a partly covered one would
 * make every number look like a jump.
 */
function change(cur: number, prev: number, complete: boolean) {
  if (!complete || prev <= 0) return undefined
  const p = Math.round(((cur - prev) / prev) * 100)
  return { text: `${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}% vs previous`, up: p >= 0 }
}

function Card({ title, sub, span = 12, children }: { title: string; sub: string; span?: 4 | 6 | 8 | 12; children: ReactNode }) {
  return (
    <Paper component="section" variant="outlined" sx={{ gridColumn: { xs: 'span 12', md: `span ${span}` }, p: 2.25, borderRadius: `${tokens.radius}px`, minWidth: 0 }}>
      <Typography component="h2" sx={{ fontSize: '1.02rem', fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{sub}</Typography>
      {children}
    </Paper>
  )
}

function Kpi({ label, value, note }: { label: string; value: string; note?: { text: string; up?: boolean } | string }) {
  const n = typeof note === 'string' ? { text: note } : note
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius}px` }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 750, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{value}</Typography>
      {n && <Typography sx={{ fontFamily: tokens.mono, fontSize: '0.76rem', color: n.up === undefined ? 'text.secondary' : n.up ? 'primary.dark' : 'var(--err)' }}>{n.text}</Typography>}
    </Paper>
  )
}

/** An all-zero report, so "no data yet" shows the real layout (and the page does not jump when data arrives). */
export function zeroSnapshot(days: Period, now: number): Extract<StatsResponse, { builtAt: string }> {
  const zero = { views: 0, visits: 0, questions: 0, answered: 0, smallTalk: 0, neurons: 0, latencyMs: 0 }
  const day = (i: number) => new Date(now - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10)
  const snap: Snapshot = {
    days, from: day(0), to: day(days - 1), since: null,
    series: [...Array(days)].map((_, i) => ({ day: day(i), views: 0, visits: 0, answered: 0, smallTalk: 0, refused: 0, limited: 0, errors: 0, neurons: 0 })),
    current: zero, previous: zero, latency: { lt2: 0, '2to5': 0, '5to10': 0, gt10: 0 },
    top: { pages: [], topics: [], countries: [], refs: [] }, devices: { phone: 0, desktop: 0 }, via: { search: 0, chat: 0 },
  }
  // `today` is always replaced by the server's values; these are only placeholders.
  return { ...snap, builtAt: new Date(now).toISOString(), today: { neurons: 0, budget: 9500, limit: 10000 } }
}

const answerRate = (t: ReportTotals) => (t.questions - t.smallTalk > 0 ? `${Math.round((t.answered / (t.questions - t.smallTalk)) * 100)}%` : '–')
const avgTime = (t: ReportTotals) => (t.answered > 0 ? `${(t.latencyMs / t.answered / 1000).toFixed(1)} s` : '–')
const ago = (iso: string, now: number) => {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000))
  return min < 1 ? 'just now' : min < 60 ? `${min} min ago` : `${Math.round(min / 60)} h ago`
}

/** The public report below the intro: numbers from /api/stats (worker/stats.ts), drawn with the SVG charts in ./charts. */
export function ReportView({ state, days, onDays, now = Date.now() }: { state: ReportState; days: Period; onDays: (d: Period) => void; now?: number }) {
  const data = state.status === 'ready' ? state.data : undefined
  const real = data && !data.empty ? data : undefined
  const noData = !!data && (data.empty || real?.since === null)
  const snap = real ?? (data ? { ...zeroSnapshot(days, now), today: data.today } : undefined)
  const today = data?.today

  return (
    <Box sx={(t) => ({ '--c1': 'var(--mui-palette-primary-main)', ...Object.fromEntries(Object.entries(chartColors.light).map(([k, v]) => [`--${k}`, v])), ...t.applyStyles('dark', Object.fromEntries(Object.entries(chartColors.dark).map(([k, v]) => [`--${k}`, v]))), pb: { xs: 5, md: 7 } })}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', my: 3, color: 'text.secondary', fontSize: '0.85rem' }}>
        <ToggleButtonGroup exclusive size="small" value={days} onChange={(_, v: Period | null) => v && onDays(v)} aria-label="Period">
          {([7, 30, 90] as const).map((d) => <ToggleButton key={d} value={d} sx={{ px: 1.75, minHeight: 40, textTransform: 'none', color: 'text.primary', '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}>{d} days</ToggleButton>)}
        </ToggleButtonGroup>
        {/* Own line with room for two lines on phones, so the text that replaces "Loading…" never moves the page. */}
        <Box component="span" role="status" sx={{ flexBasis: { xs: '100%', sm: 'auto' }, minHeight: { xs: '2.6em', sm: 0 } }}>
          {state.status === 'loading' ? 'Loading…' : real && real.since ? `Updated ${ago(real.builtAt, now)} · collecting since ${real.since} · days are UTC` : data ? 'Updates every 15 minutes · days are UTC' : ''}
        </Box>
      </Box>

      {/* At least one screen tall in every state, so nothing below it moves into view while data loads (no layout shift). */}
      <Box sx={{ minHeight: '100vh' }}>
        {state.status === 'error' && <Alert severity="warning" sx={{ mb: 3 }}>Report data is unavailable right now. Please try again in a few minutes.</Alert>}
        {noData && <Alert severity="info" sx={{ mb: 3 }}>No data yet. Numbers appear after the first visits; the report is rebuilt every 15 minutes.</Alert>}

        {state.status === 'loading' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.75, mb: 3 }}>
            {[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={104} />)}
            <Skeleton variant="rounded" height={320} sx={{ gridColumn: '1 / -1' }} />
          </Box>
        )}

        {snap && today && <Body snap={snap} today={today} days={days} />}
      </Box>

      <Paper component="section" variant="outlined" sx={{ p: 2.25, mt: 2, borderRadius: `${tokens.radius}px` }}>
        <Typography component="h2" sx={{ fontSize: '1.02rem', fontWeight: 700, mb: 1 }}>How this report works</Typography>
        <Box component="ol" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.25, listStyle: 'none', p: 0, m: 0, mb: 1.5 }}>
          {[
            ['1 · Collect', 'The browser sends a tiny beacon per page; the chatbot Worker counts each question, its outcome, Neurons and answer time.'],
            ['2 · Aggregate', 'The Worker adds +1 to daily totals in Cloudflare D1, one row per day × metric × key. No raw events are kept.'],
            ['3 · Snapshot', 'Every 15 minutes a cron job runs the group-bys and stores the report; this page reads one row.'],
            ['4 · Retain', 'Days older than 90 are deleted. Top lists use completed days, and counts under 3 are shown as Other.'],
          ].map(([t, d]) => (
            <Box component="li" key={t} sx={{ border: 1, borderStyle: 'dashed', borderColor: 'divider', borderRadius: 3, p: 1.5, fontSize: '0.85rem', color: 'text.secondary' }}>
              <Box component="strong" sx={{ display: 'block', color: 'text.primary', fontSize: '0.9rem' }}>{t}</Box>{d}
            </Box>
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Answer rate counts every reply the AI gave from the pages, including “I don’t know from his pages”. A visit is the first page of a page load: nothing is stored on your device and there is no fingerprinting. IP addresses are only passed to Cloudflare’s rate limiter and are never saved by this site. Referrers and countries are grouped into fixed lists. Visitors with Do Not Track or Global Privacy Control on, ad blockers and bots that don’t run JavaScript are not counted, so numbers are approximate.
        </Typography>
      </Paper>
    </Box>
  )
}

function Body({ snap, today, days }: { snap: Extract<StatsResponse, { builtAt: string }>; today: { neurons: number; budget: number; limit: number }; days: Period }) {
  const { current: c, previous: p, series } = snap
  // The previous period starts `days` before `from`; compare only if data was already being collected then.
  const prevFrom = new Date(Date.parse(`${snap.from}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)
  const complete = snap.since !== null && snap.since <= prevFrom
  // Average over the days that have data, not the whole period (a new site would otherwise read as ~0%).
  const daysWithData = snap.since ? Math.max(1, Math.min(days, series.filter((d) => d.day >= snap.since!).length)) : days
  const labels = series.map((d) => d.day)
  const peak = series.reduce((a, d) => (d.neurons > a.neurons ? d : a), series[0])
  const perAnswer = c.answered > 0 ? c.neurons / c.answered : NEURONS_PER_ANSWER
  const left = Math.max(0, Math.floor((today.budget - today.neurons) / perAnswer))
  const buckets = snap.latency
  const bucketTotal = Math.max(1, buckets.lt2 + buckets['2to5'] + buckets['5to10'] + buckets.gt10)
  const pct = (n: number) => Math.round((n / bucketTotal) * 100)
  const s = (label: string, color: Series['color'], key: keyof (typeof series)[number]): Series => ({ label, color, values: series.map((d) => d[key] as number) })
  const outcomes = [s('Answered', 'var(--c1)', 'answered'), s('Greeting', 'var(--c2)', 'smallTalk'), s('Off-topic, refused', 'var(--grey)', 'refused'), s('Limited', 'var(--warn)', 'limited'), s('Error', 'var(--err)', 'errors')]

  return (
    <>
      <Box component="section" aria-label="Key numbers" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.75, mb: 3 }}>
        <Kpi label="Page views" value={compact(c.views)} note={change(c.views, p.views, complete)} />
        <Kpi label="Visits" value={compact(c.visits)} note={change(c.visits, p.visits, complete)} />
        <Kpi label="Chat questions" value={compact(c.questions)} note={change(c.questions, p.questions, complete)} />
        <Kpi label="Answer rate" value={answerRate(c)} note="of on-site questions" />
        <Kpi label="Avg answer time" value={avgTime(c)} note={`${compact(c.answered)} answers`} />
        <Kpi label="Avg quota a day" value={`${Math.round((c.neurons / (daysWithData * today.limit)) * 100)}%`} note={peak && peak.neurons > 0 ? `peak ${Math.round((peak.neurons / today.limit) * 100)}% (${peak.day.slice(5)})` : 'of the free Neurons'} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
        <Card title="Traffic" sub="Page views and visits per day" span={8}>
          <Legend items={[{ label: 'Page views', color: 'var(--c1)' }, { label: 'Visits', color: 'var(--c2)' }]} />
          <TimeChart kind="line" labels={labels} series={[s('Page views', 'var(--c1)', 'views'), s('Visits', 'var(--c2)', 'visits')]} summary={`Page views and visits per day over ${days} days: ${c.views} views, ${c.visits} visits.`} />
        </Card>
        <Card title="Chatbot quota today" sub={`Workers AI free plan: ${today.limit.toLocaleString('en')} Neurons a day`} span={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Gauge pct={(today.neurons / today.limit) * 100} label={`${Math.round((today.neurons / today.limit) * 100)}% of today’s quota used`} />
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, fontSize: '0.88rem', color: 'text.secondary', '& b': { color: 'text.primary' } }}>
              <li><b>{compact(today.neurons)}</b> of {compact(today.limit)} Neurons</li>
              <li><b>~{left}</b> answers left</li>
              <li><b>~{Math.round(perAnswer)}</b> Neurons per answer</li>
              <li>Resets 07:00 Vietnam time</li>
            </Box>
          </Box>
        </Card>

        <Card title="Quota use per day" sub="Neurons used, with the 10,000 daily limit" span={6}>
          <TimeChart kind="bar" labels={labels} series={[s('Neurons', 'var(--c1)', 'neurons')]} limit={{ value: today.limit, label: `daily limit ${today.limit.toLocaleString('en')}` }} summary={`Neurons used per day over ${days} days, ${Math.round(c.neurons)} in total, against a limit of ${today.limit} a day.`} />
        </Card>
        <Card title="Chatbot questions" sub="What happened to each question" span={6}>
          <Legend items={outcomes.map((o) => ({ label: o.label, color: o.color }))} />
          <TimeChart kind="stack" labels={labels} series={outcomes} summary={`Chatbot questions per day by outcome over ${days} days: ${c.questions} questions, ${c.answered} answered.`} />
        </Card>

        <Card title="Most read pages" sub="Page views, completed days" span={4}>
          <MeterTable head="Page" rows={snap.top.pages.map(([k, n]) => [pageName(k), n])} />
        </Card>
        <Card title="What people ask about" sub="Sections the chatbot answered from" span={4}>
          <MeterTable head="Section" rows={snap.top.topics.map(([k, n]) => [otherLabel(k), n])} />
        </Card>
        <Card title="Where visitors come from" sub="Countries and referrers, completed days" span={4}>
          <MeterTable head="Country" rows={snap.top.countries.map(([k, n]) => [countryName(k), n])} />
          <Box sx={{ mt: 2 }}><MeterTable head="Referrer" rows={snap.top.refs.map(([k, n]) => [REF_NAMES[k] ?? 'Other', n])} /></Box>
        </Card>

        <Card title="Answer time" sub="How long the AI took to answer" span={6}>
          <Bars unit="%" rows={[{ label: 'under 2 s', value: pct(buckets.lt2) }, { label: '2–5 s', value: pct(buckets['2to5']) }, { label: '5–10 s', value: pct(buckets['5to10']) }, { label: 'over 10 s', value: pct(buckets.gt10) }]} />
        </Card>
        <Card title="How visitors find answers" sub="Pages opened from site search and chatbot sources; device type" span={6}>
          <Bars rows={[{ label: 'From site search', value: snap.via.search }, { label: 'From chat sources', value: snap.via.chat }, { label: 'Phone', value: snap.devices.phone, color: 'var(--c2)' }, { label: 'Desktop', value: snap.devices.desktop, color: 'var(--c2)' }]} />
        </Card>
      </Box>
    </>
  )
}
