/**
 * Page-view beacon for the public report (worker/visit.ts). Nothing is stored on the device: "first" is the first view of
 * this page load (a module variable), and "via" is a one-shot in-memory mark set right before an in-app navigation.
 */
let first = true
let via: { from: 'search' | 'chat'; path: string } | undefined

/**
 * Call right before navigating from a search result or a chat source to `path`. It counts only if that navigation
 * changes the page (a jump within the same page is not a page view).
 */
export const markVia = (from: 'search' | 'chat', path: string) => {
  via = { from, path }
}

type Nav = Navigator & { globalPrivacyControl?: boolean }
/** Automation, Global Privacy Control and Do Not Track are not counted. */
export const shouldCount = (nav: Nav = navigator) => !nav.webdriver && nav.globalPrivacyControl !== true && nav.doNotTrack !== '1'

/** Sends one beacon for `path`. Never throws; failures are ignored (counts are approximate by design). */
export function sendVisit(path: string, send: typeof fetch = fetch) {
  const body = {
    path,
    ref: first ? referrerHost() : '',
    first,
    phone: window.matchMedia?.('(max-width: 600px)').matches ?? false,
    ...(!first && via?.path === path ? { via: via.from } : {}),
  }
  first = false
  via = undefined
  if (!shouldCount()) return
  send('/api/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => {})
}

function referrerHost() {
  try {
    return document.referrer ? new URL(document.referrer).host : ''
  } catch {
    return ''
  }
}

/** Test hook: start as a fresh page load. */
export const resetVisit = () => {
  first = true
  via = undefined
}
