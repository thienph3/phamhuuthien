import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import { useEffect, useState } from 'react'
import type { Repertoire } from '@/lib/chess/repertoire'
import { RepertoireExplorer } from '../chess/RepertoireExplorer'

// Each book's generated tree (npm run repertoire) and optional notes, loaded only when shown.
const trees = import.meta.glob<{ default: Repertoire }>('/src/content/books/*.repertoire.json')
const noteFiles = import.meta.glob<{ notes: Record<string, string> }>('/src/content/books/*.notes.ts')

/** Loads and shows the repertoire tree for a book slug. */
export default function RepertoireDemo({ slug }: { slug: string }) {
  const [data, setData] = useState<{ repertoire: Repertoire; notes: Record<string, string> } | null>()
  useEffect(() => {
    const tree = trees[`/src/content/books/${slug}.repertoire.json`]
    if (!tree) return setData(null)
    const notes = noteFiles[`/src/content/books/${slug}.notes.ts`]
    Promise.all([tree(), notes ? notes() : Promise.resolve({ notes: {} })]).then(([t, n]) => setData({ repertoire: t.default, notes: n.notes }))
  }, [slug])
  if (data === null) return <Alert severity="info">No repertoire generated for this book yet (run npm run repertoire).</Alert>
  if (!data) return <Skeleton variant="rounded" height={480} />
  return <RepertoireExplorer repertoire={data.repertoire} notes={data.notes} />
}
