import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { experience, proof, stories, themes } from '@/content/site'
import { anchors } from '@/lib/anchors'
import { OPEN_CHAT_EVENT } from '../chat/ChatWidget'
import { OPEN_SEARCH_EVENT } from '../search/SiteSearch'
import { BuiltIntoSiteSection, KnownForSection, ProofStrip, SelectedWorkSection } from './BrandSections'

const wrap = (ui: React.ReactNode) => render(<MemoryRouter><ThemeProvider theme={createTheme()}>{ui}</ThemeProvider></MemoryRouter>)
const cvAnchors = new Set(experience.flatMap((j) => [anchors.job(j.company), ...j.highlights.map((h) => anchors.highlight(j.company, h.title))]))

describe('brand sections', () => {
  it('every theme and story links to a real entry on the CV', () => {
    for (const href of [...themes.map((t) => t.link.href), ...stories.map((s) => s.href)]) {
      expect(href).toMatch(/^\/cv#/)
      expect(cvAnchors.has(href.slice(4))).toBe(true)
    }
  })
  it('proof numbers are stated in the experience text (no number the CV does not back)', () => {
    const all = experience.flatMap((j) => j.highlights.map((h) => `${h.title} ${h.text}`)).join(' ')
    for (const p of proof) expect(all).toContain(p.value === '1 YAML file' ? 'one YAML file' : p.value === '7' ? 'seven ML engineers' : p.value)
  })
  it('themes do not repeat what the proof strip and stories already say', () => {
    const repeats = ['5–7', '15–20', '75%', 'YAML', 'seven', 'event structure', ...stories.map((s) => s.title)]
    for (const t of themes) for (const r of repeats) expect(`${t.title} ${t.text}`).not.toContain(r)
  })
  it('renders the proof strip, themes and stories', () => {
    wrap(<><ProofStrip items={proof} /><KnownForSection themes={themes} /><SelectedWorkSection stories={stories} /></>)
    expect(screen.getByRole('list', { name: 'In numbers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Let people serve themselves' })).toBeInTheDocument()
    for (const s of stories) expect(screen.getByRole('link', { name: `Read it on the CV: ${s.title}` })).toHaveAttribute('href', s.href)
  })
  it('the site tiles open the chat and the search', () => {
    const seen: string[] = []
    const on = (e: Event) => seen.push(e.type)
    window.addEventListener(OPEN_CHAT_EVENT, on)
    window.addEventListener(OPEN_SEARCH_EVENT, on)
    wrap(<BuiltIntoSiteSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Ask a question' }))
    fireEvent.click(screen.getByRole('button', { name: 'Try search' }))
    expect(seen).toEqual([OPEN_CHAT_EVENT, OPEN_SEARCH_EVENT])
    expect(screen.getByRole('link', { name: 'Open the report' })).toHaveAttribute('href', '/report')
  })
})
