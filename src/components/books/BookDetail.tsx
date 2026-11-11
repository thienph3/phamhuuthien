import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import type { Book, BookSection } from '@/content/types'
import { tokens } from '@/theme'
import { BookCover } from '../cards/BookCover'
import { PageContainer } from '../layout/PageContainer'
import { Eyebrow } from '../ui/Eyebrow'
import { BookDemo } from './BookDemo'
import { BookNotes } from './BookNotes'

const slugId = (t: string) => 'section-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const demoTitle = (d: NonNullable<Book['demos']>[number]) => (d.type === 'repertoire' ? (d.title ?? 'My repertoire') : undefined)
const statusLabel = { reading: 'Currently reading', read: 'Read', want: 'Want to read' } as const

/** Reading column, centred; interactive notes break out to the full content width. */
const column = { maxWidth: tokens.proseWidth, mx: 'auto' } as const

/** Keeps chess moves such as 2…Nf6 on one line (no break after the ellipsis). */
export const keepMoves = (text: string) => text.replace(/…(?=\S)/g, '…\u2060')

/** Splits "Lead-in. Rest of the point" at the first '.' or ':' so the lead-in can be bold. */
export function splitLead(text: string): [string, string] {
  const m = text.match(/^(.{3,80}?[.:])(\s.*)?$/)
  return m ? [m[1], m[2] ?? ''] : ['', text]
}

function Section({ s }: { s: BookSection }) {
  const List = s.numbered ? 'ol' : 'ul'
  return (
    <Box component="section" aria-labelledby={slugId(s.title)} sx={{ mt: { xs: 7, md: 9 } }}>
      <Box sx={column}>
        <Typography id={slugId(s.title)} variant="h2" component="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, mb: 2 }}>{s.title}</Typography>
        {s.paragraphs?.map((p) => <Typography key={p} sx={{ mb: 2, fontSize: '1.05rem' }}>{keepMoves(p)}</Typography>)}
        {s.items && (
          <Box component={List} sx={{ pl: s.numbered ? 3.5 : 3, mt: 0, mb: 2, '& li::marker': { color: 'primary.main', fontWeight: 700 } }}>
            {s.items.map((i) => {
              const [lead, rest] = splitLead(keepMoves(i))
              return (
                <Typography component="li" key={i} sx={{ mb: 1.5, pl: 0.5, fontSize: '1.05rem' }}>
                  {lead && <Box component="strong" sx={{ fontWeight: 700 }}>{lead}</Box>}
                  {rest}
                </Typography>
              )
            })}
          </Box>
        )}
        {s.demoHelp && <Typography color="text.secondary" sx={{ mb: 3 }}>{keepMoves(s.demoHelp)}</Typography>}
      </Box>
      {s.demo && <BookDemo demo={s.demo} />}
    </Box>
  )
}

/** A book page written as reader notes: cover header, intro, sections (text and interactive notes), written notes. Content comes only from data. */
export function BookDetail({ book }: { book: Book }) {
  return (
    <PageContainer sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={column}>
        <Link component={RouterLink} to="/#library" underline="hover" sx={{ display: 'inline-block', mb: { xs: 4, md: 5 } }}>← Back to the library</Link>
        <Box component="header" sx={{ display: 'grid', gridTemplateColumns: { xs: '96px 1fr', sm: '132px 1fr' }, gap: { xs: 2.5, sm: 4 }, alignItems: 'center' }}>
          <Box sx={{ borderRadius: 1.5, overflow: 'hidden', boxShadow: '0 8px 24px rgb(0 0 0 / 0.18)' }}>
            <BookCover title={book.title} author={book.author} />
          </Box>
          <Box>
            <Eyebrow>{['Reader notes', ...book.topics].join(' · ')}</Eyebrow>
            <Typography variant="h1" component="h1" sx={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)', mb: 1 }}>{book.title}</Typography>
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>by {book.author}</Typography>
            <Chip size="small" color="primary" variant="outlined" label={statusLabel[book.status]} />
          </Box>
        </Box>
        {book.intro && (
          <Typography sx={{ mt: { xs: 4, md: 6 }, fontSize: { xs: '1.15rem', md: '1.3rem' }, lineHeight: 1.6, color: 'text.secondary' }}>{book.intro}</Typography>
        )}
      </Box>
      {book.demos?.map((d, i) => (
        <Box key={i} component="section" aria-label={demoTitle(d)} sx={{ mt: { xs: 7, md: 9 } }}>
          {demoTitle(d) && <Typography variant="h2" component="h2" sx={{ ...column, fontSize: '1.75rem', mb: 2 }}>{demoTitle(d)}</Typography>}
          <BookDemo demo={d} />
        </Box>
      ))}
      {book.sections?.map((s) => <Section key={s.title} s={s} />)}
      {book.notes && <Box sx={{ ...column, mt: 6 }}><BookNotes notes={book.notes} /></Box>}
      <Box sx={{ ...column, mt: { xs: 7, md: 9 }, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Link component={RouterLink} to="/#library" underline="hover">← More books in the library</Link>
      </Box>
    </PageContainer>
  )
}
