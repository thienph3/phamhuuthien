import Card, { type CardProps } from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import { Link as RouterLink } from 'react-router-dom'

export type ContentCardProps = Omit<CardProps, 'onClick'> & {
  /** When set, the whole card is one link (a single tab stop, large target). */
  href?: string
}

/** Base card: outlined surface with hover feedback. Everything else builds on it. */
export function ContentCard({ href, children, sx, ...rest }: ContentCardProps) {
  const body = <CardContent sx={{ p: 3, height: '100%' }}>{children}</CardContent>
  return (
    <Card sx={[{ height: '100%', transition: 'transform .2s, border-color .2s', '&:hover': { transform: 'translateY(-3px)', borderColor: 'primary.main' }, '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } } }, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
      {href ? (
        <CardActionArea {...(href.startsWith('/') && !href.startsWith('/#') ? { component: RouterLink, to: href } : { href })} sx={{ height: '100%' }}>
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  )
}
