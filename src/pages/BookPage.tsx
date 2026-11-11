import { useParams } from 'react-router-dom'
import { BookDetail, SiteLayout } from '@/components'
import { books } from '@/content/site'
import { NotFound } from './NotFound'

/** /books/:slug. Works for any book with notes or demos; nothing here is specific to one book. */
export function BookPage() {
  const { slug } = useParams()
  const book = books.find((b) => b.slug === slug)
  if (!book || !(book.notes || book.demos || book.sections)) return <NotFound />
  return (
    <SiteLayout>
      <BookDetail book={book} />
    </SiteLayout>
  )
}
