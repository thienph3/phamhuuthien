import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { buildTree, type GameSpec, type MoveNode } from '@/lib/chess/moveTree'
import { indexTree, kingSquare, navigate, type NavTarget } from '@/lib/chess/navigation'
import { accentSoft } from '@/theme'
import { BoardView } from './BoardView'
import { GameControls } from './GameControls'
import { MoveList } from './MoveList'

const keyMap: Record<string, NavTarget> = {
  ArrowLeft: 'prev', ArrowRight: 'next', ArrowDown: 'enter', ArrowUp: 'exit', Home: 'first', End: 'last',
}

export type GameViewerProps = GameSpec & {
  /** How a move note is rendered. Default: plain text. Pass a custom renderer only for trusted content. */
  renderNote?: (note: string) => ReactNode
}

/** Interactive game viewer: board, controls, move list with variations, and notes. Keyboard: arrows, Home, End. */
export function GameViewer({ renderNote, ...spec }: GameViewerProps) {
  // Rebuild only when the moves change, not on every render (spec is a fresh object each time).
  const key = JSON.stringify(spec)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const root = useMemo(() => buildTree(spec), [key])
  const tree = useMemo(() => indexTree(root), [root])
  const [currentId, setCurrentId] = useState(root.id)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const current = tree.index.get(currentId) ?? root
  const go = useCallback((where: NavTarget) => setCurrentId((id) => navigate(root, tree, id, where)), [root, tree])
  const select = useCallback((n: MoveNode) => setCurrentId(n.id), [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const where = keyMap[e.key]
    if (where) {
      go(where)
      e.preventDefault()
    }
  }
  const label = current.san ? `${current.moveNumber}${current.isWhite ? '.' : '…'} ${current.san}` : 'Start'

  return (
    <Box role="group" aria-label="Chess game viewer. Use arrow keys to move." tabIndex={0} onKeyDown={onKeyDown}
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start', border: 1, borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
      <Box sx={{ flex: '0 1 368px', minWidth: 0 }}>
        <BoardView
          fen={current.fen}
          lastMove={current.from ? [current.from, current.to] : undefined}
          checkSquare={current.check ? kingSquare(current.fen, current.check) : undefined}
          orientation={orientation}
        />
        {spec.caption && <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1, textAlign: 'center' }}>{spec.caption}</Typography>}
        <Box sx={{ mt: 1.5 }}>
          <GameControls label={label} onGo={go} onFlip={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))} />
        </Box>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1, textAlign: 'center' }}>
          ← → step · ↓ enter a sub-line · ↑ leave it · 💬 marks a note ·{' '}
          <Link href={`https://lichess.org/analysis/${current.fen.replace(/ /g, '_')}`} target="_blank" rel="noopener noreferrer">analyse on Lichess</Link>
        </Typography>
      </Box>
      <Box sx={{ flex: '1 1 240px', minWidth: 220 }}>
        <MoveList root={root} currentId={currentId} onSelect={select} />
        {current.comment && (
          <Typography role="note" component="div" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: accentSoft, fontSize: '0.95rem' }}>{renderNote ? renderNote(current.comment) : current.comment}</Typography>
        )}
      </Box>
    </Box>
  )
}
