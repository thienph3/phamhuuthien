import type { MDXComponents } from 'mdx/types'
import type { ComponentType } from 'react'

export type ChapterModule = { default: ComponentType<{ components?: MDXComponents }>; metadata?: { title?: string } }
export type Chapter = { slug: string; label: string; load: () => Promise<ChapterModule> }
export type TocPart = { part: string; chapters: Chapter[] }

/** Full text of a book, kept in the git-ignored private/ folder. */
export type PrivateBook = {
  toc: TocPart[]
  /** Components the chapters use by name, e.g. { ChessGame }. */
  components?: MDXComponents
}

// SHORTCUT: private book text is bundled only by `npm run dev` and `npm run preview:private` (mode
// "private", output dist-private/). `npm run build` never includes it, and Cloudflare only uploads dist/,
// so the public site cannot leak it. Upgrade path: a separate private deployment behind Cloudflare
// Access (plan Phase 3).
const includePrivate = import.meta.env.DEV || import.meta.env.MODE === 'private'
const modules: Record<string, () => Promise<{ book: PrivateBook }>> = includePrivate
  ? import.meta.glob<{ book: PrivateBook }>('/private/books/*/index.tsx')
  : {}

const slugOf = (path: string) => path.split('/')[3]

/** True when this book's full text is available locally. */
export const hasPrivateBook = (slug: string): boolean => Object.keys(modules).some((p) => slugOf(p) === slug)

/** Loads a private book, or undefined when it is not available. */
export async function loadPrivateBook(slug: string): Promise<PrivateBook | undefined> {
  const entry = Object.entries(modules).find(([p]) => slugOf(p) === slug)
  return entry ? (await entry[1]()).book : undefined
}

/** Flat chapter list with previous/next neighbours of `chapterSlug`. */
export function chapterNeighbours(toc: TocPart[], chapterSlug: string) {
  const flat = toc.flatMap((p) => p.chapters)
  const i = flat.findIndex((c) => c.slug === chapterSlug)
  return { chapter: i >= 0 ? flat[i] : undefined, prev: i > 0 ? flat[i - 1] : undefined, next: i >= 0 ? flat[i + 1] : undefined, first: flat[0] }
}
