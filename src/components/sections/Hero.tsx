import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { PageContainer } from '../layout/PageContainer'
import { Eyebrow } from '../ui/Eyebrow'

export type HeroProps = { eyebrow: string; headline: ReactNode; lead: string; pov?: string; status?: ReactNode; actions?: ReactNode; photo?: ReactNode; children?: ReactNode }

/** Top-of-page introduction. */
export function Hero({ eyebrow, headline, lead, pov, status, actions, photo, children }: HeroProps) {
  return (
    <Box sx={{ pt: { xs: 8, md: 11 }, pb: { xs: 6, md: 8 } }}>
      <PageContainer>
        {/* Text on the left, photo on the right from md; on phones the photo sits above, small and round. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: photo ? 'minmax(0, 1fr) auto' : '1fr' }, gap: { xs: 3, md: 6 }, alignItems: 'start' }}>
        {photo && <Box sx={{ order: { xs: 0, md: 1 }, pt: { md: 1 } }}>{photo}</Box>}
        <Box sx={{ order: { xs: 1, md: 0 }, minWidth: 0 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Typography variant="h1" component="h1" sx={{ mb: 2.5 }}>{headline}</Typography>
        {pov && (
          // A point of view, set apart from the lead: what I believe about the work.
          <Typography sx={{ fontSize: '1.25rem', maxWidth: 704, mb: 2.5, borderLeft: 3, borderColor: 'primary.main', pl: 2 }}>{pov}</Typography>
        )}
        <Typography sx={{ fontSize: '1.25rem', color: 'text.secondary', maxWidth: 608 }}>{lead}</Typography>
        {status && <Stack direction="row" useFlexGap spacing={1.5} sx={{ my: 3, flexWrap: 'wrap' }}>{status}</Stack>}
        {actions && <Stack direction="row" useFlexGap spacing={2} sx={{ mt: 3, flexWrap: 'wrap' }}>{actions}</Stack>}
        </Box>
        </Box>
        {children}
      </PageContainer>
    </Box>
  )
}
