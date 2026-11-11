import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import type { BookNotes as Notes } from '@/content/types'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h3" component="h2" sx={{ mb: 1 }}>{title}</Typography>
      {children}
    </Box>
  )
}

/** The standard book-notes template: why, key ideas, what I applied, verdict. `extra` renders under "applied". */
export function BookNotes({ notes, extra }: { notes: Notes; extra?: ReactNode }) {
  return (
    <>
      <Block title="Why I read it"><Typography>{notes.why}</Typography></Block>
      <Block title="Key ideas">
        <List sx={{ listStyle: 'disc', pl: 3, py: 0 }}>
          {notes.ideas.map((i) => <ListItem key={i} sx={{ display: 'list-item', p: 0, mb: 0.5 }}>{i}</ListItem>)}
        </List>
      </Block>
      <Block title="What I applied">
        <Typography sx={{ mb: extra ? 2 : 0 }}>{notes.applied}</Typography>
        {extra}
      </Block>
      <Block title="Verdict"><Typography>{notes.verdict}</Typography></Block>
    </>
  )
}
