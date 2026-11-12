import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { AwardsSection, ExperienceSection, PageContainer, ProfilePhoto, SiteLayout } from '@/components'
import { CareerTimeline } from '@/components/cv/CareerTimeline'
import { awards, education, experience, publications, site, timelineExtras } from '@/content/site'
import { tokens } from '@/theme'

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '')

/**
 * /cv: the full history for recruiters, with a career timeline and a PDF made from this same page (`npm run cv:pdf`).
 * The home page is the brand; this page is the record.
 */
export function Cv() {
  useEffect(() => {
    const before = document.title
    document.title = 'CV · Thien Pham (Phạm Hữu Thiên)'
    return () => {
      document.title = before
    }
  }, [])
  return (
    <SiteLayout>
      <PageContainer className="cv-page" sx={{ pt: { xs: 5, md: 7 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <ProfilePhoto alt={site.name} width={88} round eager />
            <Box>
              <Typography variant="h1" sx={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
                {site.name} <Box component="span" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.6em' }}>({site.localName})</Box>
              </Typography>
              <Typography sx={{ color: 'primary.dark', fontWeight: 650, my: 0.5 }}>{site.role}</Typography>
              <Typography variant="body2" color="text.secondary">
                {site.email && <><Link href={`mailto:${site.email}`} color="inherit">{site.email}</Link> · </>}
                {site.linkedin && <><Link href={site.linkedin} color="inherit">{host(site.linkedin)}</Link> · </>}
                <Link href={site.github} color="inherit">{host(site.github)}</Link>
              </Typography>
            </Box>
          </Box>
          <Box className="cv-noprint" sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="contained" href={site.cvPdf} download="Thien-Pham-CV.pdf">Download PDF</Button>
            <Button variant="outlined" onClick={() => window.print()}>Print</Button>
          </Box>
        </Box>
        <Typography color="text.secondary" sx={{ maxWidth: tokens.proseWidth, mt: 3 }}>{site.cvSummary}</Typography>

        <Typography variant="h2" component="h2" sx={{ fontSize: '1.4rem', mt: 5, mb: 2 }}>Career at a glance</Typography>
        <CareerTimeline jobs={experience} extras={timelineExtras} />
      </PageContainer>

      <ExperienceSection jobs={experience} />
      <AwardsSection education={education} awards={awards} publications={publications} />

      <Box component="section" aria-labelledby="skills-title" sx={{ py: { xs: 7, md: 9 }, borderTop: 1, borderColor: 'divider' }}>
        <PageContainer>
          <Typography id="skills-title" variant="h2" component="h2" sx={{ mb: 3 }}>Skills and languages</Typography>
          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '10rem 1fr' }, gap: { xs: 0.25, sm: 1.5 }, '@media print': { rowGap: '2px' }, m: 0, '& dt': { fontFamily: tokens.mono, fontSize: '0.8rem', textTransform: 'uppercase', color: 'primary.dark', pt: '3px' }, '& dd': { m: 0, mb: { xs: 1.5, sm: 0 } } }}>
            {site.skills.map((g) => (
              <Box key={g.label} sx={{ display: 'contents' }}><dt>{g.label}</dt><dd>{g.items.join(' · ')}</dd></Box>
            ))}
            <Box sx={{ display: 'contents' }}><dt>Languages</dt><dd>{site.languages.map((l) => `${l.label} (${l.level})`).join(' · ')}</dd></Box>
          </Box>
        </PageContainer>
      </Box>
    </SiteLayout>
  )
}
