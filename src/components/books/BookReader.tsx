import MenuBookIcon from '@mui/icons-material/MenuBook'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListSubheader from '@mui/material/ListSubheader'
import Link from '@mui/material/Link'
import { useState, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { Chapter, TocPart } from '@/lib/privateBooks'
import { PageContainer } from '../layout/PageContainer'

export type BookReaderProps = {
  bookTitle: string
  basePath: string
  toc: TocPart[]
  currentSlug: string
  prev?: Chapter
  next?: Chapter
  children: ReactNode
}

function Toc({ toc, basePath, currentSlug, onPick }: Pick<BookReaderProps, 'toc' | 'basePath' | 'currentSlug'> & { onPick?: () => void }) {
  return (
    <Box component="nav" aria-label="Chapters">
      {toc.map((part) => (
        <List key={part.part} dense subheader={<ListSubheader disableSticky sx={{ bgcolor: 'transparent', lineHeight: 2.5, fontWeight: 700 }}>{part.part}</ListSubheader>}>
          {part.chapters.map((c) => {
            const active = c.slug === currentSlug
            return (
              <li key={c.slug}>
                <ListItemButton component={RouterLink} to={`${basePath}/${c.slug}`} selected={active} aria-current={active ? 'page' : undefined} onClick={onPick} sx={{ borderRadius: 1, minHeight: 40 }}>
                  {c.label}
                </ListItemButton>
              </li>
            )
          })}
        </List>
      ))}
    </Box>
  )
}

/** Two-column reader: chapter list (drawer on phones) and content, with previous/next links. */
export function BookReader({ bookTitle, basePath, toc, currentSlug, prev, next, children }: BookReaderProps) {
  const [open, setOpen] = useState(false)
  return (
    <PageContainer sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Link component={RouterLink} to={basePath.replace(/\/read$/, '')} underline="hover">← {bookTitle}</Link>
        <Button startIcon={<MenuBookIcon />} variant="outlined" onClick={() => setOpen(true)} sx={{ display: { md: 'none' }, ml: 'auto' }}>Contents</Button>
      </Box>
      <Drawer open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 300, p: 1 } } }}>
        <Toc toc={toc} basePath={basePath} currentSlug={currentSlug} onPick={() => setOpen(false)} />
      </Drawer>
      <Box sx={{ display: 'grid', gap: 5, gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' } }}>
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 80, alignSelf: 'start', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          <Toc toc={toc} basePath={basePath} currentSlug={currentSlug} />
        </Box>
        <Box component="article" sx={{ minWidth: 0, maxWidth: 760 }}>
          {children}
          <Box component="nav" aria-label="Chapter navigation" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 6, pt: 3, borderTop: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
            {prev ? <Button component={RouterLink} to={`${basePath}/${prev.slug}`} variant="outlined">← {prev.label}</Button> : <span />}
            {next && <Button component={RouterLink} to={`${basePath}/${next.slug}`} variant="contained">{next.label} →</Button>}
          </Box>
        </Box>
      </Box>
    </PageContainer>
  )
}
