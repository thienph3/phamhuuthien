import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import type { Proof, Story, Theme } from '@/content/types'
import { tokens } from '@/theme'
import { OPEN_CHAT_EVENT } from '../chat/ChatWidget'
import { Section } from '../layout/Section'
import { OPEN_SEARCH_EVENT } from '../search/SiteSearch'
import { LinkButton } from '../ui/LinkButton'

const open = (event: string) => () => window.dispatchEvent(new Event(event))
const card = { p: 2.75, borderRadius: `${tokens.radius + 2}px`, display: 'flex', flexDirection: 'column', gap: 1, height: '100%' } as const
const kicker = { fontFamily: tokens.mono, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'primary.dark' } as const

/** A link that stays in the app (router) and ends with an arrow. */
function More({ href, children, label }: { href: string; children: string; label?: string }) {
  return (
    <Link component={RouterLink} to={href} underline="hover" aria-label={label} sx={{ mt: 'auto', pt: 0.5, fontWeight: 600 }}>
      {children} <span aria-hidden>→</span>
    </Link>
  )
}

/** Four numbers under the hero, each one stated in Experience. */
export function ProofStrip({ items }: { items: Proof[] }) {
  return (
    <Box component="ul" aria-label="In numbers" sx={{ listStyle: 'none', p: 0, m: 0, mt: 5, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
      {items.map((p) => (
        <Box component="li" key={p.value} sx={{ borderTop: 2, borderColor: 'primary.main', pt: 1 }}>
          <Typography component="strong" sx={{ display: 'block', fontSize: '1.6rem', fontWeight: 750, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{p.value}</Typography>
          <Typography variant="body2" color="text.secondary">{p.label}</Typography>
        </Box>
      ))}
    </Box>
  )
}

/** Three things I keep doing, each linking to the CV entry that shows it. */
export function KnownForSection({ themes }: { themes: Theme[] }) {
  return (
    <Section id="known" eyebrow="What I’m known for" title="Three things I keep doing, wherever I work">
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {themes.map((t, i) => (
          <Box component="li" key={t.title}>
            <Paper variant="outlined" sx={card}>
              <Typography aria-hidden sx={{ fontSize: '2rem', fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</Typography>
              <Typography variant="h3" component="h3">{t.title}</Typography>
              <Typography color="text.secondary">{t.text}</Typography>
              <More href={t.link.href}>{t.link.label}</More>
            </Paper>
          </Box>
        ))}
      </Box>
    </Section>
  )
}

/** Selected work: problem, what I did, the result; each opens its entry on the CV. */
export function SelectedWorkSection({ stories }: { stories: Story[] }) {
  return (
    <Section id="work" eyebrow="Selected work" title="Four stories, start to finish" description="Problem, what I did, what changed. Design and impact only: no internal data from former employers.">
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
        {stories.map((s) => (
          <Box component="li" key={s.title}>
            <Paper component="article" variant="outlined" sx={card}>
              <Typography sx={kicker}>{s.company} · {s.when}</Typography>
              <Typography variant="h3" component="h3">{s.title}</Typography>
              <Typography color="text.secondary">{s.text}</Typography>
              <Typography sx={{ fontWeight: 600 }}>{s.result}</Typography>
              <More href={s.href} label={`Read it on the CV: ${s.title}`}>Read it on the CV</More>
            </Paper>
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 3 }}>
        <Link component={RouterLink} to="/cv" underline="always">Every job, plus education, awards and papers, is in the CV</Link>
      </Typography>
    </Section>
  )
}

/** The site's own features, shown as working proof: the chatbot, search and the live report. */
export function BuiltIntoSiteSection() {
  const tiles = [
    { kicker: 'AI · Workers AI', title: 'Ask about Thien', text: 'A chatbot that answers only from these pages, with sources that open the exact section, highlighted.', action: <Button variant="outlined" size="small" onClick={open(OPEN_CHAT_EVENT)}>Ask a question</Button> },
    { kicker: 'Search · BM25', title: 'Site search', text: 'Press / and search every section; results open the page with the words highlighted.', action: <Button variant="outlined" size="small" onClick={open(OPEN_SEARCH_EVENT)}>Try search</Button> },
    { kicker: 'Data · D1 + cron', title: 'Live report', text: 'Visits, chatbot quota and topics, aggregated daily with no personal data, on a public report.', action: <LinkButton href="/report" tone="ghost" size="small">Open the report</LinkButton> },
  ]
  return (
    <Section id="site" eyebrow="Built into this site" title="This page is part of the portfolio" description="A data and ML engineer’s site should show the work, not just describe it. Try them.">
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {tiles.map((t) => (
          <Box component="li" key={t.title}>
            <Paper elevation={0} sx={(th) => ({ ...card, bgcolor: tokens.light.surface2, ...th.applyStyles('dark', { bgcolor: tokens.dark.surface2 }) })}>
              <Typography sx={kicker}>{t.kicker}</Typography>
              <Typography variant="h3" component="h3">{t.title}</Typography>
              <Typography color="text.secondary">{t.text}</Typography>
              <Box sx={{ mt: 'auto', pt: 1 }}>{t.action}</Box>
            </Paper>
          </Box>
        ))}
      </Box>
    </Section>
  )
}
