import FirstPageIcon from '@mui/icons-material/FirstPage'
import FlipIcon from '@mui/icons-material/SwapVert'
import LastPageIcon from '@mui/icons-material/LastPage'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { NavTarget } from '@/lib/chess/navigation'

export type GameControlsProps = { label: string; onGo: (where: NavTarget) => void; onFlip: () => void }

/** First / previous / next / last / flip buttons with a current-move label. */
export function GameControls({ label, onGo, onFlip }: GameControlsProps) {
  const btn = { border: 1, borderColor: 'divider', width: 44, height: 44 }
  return (
    <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <IconButton aria-label="Start" onClick={() => onGo('first')} sx={btn}><FirstPageIcon /></IconButton>
      <IconButton aria-label="Previous move" onClick={() => onGo('prev')} sx={btn}><NavigateBeforeIcon /></IconButton>
      <Typography aria-live="polite" sx={{ minWidth: 64, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{label}</Typography>
      <IconButton aria-label="Next move" onClick={() => onGo('next')} sx={btn}><NavigateNextIcon /></IconButton>
      <IconButton aria-label="End" onClick={() => onGo('last')} sx={btn}><LastPageIcon /></IconButton>
      <IconButton aria-label="Flip board" onClick={onFlip} sx={btn}><FlipIcon /></IconButton>
    </Stack>
  )
}
