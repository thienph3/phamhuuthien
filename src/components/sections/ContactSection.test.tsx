import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { ContactSection } from './ContactSection'

const renderIt = (props: Parameters<typeof ContactSection>[0]) => render(<ThemeProvider theme={createTheme()}><ContactSection {...props} /></ThemeProvider>)

describe('ContactSection', () => {
  it('shows a button for each link that is set, email first', () => {
    renderIt({ note: 'Say hi.', email: 'me@example.com', github: 'https://github.com/me', linkedin: 'https://www.linkedin.com/in/me' })
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Email me', 'LinkedIn', 'GitHub'])
    expect(screen.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', 'mailto:me@example.com')
  })
  it('opens external links safely in a new tab', () => {
    renderIt({ note: 'Say hi.', github: 'https://github.com/me' })
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('rel', 'noopener noreferrer')
  })
  it('leaves out links that are not set', () => {
    renderIt({ note: 'Say hi.', github: 'https://github.com/me' })
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
