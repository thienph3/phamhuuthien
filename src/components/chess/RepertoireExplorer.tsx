import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import UndoIcon from '@mui/icons-material/Undo'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { formatMovePath, positionKey, replay, resolveNotes, type Repertoire } from '@/lib/chess/repertoire'
import { accentSoft, tokens } from '@/theme'
import { BoardView } from './BoardView'

export type RepertoireExplorerProps = {
  repertoire: Repertoire
  /** Your notes keyed by move path, e.g. { '1.d4 d5 2.Nf3': 'note' }. */
  notes?: Record<string, string>
  /** Source page id whose lines are marked "my line" (default 'my-repertoire'). */
  myPage?: string
}

const MAX_SOURCES = 5

/** "Part One — Lesson 2, question 3 (line 2)" → "Lesson 2 (exercise)"; duplicates removed by the caller. */
export function chapterName(label: string): string {
  return label
    .replace(/ \(line \d+\)$/, '')
    .replace(/, question \d+$/, ' (exercise)')
    .replace(/^Part [A-Za-z]+ — /, '')
    .replace(/^The Colle System /, '')
    .replace(/^My repertoire: .*/, 'my repertoire')
}

/**
 * Opening tree explorer: the board, the moves played from the current position (most played first,
 * with how many lines played them), the path so far, your note for the position, and where it was seen.
 * Keyboard: → plays the most common move, ← takes one back, Home returns to the start.
 */
export function RepertoireExplorer({ repertoire, notes = {}, myPage = 'my-repertoire' }: RepertoireExplorerProps) {
  const [path, setPath] = useState<string[]>([])
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const noteByPosition = useMemo(() => resolveNotes(notes), [notes])
  const mine = useMemo(() => new Set(repertoire.sources.filter((s) => s.page === myPage).map((s) => s.id)), [repertoire, myPage])

  const { fen, lastMove } = useMemo(() => replay(path), [path])
  const key = positionKey(fen)
  const position = repertoire.positions[key]
  const moves = position?.moves ?? []
  const total = moves.reduce((n, m) => n + m.sources.length, 0)

  // Lines that reached this position: those that played the last move from the previous position.
  const reachedBy = useMemo(() => {
    if (path.length === 0) return repertoire.sources
    const prev = repertoire.positions[positionKey(replay(path.slice(0, -1)).fen)]
    const ids = prev?.moves.find((m) => m.san === path[path.length - 1])?.sources ?? []
    return repertoire.sources.filter((s) => ids.includes(s.id))
  }, [path, repertoire])

  const play = (san: string) => setPath((p) => [...p, san])
  const back = () => setPath((p) => p.slice(0, -1))
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') back()
    else if (e.key === 'ArrowRight' && moves[0]) play(moves[0].san)
    else if (e.key === 'Home') setPath([])
    else return
    e.preventDefault()
  }

  const side = position?.toMove === 'black' ? 'Black' : 'White'
  const note = noteByPosition[key]
  const btn = { border: 1, borderColor: 'divider', width: 44, height: 44 }

  return (
    <Box role="group" aria-label="Repertoire explorer. Arrow keys: right plays the main move, left goes back." tabIndex={0} onKeyDown={onKeyDown}
      sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 400px) minmax(0, 1fr)' }, alignItems: 'start', border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 2, md: 3 }, bgcolor: 'background.paper' }}>
      <Box sx={{ minWidth: 0 }}>
        <BoardView fen={fen} lastMove={lastMove} orientation={orientation} size={400} />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5 }}>
          <IconButton aria-label="Back one move" onClick={back} disabled={path.length === 0} sx={btn}><UndoIcon /></IconButton>
          <IconButton aria-label="Back to the start" onClick={() => setPath([])} disabled={path.length === 0} sx={btn}><RestartAltIcon /></IconButton>
          <IconButton aria-label="Flip board" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))} sx={btn}><SwapVertIcon /></IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1, textAlign: 'center' }}>
          → main move · ← back ·{' '}
          <Link href={`https://lichess.org/analysis/${fen.replace(/ /g, '_')}`} target="_blank" rel="noopener noreferrer">analyse on Lichess</Link>
        </Typography>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 0.5 }}>{side} to move</Typography>
        <Box aria-live="polite" sx={{ mb: 2, fontFamily: tokens.mono, fontSize: '0.9rem', color: 'text.secondary', minHeight: '1.5em' }}>
          {path.length === 0 ? 'Start position' : (
            <Box component="ol" aria-label="Moves played" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {path.map((san, i) => (
                <li key={i}>
                  <Link component="button" type="button" underline="hover" onClick={() => setPath(path.slice(0, i + 1))} sx={{ fontFamily: 'inherit', fontSize: 'inherit', color: i === path.length - 1 ? 'text.primary' : 'inherit' }}>
                    {i % 2 === 0 ? `${i / 2 + 1}.` : ''}{san}
                  </Link>
                </li>
              ))}
            </Box>
          )}
        </Box>

        {note && <Typography role="note" sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: accentSoft }}>{note}</Typography>}

        {moves.length > 0 ? (
          <List dense disablePadding aria-label={`${side}'s moves in this position`}>
            {moves.map((m) => {
              const count = m.sources.length
              const isMine = m.sources.some((id) => mine.has(id))
              return (
                <li key={m.san}>
                  <ListItemButton onClick={() => play(m.san)} aria-label={`${m.san}, played in ${count} ${count === 1 ? 'line' : 'lines'}${isMine ? ', in my repertoire' : ''}`}
                    sx={{ borderRadius: 1, minHeight: 44, gap: 1.5 }}>
                    <Box sx={{ fontFamily: tokens.mono, fontWeight: 700, minWidth: 56 }}>{m.san}</Box>
                    <Box aria-hidden sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
                      <Box sx={{ width: `${(count / total) * 100}%`, height: '100%', bgcolor: 'primary.main' }} />
                    </Box>
                    <Box aria-hidden sx={{ minWidth: 64, textAlign: 'right', color: 'text.secondary', fontSize: '0.85rem' }}>{count} {count === 1 ? 'line' : 'lines'}</Box>
                    <Box aria-hidden sx={{ width: 72, flex: 'none', display: 'flex', justifyContent: 'flex-end' }}>{isMine && <Chip size="small" label="my line" color="primary" variant="outlined" />}</Box>
                  </ListItemButton>
                </li>
              )
            })}
          </List>
        ) : (
          <Typography color="text.secondary">The book lines end here{repertoire.maxPly !== null && path.length >= repertoire.maxPly ? ` (the tree stops at move ${repertoire.maxPly / 2})` : ''}.</Typography>
        )}

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {path.length === 0 ? `${reachedBy.length} lines from the book, merged into one tree` : `Reached in ${reachedBy.length} ${reachedBy.length === 1 ? 'line' : 'lines'}`}
          </Typography>
          {path.length > 0 && (() => {
            const chapters = [...new Set(reachedBy.map((s) => chapterName(s.label)))]
            return (
              <Typography variant="body2" color="text.secondary">
                Seen in {chapters.slice(0, MAX_SOURCES).join(' · ')}
                {chapters.length > MAX_SOURCES ? ` · and ${chapters.length - MAX_SOURCES} more` : ''}
              </Typography>
            )
          })()}
          {/* Authoring aid: only on the local dev server, never on the public site. */}
          {import.meta.env.DEV && path.length > 0 && <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>Key for a note on this position: <Box component="code" sx={{ fontFamily: tokens.mono }}>'{formatMovePath(path)}'</Box></Typography>}
        </Box>
      </Box>
    </Box>
  )
}
