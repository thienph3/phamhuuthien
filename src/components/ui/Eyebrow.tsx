import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { tokens } from '@/theme'

/** Small uppercase label above a heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{ fontFamily: tokens.mono, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'primary.main', mb: 1 }}
    >
      {children}
    </Typography>
  )
}
