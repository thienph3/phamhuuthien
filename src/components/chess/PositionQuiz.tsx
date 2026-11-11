import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useId, useState } from 'react'
import { accentSoft } from '@/theme'
import { PositionDiagram } from './PositionDiagram'

export type PositionQuizProps = { fen: string; question: string; answer: string; explanation?: string; orientation?: 'white' | 'black' }

/** "Find the move" exercise: a position, a question, and an answer revealed on demand. */
export function PositionQuiz({ fen, question, answer, explanation, orientation }: PositionQuizProps) {
  const [shown, setShown] = useState(false)
  const id = useId()
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start', border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Box sx={{ flex: '0 1 280px', minWidth: 0 }}><PositionDiagram fen={fen} orientation={orientation} size={280} /></Box>
      <Box sx={{ flex: '1 1 220px' }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>{question}</Typography>
        <Button variant="outlined" aria-expanded={shown} aria-controls={id} onClick={() => setShown((s) => !s)}>
          {shown ? 'Hide answer' : 'Show answer'}
        </Button>
        <Box id={id} hidden={!shown} sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: accentSoft }}>
          <Typography sx={{ fontWeight: 700 }}>{answer}</Typography>
          {explanation && <Typography variant="body2" color="text.secondary">{explanation}</Typography>}
        </Box>
      </Box>
    </Box>
  )
}
