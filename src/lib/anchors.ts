import { fold } from './search/text.ts'

/** URL-safe slug: "Owned two core services" → "owned-two-core-services" (accents folded). */
export const slugify = (text: string): string =>
  fold(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Anchor ids shared by the pages and the search index, so a search result always lands on its section. */
export const anchors = {
  job: (company: string) => `exp-${slugify(company)}`,
  highlight: (company: string, title: string) => `exp-${slugify(company)}-${slugify(title)}`,
  bookSection: (title: string) => `section-${slugify(title)}`,
}
