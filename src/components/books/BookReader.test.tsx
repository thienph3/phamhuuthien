import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { TocPart } from '@/lib/privateBooks'
import { BookReader } from './BookReader'

const load = async () => ({ default: () => null })
const toc: TocPart[] = [{ part: 'Part 1', chapters: [{ slug: 'a', label: 'Chapter A', load }, { slug: 'b', label: 'Chapter B', load }, { slug: 'c', label: 'Chapter C', load }] }]

describe('BookReader', () => {
  it('marks the current chapter and links previous and next', () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={createTheme()}>
          <BookReader bookTitle="Book" basePath="/books/x/read" toc={toc} currentSlug="b" prev={toc[0].chapters[0]} next={toc[0].chapters[2]}>
            <p>body</p>
          </BookReader>
        </ThemeProvider>
      </MemoryRouter>,
    )
    const chapters = screen.getAllByRole('navigation', { name: 'Chapters' })[0]
    expect(within(chapters).getByRole('link', { name: 'Chapter B' })).toHaveAttribute('aria-current', 'page')
    const pager = screen.getByRole('navigation', { name: 'Chapter navigation' })
    expect(within(pager).getByRole('link', { name: /Chapter A/ })).toHaveAttribute('href', '/books/x/read/a')
    expect(within(pager).getByRole('link', { name: /Chapter C/ })).toHaveAttribute('href', '/books/x/read/c')
    expect(screen.getByRole('link', { name: '← Book' })).toHaveAttribute('href', '/books/x')
  })
})
