import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { buildRepertoire } from '@/lib/chess/repertoire'
import { chapterName, RepertoireExplorer } from './RepertoireExplorer'

// The board library needs real layout to animate moves (checked in a real browser); stub it here.
vi.mock('./BoardView', () => ({ BoardView: ({ fen }: { fen: string }) => <div data-testid="board">{fen}</div> }))

const { repertoire } = buildRepertoire(
  [
    { page: 'game01', label: 'Game 1', game: { moves: ['d4', 'd5', 'Nf3', 'Nf6'] } },
    { page: 'game02', label: 'Game 2', game: { moves: ['d4', 'Nf6', 'Nf3', 'd5'] } },
    { page: 'my-repertoire', label: 'My repertoire: vs d5', game: { moves: ['d4', 'd5'] } },
  ],
  24,
)

const renderIt = () =>
  render(<ThemeProvider theme={createTheme()}><RepertoireExplorer repertoire={repertoire} notes={{ '1.d4 d5 2.Nf3 Nf6': 'My Colle note' }} /></ThemeProvider>)

describe('RepertoireExplorer', () => {
  it('lists moves with how many lines played them and marks my lines', () => {
    renderIt()
    expect(screen.getByRole('button', { name: 'd4, played in 3 lines, in my repertoire' })).toBeInTheDocument()
  })
  it('plays a move, shows the path, and goes back', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: /^d4,/ }))
    expect(screen.getByText('Black to move')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^d5, played in 2 lines/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back one move' }))
    expect(screen.getByText('White to move')).toBeInTheDocument()
  })
  it('shows my note for a position reached by either move order', () => {
    renderIt()
    for (const san of ['d4', 'Nf6', 'Nf3', 'd5']) fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${san},`) }))
    expect(screen.getByRole('note')).toHaveTextContent('My Colle note')
    expect(screen.getByText(/Reached in 1 line/)).toBeInTheDocument()
  })
})

describe('chapterName', () => {
  it('turns internal source labels into chapter names for readers', () => {
    expect(chapterName('Part One — Lesson 2, question 3 (line 2)')).toBe('Lesson 2 (exercise)')
    expect(chapterName('Part One — Lesson 4 (line 5)')).toBe('Lesson 4')
    expect(chapterName('Part Four — The Colle System Resume (line 2)')).toBe('Resume')
    expect(chapterName('My repertoire: vs 2…Bg4')).toBe('my repertoire')
  })
})
