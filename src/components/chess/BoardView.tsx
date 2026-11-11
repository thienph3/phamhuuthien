import Box from '@mui/material/Box'
import { useMemo } from 'react'
import { Chessboard } from 'react-chessboard'

type SquareStyles = Record<string, React.CSSProperties>

export type BoardViewProps = {
  fen: string
  lastMove?: [string, string]
  /** Square of the king in check, e.g. "e1". */
  checkSquare?: string
  orientation?: 'white' | 'black'
  /** Board size in pixels; it shrinks to fit narrow screens. */
  size?: number
}

/** Read-only study board with last-move and check highlights. */
export function BoardView({ fen, lastMove, checkSquare, orientation = 'white', size = 368 }: BoardViewProps) {
  const squareStyles = useMemo<SquareStyles>(() => {
    const s: SquareStyles = {}
    if (lastMove) {
      s[lastMove[0]] = { background: 'rgba(255, 213, 79, 0.5)' }
      s[lastMove[1]] = { background: 'rgba(255, 213, 79, 0.5)' }
    }
    if (checkSquare) {
      s[checkSquare] = {
        background: 'radial-gradient(ellipse at center, rgba(220,53,69,0.9) 0%, rgba(220,53,69,0.5) 45%, rgba(220,53,69,0) 70%)',
      }
    }
    return s
  }, [lastMove, checkSquare])

  return (
    // The board is read-only: expose it as one labelled image and make the library's
    // draggable-square buttons inert (no tab stops, no unnamed buttons). Moves are in the move list.
    <Box role="img" aria-label={`Chess board, ${orientation} at the bottom. Position: ${fen}`} sx={{ width: `min(${size}px, 100%)`, aspectRatio: '1 / 1' }}>
      <Box inert sx={{ width: '100%', height: '100%' }}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: false,
          showNotation: true,
          animationDurationInMs: 200,
          squareStyles,
          darkSquareStyle: { backgroundColor: '#b58863' },
          lightSquareStyle: { backgroundColor: '#f0d9b5' },
        }}
      />
      </Box>
    </Box>
  )
}
