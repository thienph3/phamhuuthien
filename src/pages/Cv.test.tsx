// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { cvHash, HASH_PATH, PDF_PATH } from '../../scripts/lib/cvHash.ts'

describe('CV PDF', () => {
  it('exists and was made from the current CV content (run `npm run cv:pdf` after changing it)', () => {
    expect(existsSync(PDF_PATH)).toBe(true)
    expect(readFileSync(PDF_PATH, 'latin1').startsWith('%PDF-')).toBe(true)
    expect(readFileSync(HASH_PATH, 'utf8').trim()).toBe(cvHash())
  })
})
