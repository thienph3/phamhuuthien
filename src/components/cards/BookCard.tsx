import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import type { Book } from '@/content/types'
import { accentSoft, tokens } from '@/theme'
import { ContentCard } from './ContentCard'
import { BookCover } from './BookCover'

const statusLabel = { reading: 'reading', read: 'read', want: 'want to read' } as const

/** Library entry: generated cover, title, author, status or rating. */
export function BookCard({ slug, title, author, status, rating, notes, demos, sections }: Book) {
  return (
    <ContentCard href={notes || demos || sections ? `/books/${slug}` : undefined} component="article" sx={{ '& .MuiCardContent-root': { p: 0 } }}>
      <BookCover title={title} author={author} decorative={false} />
      <Box sx={{ p: 1.5 }}>
        {status === 'read' && rating ? (
          <Rating value={rating} readOnly size="small" sx={{ mt: 0.5 }} />
        ) : (
          <Box component="span" sx={{ display: 'inline-block', mt: 0.5, px: 1, borderRadius: 1.5, bgcolor: accentSoft, color: 'primary.dark', fontFamily: tokens.mono, fontSize: '0.7rem' }}>
            {statusLabel[status]}
          </Box>
        )}
      </Box>
    </ContentCard>
  )
}
