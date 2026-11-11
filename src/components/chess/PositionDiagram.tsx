import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { isValidFen, sideToMove } from '@/lib/chess/pgn'
import { BoardView } from './BoardView'

export type PositionDiagramProps = { fen: string; caption?: string; orientation?: 'white' | 'black'; size?: number }

/** Static board for a FEN, with caption and side to move. Shows an error instead of a broken board. */
export function PositionDiagram({ fen, caption, orientation = 'white', size = 320 }: PositionDiagramProps) {
  if (!isValidFen(fen)) return <Alert severity="error">Invalid position (FEN): {fen}</Alert>
  return (
    <Box component="figure" sx={{ m: 0, width: `min(${size}px, 100%)` }}>
      <BoardView fen={fen} orientation={orientation} size={size} />
      <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {sideToMove(fen)} to move{caption ? ` · ${caption}` : ''}
      </Typography>
    </Box>
  )
}
