import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Toolbar from '@mui/material/Toolbar'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { NavLink } from '@/content/types'
import { PageContainer } from './PageContainer'

export type SiteHeaderProps = { brand: string; links: NavLink[]; actions?: ReactNode }

/** Sticky top bar. Links scroll sideways on narrow screens instead of overflowing. */
export function SiteHeader({ brand, links, actions }: SiteHeaderProps) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', backgroundImage: 'none' }}>
      <PageContainer>
        <Toolbar disableGutters sx={{ gap: { xs: 2, sm: 3 }, minHeight: 64 }}>
          <Link href="/" underline="none" color="text.primary" sx={{ fontWeight: 800, mr: 'auto', flex: 'none' }}>
            {brand}
            <Box component="span" sx={{ color: 'primary.main' }}>.</Box>
          </Link>
          <Box component="nav" aria-label="Main" sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {links.map((l) => (
              <Link key={l.href} {...(l.href.startsWith('/#') ? { href: l.href } : { component: RouterLink, to: l.href })} underline="none" color="text.secondary" sx={{ py: 1.5, '&:hover': { color: 'primary.main' } }}>
                {l.label}
              </Link>
            ))}
          </Box>
          {actions}
        </Toolbar>
      </PageContainer>
    </AppBar>
  )
}
