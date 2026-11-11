import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { testBooks as books } from '@/test/fixtures'
import { LibrarySection } from './sections/LibrarySection'

const renderLibrary = (list = books) => render(<MemoryRouter><ThemeProvider theme={createTheme()}><LibrarySection books={list} /></ThemeProvider></MemoryRouter>)

describe('LibrarySection', () => {
  it('links books that have notes to their page', () => {
    renderLibrary()
    expect(screen.getByRole('link', { name: /The Colle System/ })).toHaveAttribute('href', '/books/colle')
  })
  it('shows every shelf initially', () => {
    renderLibrary()
    expect(screen.getByRole('heading', { name: 'Currently reading' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Read' })).toBeInTheDocument()
  })
  it('filters by topic chip and marks it pressed', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('button', { name: 'Data' }))
    expect(screen.getByRole('button', { name: 'Data' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('heading', { name: 'Currently reading' })).not.toBeInTheDocument()
  })
  it('shows the empty state when search matches nothing', () => {
    renderLibrary()
    fireEvent.change(screen.getByLabelText('Search books'), { target: { value: 'zzz' } })
    expect(screen.getByRole('status')).toHaveTextContent('No books match')
  })
  it('hides search and filters while the library is small', () => {
    renderLibrary(books.slice(0, 2))
    expect(screen.queryByLabelText('Search books')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filter by topic' })).not.toBeInTheDocument()
  })
})
