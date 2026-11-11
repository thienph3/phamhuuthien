import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Deep-to-light green gradients; one is picked from the title so covers stay stable. */
const gradients = [
  'linear-gradient(160deg,#065f46,#10b981)',
  'linear-gradient(160deg,#134e4a,#0d9488)',
  'linear-gradient(160deg,#14532d,#65a30d)',
  'linear-gradient(160deg,#064e3b,#047857)',
]

function pick(title: string): string {
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return gradients[h % gradients.length]
}

/**
 * Typographic book cover generated from title + author, so no copyrighted artwork is needed.
 * `decorative` (default) hides it from screen readers; set false when the cover is the only place the title appears.
 */
export function BookCover({ title, author, decorative = true }: { title: string; author: string; decorative?: boolean }) {
  return (
    <Box
      aria-hidden={decorative || undefined}
      sx={{ aspectRatio: '2 / 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2, color: '#fff', background: pick(title) }}
    >
      <Typography component="span" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
      <Typography component="span" variant="caption" sx={{ opacity: 0.85 }}>{author}</Typography>
    </Box>
  )
}
