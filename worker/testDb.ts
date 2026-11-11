import { DatabaseSync } from 'node:sqlite'
import type { D1, D1Stmt } from './metrics.ts'

/**
 * A real SQLite database (Node's built-in `node:sqlite`) behind the small part of the D1 API the Worker uses, so tests
 * run the actual SQL. `writes` counts rows changed, like D1's rows-written; `fail` makes every call throw.
 */
export function testDb() {
  const sqlite = new DatabaseSync(':memory:')
  const state = { writes: 0, reads: 0, fail: false as boolean | 'slow', sql: [] as string[] }
  const stmt = (sql: string, values: unknown[] = []): D1Stmt => {
    const exec = async <T>(fn: () => T): Promise<T> => {
      if (state.fail === true) throw new Error('D1_ERROR: simulated failure')
      if (state.fail === 'slow') await new Promise((r) => setTimeout(r, 2000))
      state.sql.push(sql)
      return fn()
    }
    const args = values as (string | number | null)[]
    return {
      bind: (...v: unknown[]) => stmt(sql, v),
      run: () => exec(() => {
        const r = sqlite.prepare(sql).run(...args)
        state.writes += Number(r.changes)
        return { success: true, meta: { changes: Number(r.changes) } }
      }),
      first: <T>(column?: string) => exec(() => {
        const row = sqlite.prepare(sql).get(...args) as Record<string, unknown> | undefined
        state.reads += row ? 1 : 0
        return (row ? (column ? row[column] : { ...row }) : null) as T | null
      }),
      all: <T>() => exec(() => {
        const results = sqlite.prepare(sql).all(...args).map((r) => ({ ...r })) as T[]
        state.reads += results.length
        return { results }
      }),
    }
  }
  const db: D1 = {
    prepare: (sql) => stmt(sql),
    batch: async (statements) => {
      if (state.fail === true) throw new Error('D1_ERROR: simulated failure')
      sqlite.exec('BEGIN')
      try {
        const out = []
        for (const s of statements) out.push(await s.run())
        sqlite.exec('COMMIT')
        return out
      } catch (e) {
        sqlite.exec('ROLLBACK')
        throw e
      }
    },
  }
  return { db, sqlite, state }
}
