import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { lazy, Suspense, useEffect, useState } from 'react'
import { PageContainer, SiteLayout } from '@/components'
import type { Period, ReportState } from '@/components/report/ReportView'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { StatsResponse } from '@/lib/reportTypes'
import { tokens } from '@/theme'

// Charts load as their own chunk; the heading and intro render at once (fast first paint).
const ReportView = lazy(() => import('@/components/report/ReportView').then((m) => ({ default: m.ReportView })))

/** Reads /api/stats for one period. Anything unexpected is an error state, never a crash. */
export async function loadStats(days: Period, signal?: AbortSignal): Promise<ReportState> {
  try {
    const res = await fetch(`/api/stats?days=${days}`, { signal })
    if (!res.ok) return { status: 'error' }
    const data = (await res.json()) as StatsResponse
    if (!data || typeof data !== 'object' || !data.today) return { status: 'error' }
    return { status: 'ready', data }
  } catch {
    return { status: 'error' }
  }
}

/** /report: the public site report. */
export function Report() {
  const [days, setDays] = useState<Period>(30)
  const [state, setState] = useState<ReportState>({ status: 'loading' })
  useEffect(() => {
    const before = document.title
    document.title = 'Site report · Thien Pham'
    return () => {
      document.title = before
    }
  }, [])
  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading' })
    loadStats(days, ctrl.signal).then((s) => !ctrl.signal.aborted && setState(s))
    return () => ctrl.abort()
  }, [days])
  return (
    <SiteLayout>
      <PageContainer sx={{ pt: { xs: 5, md: 7 } }}>
        <Eyebrow>Report · built on this site’s own data</Eyebrow>
        <Typography variant="h1" sx={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', mb: 1.5 }}>How this site is used</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: tokens.proseWidth }}>
          Live numbers from this website: visits, what people read, and how the AI chatbot is doing against its free daily quota. The report keeps daily totals only: no cookies, nothing on your device, and no IP addresses or chat text.
        </Typography>
        <Suspense fallback={<Box sx={{ minHeight: '100vh' }} />}>
          <ReportView state={state} days={days} onDays={setDays} />
        </Suspense>
      </PageContainer>
    </SiteLayout>
  )
}
