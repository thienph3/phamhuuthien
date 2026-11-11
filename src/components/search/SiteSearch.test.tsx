import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { SearchDoc } from '@/lib/search/bm25'
import { SiteSearch } from './SiteSearch'

const docs: SearchDoc[] = [
  { id: 'chat', page: 'Home', section: 'Experience · Vinamilk', title: 'Chatbot answers faster', text: 'I added ML models to the chatbot pipeline.', url: '/#exp-vinamilk-chatbot' },
  { id: 'colle', page: 'The Colle System', section: 'Reader notes', title: 'Five core ideas', text: 'The Colle setup every game.', url: '/books/colle-system#section-five-core-ideas' },
]

function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.pathname + l.search + l.hash}</output>
}
const setup = () => {
  render(<MemoryRouter><ThemeProvider theme={createTheme()}><SiteSearch docs={docs} /><Where /></ThemeProvider></MemoryRouter>)
  return screen.getByRole('combobox', { name: 'Search this site' })
}

describe('SiteSearch', () => {
  it('shows matching sections in a dropdown while typing', () => {
    const box = setup()
    fireEvent.focus(box)
    fireEvent.change(box, { target: { value: 'chat' } })
    expect(box).toHaveAttribute('aria-expanded', 'true')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('Chatbot answers faster')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })
  it('opens the chosen page at its section with the query for highlighting', () => {
    const box = setup()
    fireEvent.focus(box)
    fireEvent.change(box, { target: { value: 'colle' } })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(screen.getByTestId('where')).toHaveTextContent('/books/colle-system?q=colle#section-five-core-ideas')
    expect(box).toHaveValue('')
  })
  it('opens a result on click', () => {
    const box = setup()
    fireEvent.focus(box)
    fireEvent.change(box, { target: { value: 'chatbot' } })
    fireEvent.click(screen.getByRole('option'))
    expect(screen.getByTestId('where')).toHaveTextContent('/?q=chatbot#exp-vinamilk-chatbot')
  })
  it('moves through results with the arrow keys and closes with Escape', () => {
    const box = setup()
    fireEvent.focus(box)
    fireEvent.change(box, { target: { value: 'the' } }) // stop word only: no results
    expect(screen.getByRole('option')).toHaveTextContent('No results')
    fireEvent.change(box, { target: { value: 'c' } }) // prefix: both
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(box).toHaveValue('')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
  it('focuses with the / key', () => {
    const box = setup()
    fireEvent.keyDown(window, { key: '/' })
    return new Promise((r) => setTimeout(r, 5)).then(() => expect(box).toHaveFocus())
  })
})
