import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { navLinks, site } from '@/content/site'
import { ThemeToggle } from '../ui/ThemeToggle'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { SkipLink } from './SkipLink'

/** Shared page frame: skip link, header, main landmark, footer. Every page uses it. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <Box id="top">
      <SkipLink />
      <SiteHeader brand={site.brand} links={navLinks} actions={<ThemeToggle />} />
      <Box component="main" id="main">{children}</Box>
      <SiteFooter>© {site.year} {site.name}</SiteFooter>
    </Box>
  )
}
