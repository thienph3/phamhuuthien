import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Section } from '../layout/Section'
import { LinkButton } from '../ui/LinkButton'

export type ContactSectionProps = { note: string; email?: string; github?: string; linkedin?: string }

/** Contact call to action. Buttons only appear for the links you have set. */
export function ContactSection({ note, email, github, linkedin }: ContactSectionProps) {
  const links = [
    email && { href: `mailto:${email}`, label: 'Email me' },
    linkedin && { href: linkedin, label: 'LinkedIn' },
    github && { href: github, label: 'GitHub' },
  ].filter((l): l is { href: string; label: string } => !!l)
  return (
    <Section id="contact" eyebrow="Contact" title="Let’s talk." prose>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{note}</Typography>
      <Stack direction="row" useFlexGap spacing={2} sx={{ flexWrap: 'wrap' }}>
        {links.map((l, i) => <LinkButton key={l.label} href={l.href} tone={i === 0 ? 'primary' : 'ghost'}>{l.label}</LinkButton>)}
      </Stack>
    </Section>
  )
}
