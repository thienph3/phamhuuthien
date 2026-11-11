import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Snapshot, StatsResponse } from '@/lib/reportTypes'
import { countryName, pageName, ReportView, type ReportState } from './ReportView'

const NOW = Date.UTC(2026, 10, 11, 12, 0)
const day = (i: number) => new Date(NOW - (6 - i) * 864e5).toISOString().slice(0, 10)
const snap: Snapshot = {
  days: 7, from: day(0), to: day(6), since: '2026-10-01',
  series: [...Array(7)].map((_, i) => ({ day: day(i), views: 10 + i, visits: 5, answered: 2, smallTalk: 1, refused: 1, limited: i === 6 ? 1 : 0, errors: 0, neurons: 210 })),
  current: { views: 91, visits: 35, questions: 30, answered: 14, smallTalk: 7, neurons: 1470, latencyMs: 63000 },
  previous: { views: 70, visits: 40, questions: 0, answered: 0, smallTalk: 0, neurons: 0, latencyMs: 0 },
  latency: { lt2: 2, '2to5': 8, '5to10': 3, gt10: 1 },
  top: { pages: [['home', 60], ['book:colle-system', 20], ['other', 4]], topics: [['Trip dispatch model', 6], ['other', 2]], countries: [['VN', 20], ['other', 5]], refs: [['linkedin', 9], ['direct', 7]] },
  devices: { phone: 12, desktop: 23 },
  via: { search: 4, chat: 3 },
}
const ready = (data: StatsResponse): ReportState => ({ status: 'ready', data })
const today = { neurons: 3712, budget: 9500, limit: 10000 }
const show = (state: ReportState, onDays = vi.fn()) => {
  render(<MemoryRouter><ThemeProvider theme={createTheme()}><ReportView state={state} days={7} onDays={onDays} now={NOW} /></ThemeProvider></MemoryRouter>)
  return onDays
}

describe('ReportView', () => {
  it('shows the key numbers, with change only where there is a previous period', () => {
    show(ready({ ...snap, builtAt: new Date(NOW - 3 * 60_000).toISOString(), today }))
    const kpis = within(screen.getByRole('region', { name: 'Key numbers' }))
    expect(kpis.getByText('91')).toBeInTheDocument()
    expect(kpis.getByText('▲ 30% vs previous')).toBeInTheDocument() // views 70 → 91
    expect(kpis.getByText('▼ 12% vs previous')).toBeInTheDocument() // visits 40 → 35 (−12.5% rounds to −12)
    expect(kpis.getByText('61%')).toBeInTheDocument() // 14 / (30 - 7)
    expect(kpis.getByText('4.5 s')).toBeInTheDocument()
    expect(screen.getByText(/Updated 3 min ago/)).toBeInTheDocument()
  })
  it('shows no change figure while the previous period is only partly covered by data', () => {
    show(ready({ ...snap, since: day(-3), builtAt: new Date(NOW).toISOString(), today }))
    expect(screen.queryByText(/vs previous/)).not.toBeInTheDocument()
  })
  it('averages the quota over the days with data', () => {
    show(ready({ ...snap, since: day(4), current: { ...snap.current, neurons: 3000 }, builtAt: new Date(NOW).toISOString(), today }))
    expect(within(screen.getByRole('region', { name: 'Key numbers' })).getByText('10%')).toBeInTheDocument() // 3000 / (3 days × 10k)
  })
  it('shows today’s quota and answers left from the real Neurons per answer', () => {
    show(ready({ ...snap, builtAt: new Date(NOW).toISOString(), today }))
    expect(screen.getByRole('img', { name: '37% of today’s quota used' })).toBeInTheDocument()
    expect(screen.getByText('~55')).toBeInTheDocument() // (9500 - 3712) / 105
  })
  it('every chart has a text alternative and its data as a table', () => {
    show(ready({ ...snap, builtAt: new Date(NOW).toISOString(), today }))
    expect(screen.getByRole('img', { name: /Page views and visits per day over 7 days: 91 views, 35 visits/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Chatbot questions per day by outcome/ })).toBeInTheDocument()
    expect(screen.getAllByRole('table').length).toBeGreaterThanOrEqual(6)
  })
  it('names pages, countries and referrers; keys are never shown raw', () => {
    show(ready({ ...snap, builtAt: new Date(NOW).toISOString(), today }))
    expect(screen.getByText('The Colle System')).toBeInTheDocument()
    expect(screen.getByText('Vietnam')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.queryByText('book:colle-system')).not.toBeInTheDocument()
    expect(pageName('book:unknown')).toBe('Other')
    expect(countryName('other')).toBe('Other')
  })
  it('switches the period', () => {
    const onDays = show(ready({ ...snap, builtAt: new Date(NOW).toISOString(), today }))
    fireEvent.click(screen.getByRole('button', { name: '30 days' }))
    expect(onDays).toHaveBeenCalledWith(30)
  })
  it('empty, loading and error states', () => {
    const { unmount } = render(<MemoryRouter><ThemeProvider theme={createTheme()}><ReportView state={ready({ empty: true, today })} days={7} onDays={() => {}} /></ThemeProvider></MemoryRouter>)
    expect(screen.getByText(/No data yet/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How this report works' })).toBeInTheDocument()
    unmount()
    show({ status: 'error' })
    expect(screen.getByText(/Report data is unavailable right now/)).toBeInTheDocument()
  })
})
