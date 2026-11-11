import Box from '@mui/material/Box'
import { useEffect, useState, type ComponentType } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import type { MDXComponents } from 'mdx/types'
import { BookReader, Prose, SiteLayout } from '@/components'
import { books } from '@/content/site'
import { chapterNeighbours, loadPrivateBook, type PrivateBook } from '@/lib/privateBooks'
import { NotFound } from './NotFound'

type Loaded = { Content: ComponentType<{ components?: MDXComponents }>; title?: string }

/** /books/:slug/read/:chapter. Full text from private/, available only on the local dev server. */
export function BookReaderPage() {
  const { slug = '', chapter = '' } = useParams()
  const meta = books.find((b) => b.slug === slug)
  const [book, setBook] = useState<PrivateBook | null | undefined>(undefined)
  const [loaded, setLoaded] = useState<Loaded | undefined>()

  useEffect(() => {
    let live = true
    loadPrivateBook(slug).then((b) => live && setBook(b ?? null))
    return () => { live = false }
  }, [slug])

  const nav = book ? chapterNeighbours(book.toc, chapter) : undefined
  useEffect(() => {
    let live = true
    setLoaded(undefined)
    nav?.chapter?.load().then((m) => live && setLoaded({ Content: m.default, title: m.metadata?.title }))
    window.scrollTo(0, 0)
    return () => { live = false }
  }, [nav?.chapter])

  useEffect(() => {
    if (loaded?.title) document.title = loaded.title
  }, [loaded])

  if (!meta || book === null) return <NotFound />
  if (book && !chapter && nav?.first) return <Navigate to={`/books/${slug}/read/${nav.first.slug}`} replace />
  if (book && !nav?.chapter) return <NotFound />

  // Render the reader only once the chapter is ready, with the space reserved meanwhile:
  // drawing a placeholder, then the chapter list, then the text made the page jump (layout shift).
  const ready = book && nav && loaded
  return (
    <SiteLayout>
      {ready ? (
        <BookReader bookTitle={meta.title} basePath={`/books/${slug}/read`} toc={book.toc} currentSlug={chapter} prev={nav.prev} next={nav.next}>
          <Prose><loaded.Content components={book.components} /></Prose>
        </BookReader>
      ) : (
        <Box role="status" aria-label="Loading chapter" sx={{ minHeight: '100vh' }} />
      )}
    </SiteLayout>
  )
}
