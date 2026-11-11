import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import type { Book } from '@/content/types'
import { filterBooks, shelfOrder, topicsOf } from '@/lib/books'
import { BookCard } from '../cards/BookCard'
import { Section } from '../layout/Section'
import { EmptyState } from '../ui/EmptyState'
import { FilterChips } from '../ui/FilterChips'
import { SearchField } from '../ui/SearchField'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Below this many books, search and topic filters are clutter, so they are hidden. */
export const FILTER_THRESHOLD = 6

/** Library with topic filter, search and shelves (reading / read / want). */
export function LibrarySection({ books }: { books: Book[] }) {
  const [topic, setTopic] = useState('all')
  const [query, setQuery] = useState('')
  const visible = useMemo(() => filterBooks(books, topic, query), [books, topic, query])
  const options = [{ value: 'all', label: 'All' }, ...topicsOf(books).map((t) => ({ value: t, label: cap(t) }))]

  return (
    <Section id="library" eyebrow="Library" title="Books I read" description="Notes in my own words on what I read and what I did with it.">
      {books.length >= FILTER_THRESHOLD && (
      <Stack direction="row" useFlexGap spacing={2} sx={{ mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchField value={query} onChange={setQuery} label="Search books" placeholder="Search title, author, topic" />
        <FilterChips options={options} value={topic} onChange={setTopic} label="Filter by topic" />
      </Stack>
      )}
      {visible.length === 0 && <EmptyState>No books match. Try another word or choose All.</EmptyState>}
      {shelfOrder.map(({ status, label }) => {
        const shelf = visible.filter((b) => b.status === status)
        if (shelf.length === 0) return null
        return (
          <Box key={status} component="section" aria-label={label} sx={{ mt: 4 }}>
            <Typography variant="h3" component="h3" sx={{ mb: 2 }}>{label}</Typography>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))' }}>
              {shelf.map((b) => (
                <BookCard key={b.slug} {...b} />
              ))}
            </Box>
          </Box>
        )
      })}
    </Section>
  )
}
