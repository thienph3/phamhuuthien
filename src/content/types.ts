export type NavLink = { label: string; href: string }

export type Project = {
  title: string
  summary: string
  tags: string[]
  href?: string
}

/** One thing done in a job. `status` marks whether it shipped. */
export type Highlight = { title: string; text: string; tags?: string[]; status?: 'production' | 'prototype' }

/** A job, most recent first in the list. `period` is free text, e.g. '2022 – 2023'. */
export type Job = {
  company: string
  companyNote?: string
  role: string
  period?: string
  highlights: Highlight[]
  /** Early-career job: shown compactly, one line, under "Earlier". */
  early?: boolean
}
