import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { Job } from '@/content/types'
import { anchors } from '@/lib/anchors'
import { tokens } from '@/theme'
import { Section } from '../layout/Section'
import { TagList } from '../ui/Tag'

const statusLabel = { production: 'In production', prototype: 'Prototype' } as const

/** One line per early-career job: period, company, role, and what it taught me. */
function EarlyJobs({ jobs }: { jobs: Job[] }) {
  return (
    <Box className="cv-group" sx={{ mt: 2, pt: 4, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="h3" component="h3" sx={{ mb: 2 }}>Earlier</Typography>
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 2.5 }}>
        {jobs.map((job) => (
          <Box component="li" key={job.company} id={anchors.job(job.company)} className="cv-job" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' }, gap: { xs: 0.5, md: 5 }, scrollMarginTop: 96 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {job.company}
              {job.period && <Box component="span" sx={{ fontFamily: tokens.mono, fontWeight: 400, color: 'text.secondary', fontSize: '0.875rem', ml: 1 }}>{job.period}</Box>}
              <Box component="span" sx={{ display: 'block', fontWeight: 400, color: 'text.secondary', fontSize: '0.875rem' }}>{job.role}</Box>
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: tokens.proseWidth }}>
              {job.highlights.map((h) => (
                <span key={h.title}>
                  <Box component="strong" sx={{ color: 'text.primary' }}>{h.title}.</Box> <span className="cv-detail">{h.text}</span>{' '}
                </span>
              ))}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/** Work history: one row per recent job (company and role on the left, what I did on the right), then early jobs compactly. */
export function ExperienceSection({ jobs }: { jobs: Job[] }) {
  const recent = jobs.filter((j) => !j.early)
  const early = jobs.filter((j) => j.early)
  return (
    <Section id="experience" eyebrow="Experience" title="Where I have worked">
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {recent.map((job) => (
          <Box component="li" key={job.company} id={anchors.job(job.company)} className="cv-job" sx={{ scrollMarginTop: 96, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' }, gap: { xs: 2, md: 5 }, py: 4, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0, pt: 0 } }}>
            <Box>
              <Typography variant="h3" component="h3">{job.company}</Typography>
              {job.companyNote && <Typography className="cv-detail" variant="body2" color="text.secondary">{job.companyNote}</Typography>}
              <Typography sx={{ mt: 1, fontWeight: 600 }}>{job.role}</Typography>
              {job.period && <Typography variant="body2" color="text.secondary" sx={{ fontFamily: tokens.mono, mt: 0.5 }}>{job.period}</Typography>}
            </Box>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 3 }}>
              {job.highlights.map((h) => (
                <Box component="li" key={h.title} id={anchors.highlight(job.company, h.title)} sx={{ scrollMarginTop: 96 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                    <Typography component="h4" sx={{ fontWeight: 700, fontSize: '1.05rem', m: 0 }}>{h.title}</Typography>
                    {h.status && <Chip className="cv-detail" size="small" label={statusLabel[h.status]} color={h.status === 'production' ? 'primary' : 'default'} variant="outlined" />}
                  </Box>
                  {/* Details on screen; the printed CV keeps the titles only (theme print styles hide .cv-detail). */}
                  <Typography className="cv-detail" color="text.secondary" sx={{ mb: h.tags ? 1.5 : 0, maxWidth: tokens.proseWidth }}>{h.text}</Typography>
                  {h.tags && <Box className="cv-detail"><TagList tags={h.tags} /></Box>}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
      {early.length > 0 && <EarlyJobs jobs={early} />}
    </Section>
  )
}
