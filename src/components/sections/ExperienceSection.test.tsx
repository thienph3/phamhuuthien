import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render, screen, within } from '@testing-library/react'
import { ExperienceSection } from './ExperienceSection'

const jobs = [
  { company: 'NewCo', role: 'Software Engineer', period: '2024 – now', highlights: [{ title: 'Platform redesign', text: 'Made it faster.', status: 'production' as const }] },
  { company: 'OldCo', role: 'Data Engineer', highlights: [{ title: 'Prototype', text: 'Tried an idea.', status: 'prototype' as const, tags: ['ML'] }] },
]

describe('ExperienceSection', () => {
  it('lists jobs in the given order with role, period and highlights', () => {
    render(<ThemeProvider theme={createTheme()}><ExperienceSection jobs={jobs} /></ThemeProvider>)
    const items = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(items).toEqual(['NewCo', 'OldCo'])
    expect(screen.getByText('2024 – now')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Platform redesign' })).toBeInTheDocument()
  })
  it('marks what shipped and what stayed a prototype', () => {
    render(<ThemeProvider theme={createTheme()}><ExperienceSection jobs={jobs} /></ThemeProvider>)
    expect(screen.getByText('In production')).toBeInTheDocument()
    expect(within(screen.getByText('Tried an idea.').closest('li')!).getByText('Prototype', { selector: '.MuiChip-label' })).toBeInTheDocument()
  })
  it('shows early-career jobs compactly under Earlier', () => {
    const withEarly = [...jobs, { company: 'FirstCo', role: 'Engineer', period: '2016', early: true, highlights: [{ title: 'Learned process', text: 'Disciplined delivery.' }] }]
    render(<ThemeProvider theme={createTheme()}><ExperienceSection jobs={withEarly} /></ThemeProvider>)
    expect(screen.getByRole('heading', { level: 3, name: 'Earlier' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'FirstCo' })).not.toBeInTheDocument()
    expect(screen.getByText('FirstCo')).toBeInTheDocument()
    expect(screen.getByText('Learned process.')).toBeInTheDocument()
  })
})
