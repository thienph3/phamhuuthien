import Box from '@mui/material/Box'
import { AboutSection, ContactSection, Hero, LibrarySection, LinkButton, SiteLayout, StatusPill } from '@/components'
import { BuiltIntoSiteSection, KnownForSection, ProofStrip, SelectedWorkSection } from '@/components/sections/BrandSections'
import { books, proof, site, stories, themes } from '@/content/site'

/**
 * Home page: the brand. Who I am, what I'm known for and the work that shows it; the full history is on /cv.
 * Only assembles components from the library and the content file.
 */
export function Home() {
  return (
    <SiteLayout>
      <Hero
        eyebrow={site.role}
        headline={<>{site.headline} <Box component="span" sx={{ color: 'primary.main' }}>{site.headlineAccent}</Box>.</>}
        pov={site.pov}
        lead={site.lead}
        status={site.now.map((n) => <StatusPill key={n}>{n}</StatusPill>)}
        actions={
          <>
            <LinkButton href="#work">See selected work</LinkButton>
            <LinkButton href="/cv" tone="ghost">Full CV</LinkButton>
          </>
        }
      >
        <ProofStrip items={proof} />
      </Hero>
      <KnownForSection themes={themes} />
      <SelectedWorkSection stories={stories} />
      <BuiltIntoSiteSection />
      {/* Projects section hidden for now; data stays in `projects` (site.ts). */}
      <LibrarySection books={books} />
      <AboutSection paragraphs={site.about} skills={site.skills} />
      <ContactSection note={site.contactNote} email={site.email} github={site.github} linkedin={site.linkedin} cvPdf={site.cvPdf} />
    </SiteLayout>
  )
}
