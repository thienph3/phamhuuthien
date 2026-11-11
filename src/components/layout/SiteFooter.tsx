import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { PageContainer } from './PageContainer'

/** Page footer with a top rule. */
export function SiteFooter({ children }: { children: ReactNode }) {
  return (
    <Box component="footer" sx={{ py: 5, borderTop: 1, borderColor: 'divider' }}>
      <PageContainer>
        <Typography variant="body2" color="text.secondary">
          {children}
        </Typography>
      </PageContainer>
    </Box>
  )
}
