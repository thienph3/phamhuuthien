import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import type { Job, TimelineExtra, Track } from '@/content/types'
import { anchors } from '@/lib/anchors'
import { tokens } from '@/theme'

/** Bar colours: dark enough for white labels in both schemes (WCAG AA for small text). */
export const TRACK_COLORS: Record<Track | 'study' | 'chess', string> = {
  software: '#475569',
  data: '#047857',
  ml: '#0e7490',
  backend: '#b45309',
  study: '#6d28d9',
  chess: '#5f6f6a',
}
const LABELS: Record<Track | 'study' | 'chess', string> = { software: 'Software', data: 'Data', ml: 'ML', backend: 'Backend', study: 'Study', chess: 'Chess' }

/** Scrolls to a job on this page and flashes it briefly, so the reader sees where they landed. */
export function showJob(company: string) {
  const el = document.getElementById(anchors.job(company))
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
  el.classList.add('cv-flash')
  setTimeout(() => el.classList.remove('cv-flash'), 1400)
}

const bg = (span: Job['timeline']) => (span.track2 ? `linear-gradient(90deg, ${TRACK_COLORS[span.track]} 0 60%, ${TRACK_COLORS[span.track2]} 60%)` : TRACK_COLORS[span.track])
const dashed = (color: string) => `repeating-linear-gradient(45deg, rgb(255 255 255 / 0.22) 0 6px, transparent 6px 12px), ${color}`

/**
 * "Career at a glance": work, study and chess on one axis from `start` to now. Each job bar is a button that scrolls to
 * the job below. Spans are approximate (years), and the chart says so. On phones it becomes a vertical list.
 */
export function CareerTimeline({ jobs, extras, start = 2007, end = new Date().getFullYear() + 0.9 }: { jobs: Job[]; extras: TimelineExtra[]; start?: number; end?: number }) {
  const x = (y: number) => `${((Math.max(start, Math.min(end, y)) - start) / (end - start)) * 100}%`
  const w = (a: number, b: number) => `${((Math.min(end, b) - Math.max(start, a)) / (end - start)) * 100}%`
  const ticks = Array.from({ length: Math.floor((end - start) / 3) + 1 }, (_, i) => start + i * 3)
  const lanes: { name: string; bars: { key: string; label: string; from: number; to: number; background: string; job?: Job; aria: string }[] }[] = [
    {
      name: 'Work',
      // A current job ("… – now") always runs to the end of the axis, whatever year it is.
      bars: jobs.map((j) => ({ key: j.company, label: j.company, from: j.timeline.from, to: /now$/.test(j.period ?? '') ? end : j.timeline.to, background: bg(j.timeline), job: j, aria: `${j.company}, ${j.period ?? ''}: ${j.role}. Show details` })),
    },
    ...(['Study', 'Chess'] as const).map((lane) => ({
      name: lane,
      bars: extras.filter((e) => e.lane === lane).map((e) => {
        const color = TRACK_COLORS[lane === 'Study' ? 'study' : 'chess']
        return { key: e.label, label: e.label, from: e.from, to: e.to, background: e.dashed ? dashed(color) : color, aria: e.label }
      }),
    })),
  ]
  const bar = { position: 'absolute', top: 3, bottom: 3, borderRadius: '6px', color: '#fff', fontSize: '0.72rem', fontWeight: 650, px: 0.75, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block', lineHeight: '28px', textAlign: 'left', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as const

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: `${tokens.radius + 2}px`, p: { xs: 2, sm: 2.5 }, bgcolor: 'background.paper' }}>
      <Box aria-hidden sx={{ display: { xs: 'none', sm: 'flex' }, flexWrap: 'wrap', gap: 2, fontSize: '0.8rem', color: 'text.secondary', mb: 1 }}>
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => (
          <span key={k}><Box component="i" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '3px', bgcolor: TRACK_COLORS[k], mr: 0.5, verticalAlign: '-1px' }} />{LABELS[k]}</span>
        ))}
      </Box>

      {/* Chart: sm and up */}
      <Box sx={{ display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: '4.5rem 1fr', rowGap: 1, alignItems: 'center' }}>
        {lanes.map((lane) => (
          <Box key={lane.name} sx={{ display: 'contents' }}>
            <Typography component="div" sx={{ fontFamily: tokens.mono, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>{lane.name}</Typography>
            <Box {...(lane.name === 'Work' ? { 'aria-hidden': true } : { role: 'list', 'aria-label': `${lane.name} timeline` })} sx={(t) => ({ position: 'relative', height: 34, borderRadius: '8px', bgcolor: tokens.light.surface2, ...t.applyStyles('dark', { bgcolor: tokens.dark.surface2 }) })}>
              {lane.bars.map((b) => (b.job ? (
                // Pointer shortcut only: short jobs are narrower than a 24px target, so the "Jump to" buttons below are the
                // accessible equivalent (WCAG 2.5.8) and these bars stay out of the tab order.
                <Box key={b.key} title={`${b.label} · ${b.job.period ?? ''}`} onClick={() => showJob(b.job!.company)}
                  sx={{ ...bar, cursor: 'pointer', left: x(b.from), width: w(b.from, b.to), background: b.background, '&:hover': { filter: 'brightness(1.12)', zIndex: 1 } }}>
                  {b.label}
                </Box>
              ) : (
                <Box key={b.key} role="listitem" title={b.label} sx={{ ...bar, left: x(b.from), width: w(b.from, b.to), background: b.background }}>{b.label}</Box>
              )))}
            </Box>
          </Box>
        ))}
        <Box />
        <Box aria-hidden sx={{ position: 'relative', height: 18, fontFamily: tokens.mono, fontSize: '0.68rem', color: 'text.secondary' }}>
          {ticks.map((y) => <Box component="span" key={y} sx={{ position: 'absolute', left: x(y), transform: 'translateX(-50%)' }}>{y}</Box>)}
        </Box>
      </Box>

      {/* Jump to a job: the keyboard and screen-reader way in, and a full-size target for every job. */}
      <Box component="ul" aria-label="Jump to a job" className="cv-noprint" sx={{ display: { xs: 'none', sm: 'flex' }, flexWrap: 'wrap', gap: 0.75, listStyle: 'none', m: 0, p: 0, mt: 1.5 }}>
        {jobs.map((j) => (
          <li key={j.company}>
            <ButtonBase aria-label={`${j.company}, ${j.period ?? ''}: ${j.role}. Show details`} onClick={() => showJob(j.company)}
              sx={{ minHeight: 28, px: 1.25, borderRadius: 999, border: 1, borderColor: 'divider', fontSize: '0.8rem', gap: 0.75, '&:hover, &.Mui-focusVisible': { borderColor: 'primary.main' }, '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' } }}>
              <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TRACK_COLORS[j.timeline.track] }} />
              {j.company}
            </ButtonBase>
          </li>
        ))}
      </Box>

      {/* List: phones */}
      <Box component="ol" aria-label="Career timeline" sx={{ display: { xs: 'block', sm: 'none' }, listStyle: 'none', m: 0, p: 0, borderLeft: 2, borderColor: 'divider' }}>
        {[...jobs.map((j) => ({ key: j.company, color: TRACK_COLORS[j.timeline.track], title: j.company, sub: `${j.period ?? ''} · ${j.role}`, job: j })),
          ...extras.slice().sort((a, b) => b.from - a.from).map((e) => ({ key: e.label, color: TRACK_COLORS[e.lane === 'Study' ? 'study' : 'chess'], title: e.label, sub: `${Math.floor(e.from)} – ${Math.floor(e.to)}`, job: undefined }))]
          .map((e) => (
            <Box component="li" key={e.key} sx={{ position: 'relative', pl: 2, pb: 1.5, '&::before': { content: '""', position: 'absolute', left: -7, top: 6, width: 12, height: 12, borderRadius: '50%', bgcolor: e.color } }}>
              {e.job ? (
                <ButtonBase onClick={() => showJob(e.job!.company)} sx={{ display: 'block', textAlign: 'left', fontWeight: 700, fontSize: '1rem', minHeight: 24 }}>{e.title}</ButtonBase>
              ) : (
                <Typography sx={{ fontWeight: 700 }}>{e.title}</Typography>
              )}
              <Typography variant="body2" color="text.secondary">{e.sub}</Typography>
            </Box>
          ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.78rem' }}>Approximate, by year. Select a bar or a job for its details below.</Typography>
    </Box>
  )
}
