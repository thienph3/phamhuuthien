import type { Book, BookStatus } from '@/content/types'

/** Filters books by topic ('all' matches everything) and a free-text query over title, author and topics. */
export function filterBooks(books: Book[], topic: string, query: string): Book[] {
  const q = query.trim().toLowerCase()
  return books.filter((b) => {
    const topicOk = topic === 'all' || b.topics.includes(topic)
    const textOk = q === '' || [b.title, b.author, ...b.topics].some((s) => s.toLowerCase().includes(q))
    return topicOk && textOk
  })
}

export const shelfOrder: { status: BookStatus; label: string }[] = [
  { status: 'reading', label: 'Currently reading' },
  { status: 'read', label: 'Read' },
  { status: 'want', label: 'Want to read' },
]

/** Unique topics across books, sorted, for building filter chips. */
export function topicsOf(books: Book[]): string[] {
  return [...new Set(books.flatMap((b) => b.topics))].sort()
}
