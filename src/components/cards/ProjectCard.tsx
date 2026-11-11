import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Project } from '@/content/types'
import { TagList } from '../ui/Tag'
import { ContentCard } from './ContentCard'

/** Project summary card. */
export function ProjectCard({ title, summary, tags, href }: Project) {
  return (
    <ContentCard href={href} component="article">
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Typography variant="h3" component="h3">{title}</Typography>
        <Typography color="text.secondary">{summary}</Typography>
        <TagList tags={tags} />
      </Stack>
    </ContentCard>
  )
}
