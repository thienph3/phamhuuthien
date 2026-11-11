import Skeleton from '@mui/material/Skeleton'
import { lazy, Suspense, type ReactNode } from 'react'
import type { BookDemo as Demo } from '@/content/types'

// Chess pieces load on demand: the board and engine are the heaviest part of the site.
const chess = {
  GameViewer: lazy(() => import('../chess/GameViewer').then((m) => ({ default: m.GameViewer }))),
  PgnViewer: lazy(() => import('../chess/PgnViewer').then((m) => ({ default: m.PgnViewer }))),
  PositionDiagram: lazy(() => import('../chess/PositionDiagram').then((m) => ({ default: m.PositionDiagram }))),
  PositionQuiz: lazy(() => import('../chess/PositionQuiz').then((m) => ({ default: m.PositionQuiz }))),
}
const RepertoireDemo = lazy(() => import('./RepertoireDemo'))

const Loading = ({ children }: { children: ReactNode }) => <Suspense fallback={<Skeleton variant="rounded" height={360} />}>{children}</Suspense>

/** Renders one book extra. The only place that maps a demo type to a component. */
export function BookDemo({ demo }: { demo: Demo }) {
  switch (demo.type) {
    case 'chess-game':
      return <Loading><chess.GameViewer {...demo.game} /></Loading>
    case 'chess-pgn':
      return <Loading><chess.PgnViewer pgn={demo.pgn} /></Loading>
    case 'chess-diagram':
      return <Loading><chess.PositionDiagram fen={demo.fen} caption={demo.caption} orientation={demo.orientation} /></Loading>
    case 'repertoire':
      return <Loading><RepertoireDemo slug={demo.slug} /></Loading>
    case 'chess-quiz':
      return <Loading><chess.PositionQuiz fen={demo.fen} question={demo.question} answer={demo.answer} explanation={demo.explanation} /></Loading>
  }
}
