import Box, { type BoxProps } from '@mui/material/Box'
import { accentSoft, tokens } from '@/theme'

/**
 * Typography for long-form HTML/MDX content (book chapters, posts). Styles plain elements and a few
 * study callouts: blockquote.objectives, blockquote.takeaways, details.answer, pre.moves, .qrow, .qnote,
 * and move-quality marks (.good .brilliant .inacc .mistake .blunder).
 */
export function Prose({ sx, ...rest }: BoxProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          lineHeight: 1.75,
          '& h1': { ...theme.typography.h2, mt: 0, mb: 2 },
          '& h2': { fontSize: '1.5rem', fontWeight: 750, mt: 5, mb: 1.5 },
          '& h3': { fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 },
          '& p, & ul, & ol': { mt: 0, mb: 2 },
          '& li': { mb: 0.5 },
          '& hr': { border: 0, borderTop: 1, borderColor: 'divider', my: 4 },
          '& a': { color: 'primary.main' },
          '& code': { fontFamily: tokens.mono, fontSize: '0.9em', px: 0.5, borderRadius: 1, bgcolor: 'action.hover' },
          '& pre': { fontFamily: tokens.mono, p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' },
          '& table': { borderCollapse: 'collapse', width: '100%', mb: 2, display: 'block', overflowX: 'auto' },
          '& th, & td': { border: 1, borderColor: 'divider', px: 1.5, py: 0.75, textAlign: 'left' },
          '& blockquote': { m: 0, my: 3, px: 2.5, py: 1.5, borderLeft: 4, borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' },
          '& blockquote > :last-child': { mb: 0 },
          '& blockquote.objectives': { borderColor: 'primary.main', bgcolor: accentSoft },
          '& blockquote.takeaways': { borderColor: 'warning.main', bgcolor: 'color-mix(in srgb, var(--mui-palette-warning-main) 12%, transparent)' },
          '& .qrow': { my: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 },
          '& .qnote': { color: 'text.secondary', fontSize: '0.95rem' },
          '& details.answer': { mt: 1 },
          '& details.answer > summary': { cursor: 'pointer', color: 'primary.main', fontWeight: 650, minHeight: 44, display: 'flex', alignItems: 'center' },
          '& details.answer[open] > summary': { mb: 1 },
          '& .good': { color: 'success.main', fontWeight: 700 },
          '& .brilliant': { color: 'info.main', fontWeight: 700 },
          '& .inacc': { color: 'warning.main', fontWeight: 700 },
          '& .mistake, & .blunder': { color: 'error.main', fontWeight: 700 },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  )
}
