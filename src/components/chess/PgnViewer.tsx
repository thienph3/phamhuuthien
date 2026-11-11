import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import { pgnToGame } from '@/lib/chess/pgn'
import { GameViewer } from './GameViewer'

/** Viewer for a PGN string: shows a header line (players, event, result) and the interactive game. */
export function PgnViewer({ pgn }: { pgn: string }) {
  const parsed = useMemo(() => {
    try {
      return { ok: true as const, ...pgnToGame(pgn) }
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'Invalid PGN' }
    }
  }, [pgn])
  if (!parsed.ok) return <Alert severity="error">Could not read this PGN: {parsed.message}</Alert>
  const { headers, game } = parsed
  const meta = [headers.Event, headers.Date && !headers.Date.includes('?') ? headers.Date : undefined, headers.Result].filter(Boolean).join(' · ')
  return (
    <>
      {meta && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{meta}</Typography>}
      <GameViewer {...game} />
    </>
  )
}
