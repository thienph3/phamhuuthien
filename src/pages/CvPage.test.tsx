import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { site } from '@/content/site'
import { Cv } from './Cv'

describe('/cv page', () => {
  it('has the download link, the timeline, experience, education and languages', () => {
    render(<MemoryRouter><ThemeProvider theme={createTheme()}><Cv /></ThemeProvider></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('href', site.cvPdf)
    expect(screen.getByRole('heading', { level: 2, name: 'Career at a glance' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Where I have worked' })).toBeInTheDocument()
    expect(screen.getByText(/B1 \(intermediate\)/)).toBeInTheDocument()
    expect(document.title).toMatch(/^CV · Thien Pham/)
  })
})
