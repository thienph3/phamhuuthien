import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { tokens } from '@/theme'
import { Section } from '../layout/Section'

export type SkillGroup = { label: string; items: string[] }
export type AboutSectionProps = { paragraphs: string[]; skills: SkillGroup[] }

/** About text, then skills grouped by area (one line per group). */
export function AboutSection({ paragraphs, skills }: AboutSectionProps) {
  return (
    <Section id="about" eyebrow="About" title="Hi, I’m Thien." prose>
      {paragraphs.map((p) => (
        <Typography key={p} sx={{ mb: 2 }}>{p}</Typography>
      ))}
      <Box component="dl" sx={{ mt: 4, mb: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' }, columnGap: 3, rowGap: { xs: 0.5, sm: 1.5 } }}>
        {skills.map((g) => (
          <Box key={g.label} sx={{ display: 'contents' }}>
            <Typography component="dt" sx={{ fontFamily: tokens.mono, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main', pt: { sm: 0.3 }, mt: { xs: 1.5, sm: 0 } }}>{g.label}</Typography>
            <Typography component="dd" color="text.secondary" sx={{ m: 0 }}>{g.items.join(' · ')}</Typography>
          </Box>
        ))}
      </Box>
    </Section>
  )
}
