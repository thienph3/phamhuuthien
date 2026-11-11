import { matchRanges } from './text.ts'

/** Name of the native highlight; styled with `::highlight(site-search)` in the theme. */
export const HIGHLIGHT_NAME = 'site-search'

/** Never highlighted: form fields, scripts, hidden text, and anything marked `data-search-ignore` (e.g. boards). */
const SKIP = 'input, textarea, script, style, [data-search-ignore], [aria-hidden="true"]'

/** DOM Ranges for every match of `terms` in the visible text under `root`. Reads the DOM; never changes it. */
export function findTextRanges(root: Node, terms: string[]): Range[] {
  if (terms.length === 0) return []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  })
  const ranges: Range[] = []
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    for (const [start, end] of matchRanges(node.data, terms)) {
      const r = document.createRange()
      r.setStart(node, start)
      r.setEnd(node, end)
      ranges.push(r)
    }
  }
  return ranges
}

/** True when the browser has the CSS Custom Highlight API (native highlighting without touching the DOM). */
export const supportsNativeHighlight = (): boolean =>
  typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined'

/** Shows `ranges` with the native API, or clears it when there are none. */
export function setNativeHighlight(ranges: Range[]): void {
  if (ranges.length) CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges))
  else CSS.highlights.delete(HIGHLIGHT_NAME)
}

export type Box = { top: number; left: number; width: number; height: number }

/** Fallback for browsers without the native API: one box per line of each match, in page coordinates. */
export function overlayBoxes(ranges: Range[]): Box[] {
  return ranges.flatMap((r) =>
    [...r.getClientRects()].map((rect) => ({ top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height })),
  )
}
