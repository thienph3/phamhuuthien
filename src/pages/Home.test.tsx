import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { site } from '@/content/site'
import { Home } from './Home'

describe('home page (the brand)', () => {
  it('leads with the hero and point of view, then the brand sections in order, with ways to the CV', () => {
    render(<MemoryRouter><ThemeProvider theme={createTheme()}><Home /></ThemeProvider></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/zero to production/)
    expect(screen.getByText(site.pov)).toBeInTheDocument()
    const order = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(order).toEqual(['Three things I keep doing, wherever I work', 'Four stories, start to finish', 'This page is part of the portfolio', 'Books I read', 'Hi, I’m Thien.', 'Let’s talk.'])
    expect(screen.getByRole('link', { name: 'See selected work' })).toHaveAttribute('href', '#work')
    expect(screen.getByRole('link', { name: 'Full CV' })).toHaveAttribute('href', '/cv')
    expect(screen.getByRole('link', { name: 'Download CV (PDF)' })).toHaveAttribute('href', site.cvPdf)
    // The full history is on /cv, not here.
    expect(screen.queryByRole('heading', { name: 'Where I have worked' })).not.toBeInTheDocument()
  })
})
