/**
 * Renders the /cv page to public/Thien-Pham-CV.pdf (A4, print stylesheet) and records the CV fingerprint, so the
 * download always matches the page. Run after changing CV content: `npm run cv:pdf` (it builds first).
 *
 * Needs a local Edge or Chrome: set CHROME_PATH, or the usual macOS / Linux / Windows paths are tried.
 * Exits non-zero on any failure, and checks the PDF stays within MAX_PAGES (2).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
import { preview } from 'vite'
import { cvHash, HASH_PATH, PDF_PATH } from './lib/cvHash.ts'

const MAX_PAGES = 2
const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter((p): p is string => !!p)

const executablePath = CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('cv:pdf: no Edge or Chrome found. Set CHROME_PATH to a Chromium-based browser.')
  process.exit(1)
}

const server = await preview({ preview: { port: 4190, strictPort: false, open: false }, logLevel: 'error' })
const base = server.resolvedUrls?.local[0]
let failed = false
const browser = await puppeteer.launch({ executablePath, headless: true })
try {
  if (!base) throw new Error('preview server did not start')
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await page.goto(new URL('cv', base).href, { waitUntil: 'networkidle0' })
  await page.pdf({ path: PDF_PATH, format: 'A4', printBackground: true, preferCSSPageSize: true })
  const pages = readFileSync(PDF_PATH, 'latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0
  console.log(`cv:pdf: wrote ${PDF_PATH} (${pages} page${pages === 1 ? '' : 's'})`)
  if (pages === 0) throw new Error('could not count the PDF pages')
  if (pages > MAX_PAGES) throw new Error(`the CV is ${pages} pages; keep it to ${MAX_PAGES}`)
  // Only a PDF that passed the checks gets a matching fingerprint (the stale test stays red otherwise).
  writeFileSync(HASH_PATH, cvHash() + '\n')
} catch (e) {
  console.error('cv:pdf:', (e as Error).message)
  failed = true
} finally {
  await browser.close()
  await server.close()
}
process.exit(failed ? 1 : 0)
