import Box from '@mui/material/Box'
import { useEffect, useState, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { findTextRanges, overlayBoxes, setNativeHighlight, supportsNativeHighlight, type Box as Rect } from '@/lib/search/highlight'
import { tokenize } from '@/lib/search/text'

/** Highlight colour for both themes: translucent amber keeps the text's own colour readable. */
export const HIGHLIGHT_COLOR = 'rgba(250, 204, 21, 0.45)'

/**
 * Highlights the words of `?q=` inside `root`, without changing the page's DOM: the native CSS Custom
 * Highlight API where available, otherwise a layer of boxes drawn over the text. Also scrolls to the
 * `#anchor` of a search result. Re-applies while lazy content renders, and clears when `q` goes away.
 */
export function SearchHighlight({ root }: { root: RefObject<HTMLElement | null> }) {
  const { search, hash, key } = useLocation()
  const query = new URLSearchParams(search).get('q') ?? ''
  const [boxes, setBoxes] = useState<Rect[]>([])

  useEffect(() => {
    const el = root.current
    const terms = tokenize(query)
    if (!el) return
    const native = supportsNativeHighlight()
    const apply = () => {
      const ranges = findTextRanges(el, terms)
      if (native) setNativeHighlight(ranges)
      else setBoxes(overlayBoxes(ranges))
    }
    apply()
    let timer: ReturnType<typeof setTimeout> | undefined
    const later = () => {
      clearTimeout(timer)
      timer = setTimeout(apply, 80)
    }
    const observer = new MutationObserver(later)
    observer.observe(el, { subtree: true, childList: true, characterData: true })
    if (!native) window.addEventListener('resize', later)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
      window.removeEventListener('resize', later)
      if (native) setNativeHighlight([])
      setBoxes([])
    }
  }, [query, root, key])

  // Scroll to the result's section; keep it in place while late content (e.g. the opening tree) loads above it,
  // until the visitor scrolls themselves.
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1))
    if (!id) return
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let userMoved = false
    const stop = () => (userMoved = true)
    const go = (behavior: ScrollBehavior) => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior })
    const first = setTimeout(() => go(smooth ? 'smooth' : 'auto'), 0)
    const settle = [400, 900, 1600].map((ms) => setTimeout(() => !userMoved && go('auto'), ms))
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', stop)
    return () => {
      clearTimeout(first)
      settle.forEach(clearTimeout)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', stop)
    }
  }, [hash, key])

  if (boxes.length === 0) return null
  return (
    <Box aria-hidden data-search-ignore sx={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
      {boxes.map((b, i) => (
        <Box key={i} sx={{ position: 'absolute', top: b.top, left: b.left, width: b.width, height: b.height, bgcolor: HIGHLIGHT_COLOR, borderRadius: '3px' }} />
      ))}
    </Box>
  )
}
