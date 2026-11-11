import type { Award, Book, Education, Job, Publication } from '@/content/types'
import { anchors } from '../anchors.ts'
import type { SearchDoc } from './bm25.ts'

export type SiteContent = {
  site: { name: string; localName: string; lead: string; about: string[]; skills: { label: string; items: string[] }[]; contactNote: string }
  experience: Job[]
  books: Book[]
  education?: Education[]
  awards?: Award[]
  publications?: Publication[]
}

const join = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(' ')

/**
 * Every searchable section of the public site, with the URL of its anchor. Built from the content data,
 * so it works from any page. Private book text and interactive boards are not included.
 */
export function buildSiteDocs({ site, experience, books, education = [], awards = [], publications = [] }: SiteContent): SearchDoc[] {
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
        page: 'CV',
        section: 'Experience · Earlier',
        title: job.company,
        text: join(job.companyNote, job.role, job.period, ...job.highlights.map((h) => join(h.title, h.text, ...(h.tags ?? [])))),
        url: `/cv#${anchors.job(job.company)}`,
      })
      continue
    }
    for (const h of job.highlights)
      docs.push({
        id: anchors.highlight(job.company, h.title),
        page: 'CV',
        section: `Experience · ${job.company}`,
        title: h.title,
        text: join(h.text, job.role, job.period, ...(h.tags ?? [])),
        url: `/cv#${anchors.highlight(job.company, h.title)}`,
      })
  }
  for (const e of education)
    docs.push({ id: anchors.education(e.school), page: 'CV', section: 'Education', title: `${e.title} · ${e.school}`, text: `${e.when}. Study: ${e.title} at ${e.school}. ${e.text}`, url: `/cv#${anchors.education(e.school)}` })
  for (const a of awards)
    docs.push({ id: anchors.award(a.org), page: 'CV', section: 'Awards', title: `${a.title} · ${a.org}`, text: `${a.when} award: ${a.title}, ${a.org}. ${a.text}`, url: `/cv#${anchors.award(a.org)}` })
  for (const p of publications)
    docs.push({
      id: anchors.publication(p.title),
      page: 'CV',
      section: 'Publications',
      title: p.title,
      text: `Paper published ${p.year} in ${p.venue}${p.publisher === 'Journal' ? '' : ` (${p.publisher})`}. Authors: ${p.authors.join(', ')}. DOI ${p.doi}.`,
      url: `/cv#${anchors.publication(p.title)}`,
    })
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
