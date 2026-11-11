import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BookDetail } from '@/components/books/BookDetail'
import { ExperienceSection } from '@/components/sections/ExperienceSection'
import { books, experience, site } from '@/content/site'
import { createIndex } from './bm25'
import { buildSiteDocs } from './siteDocs'

const docs = buildSiteDocs({ site, experience, books })

describe('site search documents', () => {
  it('give every section a unique id and URL', () => {
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length)
    expect(new Set(docs.map((d) => d.url)).size).toBe(docs.length)
  })
  it('cover About, every job, the library, each book section and contact', () => {
    const jobDocs = docs.filter((d) => d.section.startsWith('Experience'))
    expect(jobDocs.length).toBe(experience.reduce((n, j) => n + (j.early ? 1 : j.highlights.length), 0))
    expect(docs.map((d) => d.id)).toEqual(expect.arrayContaining(['about', 'library', 'contact']))
  })
  it('point to anchors that exist on the rendered pages', () => {
    const wrap = (ui: React.ReactNode) => render(<MemoryRouter><ThemeProvider theme={createTheme()}>{ui}</ThemeProvider></MemoryRouter>)
    const { container: home, unmount } = wrap(<ExperienceSection jobs={experience} />)
    for (const d of docs.filter((x) => x.section.startsWith('Experience'))) expect(home.querySelector(`[id="${d.url.split('#')[1]}"]`), d.url).not.toBeNull()
    unmount()
    for (const book of books.filter((b) => b.sections)) {
      const { container, unmount: done } = wrap(<BookDetail book={{ ...book, sections: book.sections?.map((s) => ({ ...s, demo: undefined })) }} />)
      for (const d of docs.filter((x) => x.url.startsWith(`/books/${book.slug}#`))) expect(container.querySelector(`[id="${d.url.split('#')[1]}"]`), d.url).not.toBeNull()
      done()
    }
  })
  it('find real content', () => {
    const { search } = createIndex(docs)
    expect(search('ekyc').hits[0].doc.section).toBe('Experience · FE Credit')
    expect(search('pham huu thien').hits[0].doc.id).toBe('about')
    expect(search('colle').hits.some((h) => h.doc.url.startsWith('/books/colle-system'))).toBe(true)
  })
})
