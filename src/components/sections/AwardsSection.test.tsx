import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render, screen, within } from '@testing-library/react'
import { awards, education, publications } from '@/content/site'
import { AwardsSection } from './AwardsSection'

const show = () => render(<ThemeProvider theme={createTheme()}><AwardsSection education={education} awards={awards} publications={publications} /></ThemeProvider>)

describe('AwardsSection', () => {
  it('lists the awards newest first and the papers newest first', () => {
    show()
    const [edu, aw, pubs] = screen.getAllByRole('list')
    expect(within(edu).getAllByRole('listitem').map((li) => li.textContent!.slice(0, 4))).toEqual(['2020', '2012', '2004'])
    expect(within(aw).getAllByRole('listitem')[0]).toHaveTextContent('Second prize, team · ACM ICPC Vietnam National')
    const years = within(pubs).getAllByRole('listitem').map((li) => Number(li.textContent!.slice(0, 4)))
    expect(years).toEqual([...years].sort((a, b) => b - a))
  })
  it('shows each author list as published, with my name in bold at its real position', () => {
    show()
    for (const p of publications) {
      const item = screen.getByRole('heading', { level: 4, name: p.title }).closest('li')!
      expect(item).toHaveTextContent(p.authors.join(', '))
      expect(item.querySelector('strong')).toHaveTextContent('T. Pham')
      expect(p.authors[p.me]).toBe('T. Pham')
    }
  })
  it('every paper links to its DOI with a distinct accessible name; the FIDE profile is linked', () => {
    show()
    for (const p of publications) expect(screen.getByRole('link', { name: `DOI for ${p.title}` })).toHaveAttribute('href', `https://doi.org/${p.doi}`)
    expect(screen.getByRole('link', { name: 'FIDE profile' })).toHaveAttribute('href', 'https://ratings.fide.com/profile/561016578')
  })
  it('unfinished study is labelled as not completed', () => {
    show()
    expect(screen.getByText(/Master’s coursework in Data Science \(not completed\)/)).toBeInTheDocument()
    for (const e of education) if (/master/i.test(e.title)) expect(e.title).toMatch(/not completed/)
  })
  it('data guards: links are https only, DOIs are well-formed (no ?, # or spaces that could change the URL)', () => {
    for (const a of awards) if (a.link) expect(a.link.href).toMatch(/^https:\/\//)
    for (const p of publications) expect(p.doi).toMatch(/^10\.\d{4,9}\/[^\s?#]+$/)
    expect(new Set(awards.map((a) => a.org)).size).toBe(awards.length)
    expect(new Set(education.map((e) => e.school)).size).toBe(education.length)
  })
})
