import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import type { MoveNode } from '@/lib/chess/moveTree'

const glyphColor: Record<string, string> = {
  '!!': 'info.main',
  '!': 'success.main',
  '!?': 'text.secondary',
  '?!': 'warning.main',
  '?': 'error.main',
  '??': 'error.main',
}

type Props = { node: MoveNode; currentId: string; onSelect: (n: MoveNode) => void }

/** One clickable move in the score sheet. */
function MoveToken({ node, currentId, onSelect }: Props) {
  const active = node.id === currentId
  const sx: SxProps<Theme> = {
    cursor: 'pointer', border: 0, font: 'inherit', color: 'inherit', background: 'none', px: 0.5, py: 0.25, borderRadius: 1,
    '&:hover': { bgcolor: 'action.hover' },
    ...(active && { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } }),
  }
  return (
    <Box component="button" type="button" sx={sx} aria-current={active ? 'true' : undefined} onClick={() => onSelect(node)}>
      {node.isWhite && <Box component="span" sx={{ color: active ? 'inherit' : 'text.secondary', mr: 0.25 }}>{node.moveNumber}.</Box>}
      {node.san}
      {node.glyph && <Box component="span" sx={{ fontWeight: 700, color: active ? 'inherit' : glyphColor[node.glyph] }}>{node.glyph}</Box>}
      {node.comment && <Box component="span" role="img" aria-label="Has a note" sx={{ fontSize: '0.7em', ml: 0.25, opacity: 0.7, verticalAlign: 'top' }}>{'\uD83D\uDCAC'}</Box>}
    </Box>
  )
}

/**
 * Renders a line starting at `node`: the main continuation first, each alternative in parentheses
 * right after the move it replaces. Recursive, so variations can contain variations.
 */
export function renderLine(node: MoveNode | undefined, currentId: string, onSelect: (n: MoveNode) => void, depth = 0): ReactNode[] {
  const out: ReactNode[] = []
  if (!node) return out
  const tok = (m: MoveNode, withNumber: boolean) => (
    <Box component="span" key={m.id} sx={{ whiteSpace: 'nowrap' }}>
      {!m.isWhite && withNumber && <Box component="span" sx={{ color: 'text.secondary' }}>{m.moveNumber}…</Box>}
      <MoveToken node={m} currentId={currentId} onSelect={onSelect} />{' '}
    </Box>
  )
  out.push(tok(node, true))
  let cur = node
  let afterVariation = false
  while (cur.children.length > 0) {
    const main = cur.children[0]
    const alts = cur.children.slice(1)
    out.push(tok(main, afterVariation))
    for (const v of alts) {
      out.push(
        <Box component="span" key={`${v.id}-var`} sx={{ color: 'text.secondary', fontSize: '0.92em' }}>
          {'('}
          {renderLine(v, currentId, onSelect, depth + 1)}
          {') '}
        </Box>,
      )
    }
    afterVariation = alts.length > 0
    cur = main
  }
  return out
}

export type MoveListProps = { root: MoveNode; currentId: string; onSelect: (n: MoveNode) => void }

/** Scrollable score sheet with variations. */
export function MoveList({ root, currentId, onSelect }: MoveListProps) {
  return (
    <Box sx={{ lineHeight: 1.9, fontVariantNumeric: 'tabular-nums', maxHeight: 360, overflowY: 'auto' }}>
      {renderLine(root.children[0], currentId, onSelect)}
    </Box>
  )
}
