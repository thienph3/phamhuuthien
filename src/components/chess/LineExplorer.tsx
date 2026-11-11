import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Typography from '@mui/material/Typography'
import { useState, type ReactNode } from 'react'
import type { GameSpec } from '@/lib/chess/moveTree'
import { GameViewer } from './GameViewer'

export type ExplorerLine = { label: ReactNode; summary: ReactNode; tags?: string[]; note?: ReactNode; line: GameSpec }
export type ExplorerGroup = { id: string; heading: string; lines: ExplorerLine[] }

export type LineExplorerProps = {
  title: string
  badge?: string
  intro?: ReactNode
  groups: ExplorerGroup[]
  renderNote?: (note: string) => ReactNode
}

/** Repertoire-style trainer: one board, and a grouped list of lines; picking a line loads it on the board. */
export function LineExplorer({ title, badge, intro, groups, renderNote }: LineExplorerProps) {
  const flat = groups.flatMap((g) => g.lines)
  const [selected, setSelected] = useState(0)
  const current = flat[selected]
  let idx = -1
  return (
    <Box component="section" aria-label={title} sx={{ my: 4, border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h3" component="h3" sx={{ m: 0 }}>{title}</Typography>
        {badge && <Chip label={badge} size="small" color="primary" />}
      </Box>
      {intro && <Typography color="text.secondary" component="div" sx={{ mb: 2 }}>{intro}</Typography>}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 280px' } }}>
        <Box sx={{ minWidth: 0 }}>{current && <GameViewer key={selected} {...current.line} renderNote={renderNote} />}</Box>
        <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
          {groups.map((g) => (
            <Box key={g.id} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{g.heading}</Typography>
              <List dense disablePadding>
                {g.lines.map((l) => {
                  idx += 1
                  const my = idx
                  const active = my === selected
                  return (
                    <li key={my}>
                      <ListItemButton selected={active} aria-current={active ? 'true' : undefined} onClick={() => setSelected(my)} sx={{ borderRadius: 1, display: 'block', minHeight: 44 }}>
                        <Typography variant="body2" component="div"><strong>{l.label}</strong> → {l.summary}</Typography>
                        {l.tags && <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>{l.tags.map((t) => <Chip key={t} label={t} size="small" variant="outlined" />)}</Box>}
                      </ListItemButton>
                      {active && l.note && <Typography variant="body2" color="text.secondary" component="div" sx={{ px: 2, py: 1 }}>{l.note}</Typography>}
                    </li>
                  )
                })}
              </List>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
