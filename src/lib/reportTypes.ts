/** One day on the report charts (UTC). */
export type ReportDay = {
  day: string
  views: number
  visits: number
  answered: number
  smallTalk: number
  refused: number
  /** rate_limited + quota + busy */
  limited: number
  errors: number
  neurons: number
}

export type ReportTotals = { views: number; visits: number; questions: number; answered: number; smallTalk: number; neurons: number; latencyMs: number }

/** A top-list row: [key, count]. Keys come from fixed allowlists (pages, countries, referrers) or our own section titles. */
export type TopRow = [string, number]

/** The report for one period, built by the Worker's cron every 15 minutes (worker/metrics.ts). */
export type Snapshot = {
  days: 7 | 30 | 90
  from: string
  to: string
  /** First day with any data, or null. */
  since: string | null
  series: ReportDay[]
  current: ReportTotals
  previous: ReportTotals
  latency: { lt2: number; '2to5': number; '5to10': number; gt10: number }
  /** Completed days only; counts under 3 are folded into "other". */
  top: { pages: TopRow[]; topics: TopRow[]; countries: TopRow[]; refs: TopRow[] }
  devices: { phone: number; desktop: number }
  via: { search: number; chat: number }
}

export type Today = { neurons: number; budget: number; limit: number }

/** `GET /api/stats?days=…` */
export type StatsResponse = ({ empty?: false; builtAt: string } & Snapshot & { today: Today }) | { empty: true; today: Today }
