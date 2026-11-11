import Box from '@mui/material/Box'
import type { Project } from '@/content/types'
import { ProjectCard } from '../cards/ProjectCard'
import { Section } from '../layout/Section'

/** Responsive grid of side-project cards. */
export function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <Section id="projects" eyebrow="Projects" title="Things I build on the side">
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(256px, 1fr))' }}>
        {projects.map((p) => (
          <ProjectCard key={p.title} {...p} />
        ))}
      </Box>
    </Section>
  )
}
