import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { experience, timelineExtras } from '@/content/site'
import { anchors } from '@/lib/anchors'
import { CareerTimeline, TRACK_COLORS } from './CareerTimeline'

const show = () => render(<ThemeProvider theme={createTheme()}><CareerTimeline jobs={experience} extras={timelineExtras} end={2026.9} /></ThemeProvider>)

describe('CareerTimeline', () => {
  it('has one named button per job that jumps to that job and focuses it', () => {
    show()
    const target = document.createElement('li')
    target.id = anchors.job('MoMo')
    document.body.append(target)
    const momo = screen.getByRole('button', { name: /^MoMo, 2022 – 2023: Data Engineering Lead\. Show details$/ })
    fireEvent.click(momo)
    expect(target).toHaveFocus()
    expect(target).toHaveClass('cv-flash')
    target.remove()
    // One button per job in the "Jump to" row and one in the phone list (CSS shows one of them).
    expect(screen.getAllByRole('button', { name: /Show details$/ })).toHaveLength(experience.length)
  })
  it('shows study and chess, with the unfinished master’s marked', () => {
    show()
    expect(screen.getAllByText('Chess, aiming to go pro').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Master’s coursework (not completed)').length).toBeGreaterThan(0)
    expect(screen.getByText(/Approximate, by year/)).toBeInTheDocument()
  })
  it('spans are ordered and inside the axis', () => {
    for (const j of experience) {
      expect(j.timeline.from).toBeLessThan(j.timeline.to)
      expect(j.timeline.from).toBeGreaterThanOrEqual(2007)
    }
  })
  it('bar colours keep white text readable (contrast ≥ 4.5:1)', () => {
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    for (const c of Object.values(TRACK_COLORS)) expect(1.05 / (lum(c) + 0.05)).toBeGreaterThanOrEqual(4.5)
  })
})
