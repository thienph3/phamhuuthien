import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { tokens } from '@/theme'

/** Small neutral label, e.g. a technology. */
export function Tag({ label }: { label: string }) {
  return <Chip label={label} size="small" variant="outlined" sx={{ fontFamily: tokens.mono, fontSize: '0.75rem', borderRadius: 1.5 }} />
}

/** Wrapping row of tags. */
export function TagList({ tags }: { tags: string[] }) {
  return (
    <Stack direction="row" useFlexGap spacing={0.75} component="ul" sx={{ listStyle: 'none', p: 0, m: 0, flexWrap: 'wrap' }} aria-label="Tags">
      {tags.map((t) => (
        <li key={t}>
          <Tag label={t} />
        </li>
      ))}
    </Stack>
  )
}
