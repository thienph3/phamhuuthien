import Box from '@mui/material/Box'
import { AboutSection, AwardsSection, ContactSection, ExperienceSection, Hero, LibrarySection, LinkButton, SiteLayout, StatusPill } from '@/components'
import { awards, books, education, experience, publications, site } from '@/content/site'

/** Home page: only assembles components from the library and the content file. */
export function Home() {
  return (
    <SiteLayout>
      <Hero
        eyebrow={site.role}
        headline={<>{site.headline} <Box component="span" sx={{ color: 'primary.main' }}>{site.headlineAccent}</Box>.</>}
        lead={site.lead}
        status={site.now.map((n) => <StatusPill key={n}>{n}</StatusPill>)}
        actions={
          <>
            <LinkButton href="#experience">See my work</LinkButton>
            <LinkButton href="#contact" tone="ghost">Get in touch</LinkButton>
          </>
        }
      />
      <AboutSection paragraphs={site.about} skills={site.skills} />
      <ExperienceSection jobs={experience} />
      <AwardsSection education={education} awards={awards} publications={publications} />
      {/* Projects section hidden for now; data stays in `projects` (site.ts). Re-add <ProjectsSection projects={projects} /> and its nav link to show it. */}
      <LibrarySection books={books} />
      <ContactSection note={site.contactNote} email={site.email} github={site.github} linkedin={site.linkedin} />
    </SiteLayout>
  )
}
