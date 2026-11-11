import Link from '@mui/material/Link'

/** First focusable element; lets keyboard users jump past the navigation. */
export function SkipLink({ href = '#main' }: { href?: string }) {
  return (
    <Link
      href={href}
      sx={{ position: 'absolute', left: -9999, top: 0, zIndex: 2000, bgcolor: 'primary.main', color: 'primary.contrastText', px: 2, py: 1, '&:focus': { left: 0 } }}
    >
      Skip to content
    </Link>
  )
}
