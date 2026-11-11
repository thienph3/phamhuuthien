import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { tokens } from '@/theme'

/** CSS variables set on the report root (Report.tsx): --c1 primary, --c2, --warn, --err, --grey, --track. */
export type ChartColor = 'var(--c1)' | 'var(--c2)' | 'var(--warn)' | 'var(--err)' | 'var(--grey)'
export type Series = { label: string; color: ChartColor; values: number[] }

export const visuallyHidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const

/** 1234 → "1.2k". */
export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(Math.round(n)))

/** The data behind a chart, for screen readers (the SVG itself is one labelled image). */
function DataTable({ caption, labels, series }: { caption: string; labels: string[]; series: Series[] }) {
  return (
    // Tables ignore overflow: hidden, so the hiding is done by a wrapper.
    <Box sx={visuallyHidden}>
      <table>
        <caption>{caption}</caption>
        <thead><tr><th scope="col">Day</th>{series.map((s) => <th key={s.label} scope="col">{s.label}</th>)}</tr></thead>
        <tbody>{labels.map((l, i) => <tr key={l}><th scope="row">{l}</th>{series.map((s) => <td key={s.label}>{Math.round(s.values[i] ?? 0)}</td>)}</tr>)}</tbody>
      </table>
    </Box>
  )
}

/**
 * Daily chart: lines (`line`), bars side by side for one series, or stacked bars (`stack`), with an optional dashed
 * limit line. Fixed aspect ratio, so the layout never shifts. Phones get a narrower drawing so labels stay readable.
 */
export function TimeChart({ labels, series, kind, limit, summary }: { labels: string[]; series: Series[]; kind: 'line' | 'bar' | 'stack'; limit?: { value: number; label: string }; summary: string }) {
  const phone = useMediaQuery('(max-width:600px)')
  const W = phone ? 360 : 640
  const H = phone ? 220 : 200
  const L = 34
  const B = 20
  const n = labels.length
  const bw = (W - L) / Math.max(1, n)
  const total = (i: number) => (kind === 'stack' ? series.reduce((a, s) => a + (s.values[i] ?? 0), 0) : Math.max(0, ...series.map((s) => s.values[i] ?? 0)))
  // A round top value, at least 4, so the 5 axis labels are distinct whole numbers even with tiny data.
  const raw = Math.max(4, limit?.value ?? 0, ...labels.map((_, i) => total(i))) * 1.1
  const step = 10 ** Math.floor(Math.log10(raw / 4))
  const max = Math.ceil(raw / 4 / step) * step * 4
  const y = (v: number) => H - B - (v / max) * (H - B - 8)
  const every = Math.ceil(n / (phone ? 4 : 7))
  return (
    <Box sx={{ position: 'relative' }}>
      <Box component="svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} sx={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible', '& text': { fill: 'var(--mui-palette-text-secondary)', fontSize: 10, fontFamily: tokens.mono } }}>
        {[0, 1, 2, 3, 4].map((t) => {
          const v = (max / 4) * t
          return (
            <g key={t}>
              <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="var(--mui-palette-divider)" />
              <text x={L - 6} y={y(v) + 3} textAnchor="end">{compact(v)}</text>
            </g>
          )
        })}
        {labels.map((l, i) => (i % every === 0 ? <text key={l} x={L + i * bw + bw / 2} y={H - 5} textAnchor="middle">{l.slice(5)}</text> : null))}
        {kind === 'line'
          ? series.map((s, k) => {
              const pts = s.values.map((v, i) => `${L + i * bw + bw / 2},${y(v)}`).join(' ')
              return (
                <g key={s.label}>
                  {k === 0 && <polygon points={`${L + bw / 2},${y(0)} ${pts} ${L + (n - 0.5) * bw},${y(0)}`} fill={s.color} opacity={0.12} />}
                  {/* Second line dashed: the series differ by more than colour. */}
                  <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.2} strokeLinejoin="round" strokeDasharray={k === 0 ? undefined : '6 4'} />
                </g>
              )
            })
          : labels.map((l, i) => {
              let base = 0
              return (
                <g key={l}>
                  {series.map((s) => {
                    const v = s.values[i] ?? 0
                    const top = y(base + v)
                    const h = Math.max(0, y(base) - top)
                    if (kind === 'stack') base += v
                    return h > 0 ? <rect key={s.label} x={L + i * bw + bw * 0.15} y={top} width={bw * 0.7} height={h} rx={1.5} fill={s.color} /> : null
                  })}
                </g>
              )
            })}
        {limit && (
          <g>
            <line x1={L} x2={W} y1={y(limit.value)} y2={y(limit.value)} stroke="var(--err)" strokeDasharray="5 4" />
            <text x={W} y={y(limit.value) - 5} textAnchor="end" style={{ fill: 'var(--err)' }}>{limit.label}</text>
          </g>
        )}
      </Box>
      <DataTable caption={summary} labels={labels} series={series} />
    </Box>
  )
}

/** Colour key above a chart. */
export function Legend({ items }: { items: { label: string; color: ChartColor }[] }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }} aria-hidden>
      {items.map((i) => (
        <span key={i.label}><Box component="i" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '3px', mr: 0.5, bgcolor: i.color, verticalAlign: '-1px' }} />{i.label}</span>
      ))}
    </Box>
  )
}

/** Three-quarter ring showing a percentage. */
export function Gauge({ pct, label }: { pct: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const arc = c * 0.75
  const p = Math.max(0, Math.min(100, pct))
  return (
    <Box component="svg" viewBox="0 0 132 120" role="img" aria-label={label} sx={{ width: 132, flex: 'none' }}>
      <circle cx={66} cy={66} r={r} fill="none" stroke="var(--track)" strokeWidth={12} strokeDasharray={`${arc} ${c}`} transform="rotate(135 66 66)" strokeLinecap="round" />
      <circle cx={66} cy={66} r={r} fill="none" stroke={p > 85 ? 'var(--warn)' : 'var(--c1)'} strokeWidth={12} strokeDasharray={`${(arc * p) / 100} ${c}`} transform="rotate(135 66 66)" strokeLinecap="round" />
      <text x={66} y={68} textAnchor="middle" style={{ fontSize: 24, fontWeight: 800, fill: 'var(--mui-palette-text-primary)', fontFamily: tokens.font }}>{Math.round(p)}%</text>
      <text x={66} y={86} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--mui-palette-text-secondary)', fontFamily: tokens.mono }}>used today</text>
    </Box>
  )
}

/** A ranked list with a bar under each label. Real table semantics. */
export function MeterTable({ head, rows, empty = 'Not enough data yet' }: { head: string; rows: [label: string, value: number][]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  if (rows.length === 0) return <Box sx={{ color: 'text.secondary', fontSize: '0.88rem', py: 1 }}>{empty}</Box>
  return (
    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', '& td, & th': { py: 0.75, textAlign: 'left', borderBottom: 1, borderColor: 'divider' }, '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem' } }}>
      <thead><tr><th scope="col">{head}</th><Box component="th" scope="col" sx={{ textAlign: 'right !important' }}>Count</Box></tr></thead>
      <tbody>
        {rows.map(([label, v]) => (
          <tr key={label}>
            <td>
              {label}
              <Box aria-hidden sx={{ height: 6, borderRadius: 3, bgcolor: 'var(--track)', mt: 0.5 }}><Box sx={{ height: '100%', borderRadius: 3, bgcolor: 'var(--c1)', width: `${(v / max) * 100}%` }} /></Box>
            </td>
            <Box component="td" sx={{ textAlign: 'right !important', fontFamily: tokens.mono, width: '4.5rem', verticalAlign: 'top' }}>{compact(v)}</Box>
          </tr>
        ))}
      </tbody>
    </Box>
  )
}

/** Horizontal bars with a value; `unit` "%" shows shares. A list, so each row reads as "label value". */
export function Bars({ rows, unit = '' }: { rows: { label: string; value: number; color?: ChartColor }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {rows.map((r) => (
        <Box component="li" key={r.label} sx={{ display: 'grid', gridTemplateColumns: '9.5rem 1fr 3.5rem', gap: 1.25, alignItems: 'center', fontSize: '0.86rem', my: 0.75 }}>
          <Box component="span" sx={{ color: 'text.secondary' }}>{r.label}</Box>
          <Box aria-hidden sx={{ height: 12, borderRadius: 3, bgcolor: 'var(--track)' }}><Box sx={{ height: '100%', borderRadius: 3, bgcolor: r.color ?? 'var(--c1)', width: `${(r.value / max) * 100}%` }} /></Box>
          <Box component="span" sx={{ textAlign: 'right', fontFamily: tokens.mono }}>{compact(r.value)}{unit}</Box>
        </Box>
      ))}
    </Box>
  )
}
