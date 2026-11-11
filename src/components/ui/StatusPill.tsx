import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { accentSoft, tokens } from '@/theme'

/** Tinted pill with a status dot, e.g. "building: X". */
export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 999, bgcolor: accentSoft, color: 'primary.dark', fontFamily: tokens.mono, fontSize: '0.85rem' }}
    >
      <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
      {children}
    </Box>
  )
}
