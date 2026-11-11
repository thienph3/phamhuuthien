import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

/** Polite status message shown when a list has no items. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Typography role="status" color="text.secondary" sx={{ py: 3 }}>
      {children}
    </Typography>
  )
}
