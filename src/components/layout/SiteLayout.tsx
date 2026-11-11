import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import { useRef, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { books, experience, navLinks, site } from '@/content/site'
import { buildSiteDocs } from '@/lib/search/siteDocs'
import { SearchHighlight } from '../search/SearchHighlight'
import { SiteSearch } from '../search/SiteSearch'
import { ThemeToggle } from '../ui/ThemeToggle'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { SkipLink } from './SkipLink'

/** Everything the site search can find, built once from the content. */
const searchDocs = buildSiteDocs({ site, experience, books })

/** Shared page frame: skip link, header (with search), main landmark, footer. Every page uses it. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null)
  return (
    <Box id="top">
      <SkipLink />
      <SiteHeader brand={site.brand} links={navLinks} actions={<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><SiteSearch docs={searchDocs} /><ThemeToggle /></Stack>} />
      <Box component="main" id="main" ref={main}>{children}</Box>
      <SearchHighlight root={main} />
      <SiteFooter>
        © {site.year} {site.name} · <Link component={RouterLink} to="/report" color="inherit" underline="always">Site report</Link>
      </SiteFooter>
    </Box>
  )
}
