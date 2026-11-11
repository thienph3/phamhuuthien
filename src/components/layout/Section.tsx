import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { tokens } from '@/theme'
import { Eyebrow } from '../ui/Eyebrow'
import { PageContainer } from './PageContainer'

export type SectionProps = {
  id: string
  eyebrow: string
  title: string
  description?: string
  /** Narrow, readable text width. The left edge stays aligned with the other sections. */
  prose?: boolean
  children: ReactNode
}

/** Page section with eyebrow + heading, linked to its heading for screen readers. */
export function Section({ id, eyebrow, title, description, prose = false, children }: SectionProps) {
  return (
    <Box component="section" id={id} aria-labelledby={`${id}-title`} sx={{ py: { xs: 7, md: 9 }, borderTop: 1, borderColor: 'divider', scrollMarginTop: 72 }}>
      <PageContainer>
        <Box sx={prose ? { maxWidth: tokens.proseWidth } : undefined}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Typography id={`${id}-title`} variant="h2" component="h2" sx={{ mb: description ? 1 : 3 }}>
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 'sm' }}>
            {description}
          </Typography>
        )}
        {children}
        </Box>
      </PageContainer>
    </Box>
  )
}
