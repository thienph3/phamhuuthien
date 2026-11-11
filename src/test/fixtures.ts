import type { Book } from '@/content/types'

/** Test books, independent of the real library content. Six, so the library shows search and filters. */
export const testBooks: Book[] = [
  { slug: 'colle', title: 'The Colle System', author: 'George Koltanowski', topics: ['chess'], status: 'reading', sections: [{ title: 'Notes' }] },
  { slug: 'data-one', title: 'Data Book One', author: 'Ann Writer', topics: ['data'], status: 'read', rating: 4 },
  { slug: 'english-one', title: 'English Book One', author: 'Ben Writer', topics: ['english'], status: 'read', rating: 5 },
  { slug: 'chess-two', title: 'Chess Book Two', author: 'Cid Writer', topics: ['chess'], status: 'read', rating: 3 },
  { slug: 'data-two', title: 'Data Book Two', author: 'Dee Writer', topics: ['data'], status: 'want' },
  { slug: 'ml-one', title: 'ML Book One', author: 'Eve Writer', topics: ['ml'], status: 'want' },
]
