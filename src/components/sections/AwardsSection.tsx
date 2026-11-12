import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Fragment, type ReactNode } from 'react'
import type { Award, Education, Publication } from '@/content/types'
import { anchors } from '@/lib/anchors'
import { tokens } from '@/theme'
import { Section } from '../layout/Section'

/** Same two columns as the job rows in Experience: when on the left, what on the right. */
const row = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' }, gap: { xs: 0.25, md: 5 }, scrollMarginTop: 96 } as const
const when = { fontFamily: tokens.mono, color: 'text.secondary', fontSize: '0.875rem', pt: { md: '2px' } } as const

function Group({ title, first = false, children }: { title: string; first?: boolean; children: ReactNode }) {
  return (
    <Box className="cv-group" sx={first ? undefined : { mt: 4, pt: 4, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="h3" component="h3" sx={{ mb: 2 }}>{title}</Typography>
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 2.5 }}>{children}</Box>
    </Box>
  )
}

/** Authors exactly as published, with my name in bold (`me` is its index). */
function Authors({ p }: { p: Publication }) {
  return (
    <>
      {p.authors.map((a, i) => (
        <Fragment key={i}>
          {i > 0 && ', '}
          {i === p.me ? <Box component="strong" sx={{ color: 'text.primary' }}>{a}</Box> : a}
        </Fragment>
      ))}
    </>
  )
}

/**
 * Education, awards (contests, olympiads, chess) and publications. Each award or paper has a way to check it: a DOI or a
 * public profile.
 */
export function AwardsSection({ education, awards, publications }: { education: Education[]; awards: Award[]; publications: Publication[] }) {
  return (
    <Section id="awards" eyebrow="Education, awards & publications" title="Where I studied, and what came of it">
      <Typography className="cv-detail" color="text.secondary" sx={{ maxWidth: tokens.proseWidth, mt: -1.5, mb: 4 }}>
        A maths class at Le Quy Don High School for the Gifted in Khanh Hoa, then software engineering at HCMC University
        of Education, where I competed in programming contests and co-authored papers on support vector machines.
      </Typography>
      <Group title="Education" first>
        {education.map((e) => (
          <Box component="li" key={e.school} id={anchors.education(e.school)} sx={row}>
            <Typography sx={when}>{e.when}</Typography>
            <Box>
              <Typography sx={{ fontWeight: 650 }}>{e.title} · {e.school}</Typography>
              <Typography className="cv-detail" color="text.secondary" sx={{ maxWidth: tokens.proseWidth }}>{e.text}</Typography>
            </Box>
          </Box>
        ))}
      </Group>
      <Group title="Awards">
        {awards.map((a) => (
          <Box component="li" key={a.org} id={anchors.award(a.org)} sx={row}>
            <Typography sx={when}>{a.when}</Typography>
            <Box>
              <Typography sx={{ fontWeight: 650 }}>{a.title} · {a.org}</Typography>
              {/* The printed CV keeps only awards with a public record to check (e.g. the FIDE profile). */}
              <Typography className={a.link ? undefined : 'cv-detail'} color="text.secondary" sx={{ maxWidth: tokens.proseWidth }}>
                {a.text}
                {a.link && <> <Link href={a.link.href} underline="always">{a.link.label}</Link></>}
              </Typography>
            </Box>
          </Box>
        ))}
      </Group>
      <Group title="Publications">
        {publications.map((p) => (
          <Box component="li" key={p.doi} id={anchors.publication(p.title)} sx={row}>
            <Typography sx={when}>{p.year}</Typography>
            <Box sx={{ maxWidth: tokens.proseWidth }}>
              <Typography component="h4" sx={{ fontWeight: 650, fontSize: '1rem', m: 0 }}>{p.title}</Typography>
              <Typography color="text.secondary"><Authors p={p} /></Typography>
              <Typography color="text.secondary" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 0.25 }}>
                <Box component="span" className="cv-detail" sx={{ fontFamily: tokens.mono, fontSize: '0.72rem', border: 1, borderColor: p.publisher === 'IEEE' ? 'primary.main' : 'divider', color: p.publisher === 'IEEE' ? 'primary.dark' : 'text.secondary', borderRadius: 999, px: 1 }}>
                  {p.publisher}
                </Box>
                <span>{p.venue} · <Link href={`https://doi.org/${p.doi}`} underline="always" aria-label={`DOI for ${p.title}`}>DOI</Link></span>
              </Typography>
            </Box>
          </Box>
        ))}
      </Group>
      <Typography className="cv-detail" variant="body2" color="text.secondary" sx={{ mt: 3 }}>Author lists as published; my name in bold.</Typography>
    </Section>
  )
}
