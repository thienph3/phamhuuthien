import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { PageContainer } from '../layout/PageContainer'
import { Eyebrow } from '../ui/Eyebrow'

export type HeroProps = { eyebrow: string; headline: ReactNode; lead: string; status?: ReactNode; actions?: ReactNode }

/** Top-of-page introduction. */
export function Hero({ eyebrow, headline, lead, status, actions }: HeroProps) {
  return (
    <Box sx={{ pt: { xs: 8, md: 11 }, pb: { xs: 6, md: 8 } }}>
      <PageContainer>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Typography variant="h1" component="h1" sx={{ mb: 2.5 }}>{headline}</Typography>
        <Typography sx={{ fontSize: '1.25rem', color: 'text.secondary', maxWidth: 608 }}>{lead}</Typography>
        {status && <Stack direction="row" useFlexGap spacing={1.5} sx={{ my: 3, flexWrap: 'wrap' }}>{status}</Stack>}
        {actions && <Stack direction="row" useFlexGap spacing={2} sx={{ mt: 3, flexWrap: 'wrap' }}>{actions}</Stack>}
      </PageContainer>
    </Box>
  )
}
