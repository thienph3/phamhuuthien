import type { GameSpec } from '@/lib/chess/moveTree'

export type NavLink = { label: string; href: string }

export type Project = {
  title: string
  summary: string
  tags: string[]
  href?: string
}

/** One thing done in a job. `status` marks whether it shipped. */
export type Highlight = { title: string; text: string; tags?: string[]; status?: 'production' | 'prototype' }

export type Track = 'software' | 'data' | 'ml' | 'backend'

/**
 * Where a job sits on the CV timeline: fractional years, approximate until months are known (e.g. 2018.5 = mid-2018).
 * `track2` splits the bar when the role changed (be: data, then ML).
 */
export type TimelineSpan = { from: number; to: number; track: Track; track2?: Track }

/** A job, most recent first in the list. `period` is free text, e.g. '2022 – 2023'. */
export type Job = {
  company: string
  companyNote?: string
  role: string
  period?: string
  highlights: Highlight[]
  /** Early-career job: shown compactly, one line, under "Earlier". */
  early?: boolean
  timeline: TimelineSpan
}

/** A non-job bar on the CV timeline (study, chess). `dashed` marks something not completed. */
export type TimelineExtra = { lane: 'Study' | 'Chess'; label: string; from: number; to: number; dashed?: boolean }

/** Home page: a number with what it measures. */
export type Proof = { value: string; label: string }
/** Home page: something I keep doing, with the work that shows it (`href` points at its CV entry). */
export type Theme = { title: string; text: string; link: { label: string; href: string } }
/** Home page: one piece of work told as problem → what I did → result. */
export type Story = { company: string; when: string; title: string; text: string; result: string; href: string }

/** A school or programme. `title` says exactly what was studied, including "(not completed)" when it was not finished. */
export type Education = { when: string; title: string; school: string; text: string }

/** A prize or selection. `when` is free text ("2014", "2004–05 and 2005–06"). Only claims a certificate or a public record backs. */
export type Award = { when: string; title: string; org: string; text: string; link?: { label: string; href: string } }

/**
 * A paper, author list exactly as published. `me` is the index of my name in `authors` (shown in bold); keep the real
 * position, never reorder. `doi` is the bare DOI ("10.1109/…").
 */
export type Publication = { year: number; title: string; authors: string[]; me: number; publisher: 'IEEE' | 'Springer' | 'Journal'; venue: string; doi: string }

export type BookStatus = 'reading' | 'read' | 'want'

export type Book = {
  slug: string
  title: string
  author: string
  topics: string[]
  status: BookStatus
  rating?: number
  /** Short introduction shown under the title, in your own words. */
  intro?: string
  /** Reader-note sections, in order. Your own words. A section can end with an interactive demo. */
  sections?: BookSection[]
  /** Own-words notes shown on the book page. Never paste text from the book. */
  notes?: BookNotes
  demos?: BookDemo[]
}

/** Optional interactive extras shown on a book page, in order. Add a variant here, then render it in BookDemo. */
export type BookDemo =
  | { type: 'chess-game'; game: GameSpec }
  | { type: 'chess-pgn'; pgn: string }
  | { type: 'chess-diagram'; fen: string; caption?: string; orientation?: 'white' | 'black' }
  | { type: 'chess-quiz'; fen: string; question: string; answer: string; explanation?: string }
  /** Opening tree from src/content/books/<slug>.repertoire.json (+ optional <slug>.notes.ts). */
  | { type: 'repertoire'; slug: string; title?: string; help?: string }

export type BookSection = {
  title: string
  paragraphs?: string[]
  /** Points shown after the paragraphs. The words up to the first '.' or ':' are shown in bold as a lead-in. */
  items?: string[]
  /** Number the points (for a short sequence such as "five ideas"). */
  numbered?: boolean
  /** Interactive note shown at the end of the section, with an optional one-line guide. */
  demo?: BookDemo
  demoHelp?: string
}

export type BookNotes = {
  why: string
  ideas: string[]
  applied: string
  verdict: string
}
