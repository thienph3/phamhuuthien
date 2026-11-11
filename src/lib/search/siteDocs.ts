import type { Book, Job } from '@/content/types'
import { anchors } from '../anchors.ts'
import type { SearchDoc } from './bm25.ts'

export type SiteContent = {
  site: { name: string; localName: string; lead: string; about: string[]; skills: { label: string; items: string[] }[]; contactNote: string }
  experience: Job[]
  books: Book[]
}

const join = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(' ')

/**
 * Every searchable section of the public site, with the URL of its anchor. Built from the content data,
 * so it works from any page. Private book text and interactive boards are not included.
 */
export function buildSiteDocs({ site, experience, books }: SiteContent): SearchDoc[] {
  const docs: SearchDoc[] = [
    {
      id: 'about',
      page: 'Home',
      section: 'About',
      // Same as the About heading: the first name ("Thien Pham" → Thien).
      title: `Hi, I’m ${site.name.split(' ')[0]}`,
      text: join(site.name, site.localName, site.lead, ...site.about, ...site.skills.map((g) => `${g.label}: ${g.items.join(', ')}`)),
      url: '/#about',
    },
  ]
  for (const job of experience) {
    if (job.early) {
      docs.push({
        id: anchors.job(job.company),
        page: 'Home',
        section: 'Experience · Earlier',
        title: job.company,
        text: join(job.companyNote, job.role, job.period, ...job.highlights.map((h) => join(h.title, h.text, ...(h.tags ?? [])))),
        url: `/#${anchors.job(job.company)}`,
      })
      continue
    }
    for (const h of job.highlights)
      docs.push({
        id: anchors.highlight(job.company, h.title),
        page: 'Home',
        section: `Experience · ${job.company}`,
        title: h.title,
        text: join(h.text, job.role, job.period, ...(h.tags ?? [])),
        url: `/#${anchors.highlight(job.company, h.title)}`,
      })
  }
  docs.push({
    id: 'library',
    page: 'Home',
    section: 'Library',
    title: 'Books I read',
    text: books.map((b) => `${b.title} by ${b.author}`).join('. '),
    url: '/#library',
  })
  for (const book of books) {
    if (!(book.sections || book.notes || book.demos)) continue
    docs.push({ id: `book-${book.slug}`, page: book.title, section: 'Reader notes', title: book.title, text: join(book.author, book.intro), url: `/books/${book.slug}` })
    for (const s of book.sections ?? [])
      docs.push({
        id: `book-${book.slug}-${anchors.bookSection(s.title)}`,
        page: book.title,
        section: 'Reader notes',
        title: s.title,
        text: join(...(s.paragraphs ?? []), ...(s.items ?? []), s.demoHelp),
        url: `/books/${book.slug}#${anchors.bookSection(s.title)}`,
      })
  }
  docs.push({ id: 'contact', page: 'Home', section: 'Contact', title: 'Let’s talk', text: join(site.contactNote, 'email LinkedIn GitHub'), url: '/#contact' })
  return docs
}
