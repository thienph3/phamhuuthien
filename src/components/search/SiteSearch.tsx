import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createIndex, type SearchDoc, type SearchHit } from '@/lib/search/bm25'
import { matchRanges } from '@/lib/search/text'
import { markVia } from '@/lib/visit'
import { accentSoft, tokens } from '@/theme'
import { HIGHLIGHT_COLOR } from './SearchHighlight'

/** Text with the matched words wrapped in <mark> (our own React output, not the page's DOM). */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  let at = 0
  const parts = matchRanges(text, terms).map(([s, e], i) => {
    const before = text.slice(at, s)
    at = e
    return (
      <Fragment key={i}>
        {before}
        <Box component="mark" sx={{ bgcolor: HIGHLIGHT_COLOR, color: 'inherit', borderRadius: '3px', px: '1px' }}>{text.slice(s, e)}</Box>
      </Fragment>
    )
  })
  return <>{parts}{text.slice(at)}</>
}

/** About 170 characters of `text` around the first match. */
function snippet(text: string, terms: string[]): string {
  const first = matchRanges(text, terms)[0]
  const start = first ? Math.max(0, first[0] - 50) : 0
  return (start ? '…' : '') + text.slice(start, start + 170) + (start + 170 < text.length ? '…' : '')
}

/** `window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))` opens and focuses the search box. */
export const OPEN_SEARCH_EVENT = 'site:open-search'

const isTyping = (el: Element | null) => !!el && (el.matches('input, textarea, select') || (el as HTMLElement).isContentEditable)

/**
 * Site search in the header: BM25 over the site's own sections, results in a dropdown while typing.
 * Choosing a result opens its page at the section with the words highlighted (`?q=…#anchor`).
 * Keyboard: `/` focuses it, ↑ ↓ choose, Enter opens, Esc closes. On small screens it is an icon that opens it.
 */
export function SiteSearch({ docs }: { docs: SearchDoc[] }) {
  const index = useMemo(() => createIndex(docs), [docs])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const [expanded, setExpanded] = useState(false) // small screens: the box is open
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const listId = useId()
  const { terms, hits } = useMemo(() => index.search(query), [index, query])
  const open = focused && query.trim() !== ''

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !isTyping(document.activeElement)) {
        e.preventDefault()
        setExpanded(true)
        setTimeout(() => input.current?.focus(), 0)
      }
    }
    // Other parts of the page (e.g. "Try search") open the search box with this event.
    const onOpen = () => {
      setExpanded(true)
      setTimeout(() => input.current?.focus(), 0)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen)
    }
  }, [])

  const close = () => {
    setQuery('')
    setActive(0)
    setExpanded(false)
    input.current?.blur()
  }
  const choose = (hit: SearchHit) => {
    const [pathname, anchor] = hit.doc.url.split('#')
    markVia('search', pathname)
    navigate({ pathname, search: `?q=${encodeURIComponent(query.trim())}`, hash: anchor ? `#${anchor}` : '' })
    close()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && hits.length) setActive((a) => (a + 1) % hits.length)
    else if (e.key === 'ArrowUp' && hits.length) setActive((a) => (a - 1 + hits.length) % hits.length)
    else if (e.key === 'Enter' && hits[active]) choose(hits[active])
    else if (e.key === 'Escape') close()
    else return
    e.preventDefault()
  }
  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [active, listId])

  return (
    <Box sx={{ position: 'relative', flex: 'none' }}>
      <IconButton aria-label="Search this site" onClick={() => { setExpanded(true); setTimeout(() => input.current?.focus(), 0) }}
        sx={{ display: { xs: 'inline-flex', md: 'none' }, border: 1, borderColor: 'divider', width: 44, height: 44 }}>
        <SearchIcon fontSize="small" />
      </IconButton>
      <Box
        sx={[
          { display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, width: 260, height: 44, px: 1.5, border: 1, borderColor: 'divider', borderRadius: 999, bgcolor: 'background.paper', color: 'text.secondary',
            '&:focus-within': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px color-mix(in srgb, ${t.vars ? t.vars.palette.primary.main : t.palette.primary.main} 20%, transparent)` } },
          // Responsive like the base style above: a plain `display` would lose to its media-query rule.
          expanded && { display: { xs: 'flex', md: 'flex' }, position: { xs: 'fixed', md: 'static' }, top: { xs: 10 }, left: { xs: 12 }, right: { xs: 12 }, width: { xs: 'auto', md: 260 }, zIndex: 1300 },
        ]}
      >
        <SearchIcon fontSize="small" aria-hidden />
        <InputBase
          inputRef={input}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0) }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (!query) setExpanded(false) }}
          onKeyDown={onKeyDown}
          placeholder="Search this site"
          inputProps={{
            role: 'combobox', 'aria-label': 'Search this site', 'aria-expanded': open, 'aria-controls': listId, 'aria-autocomplete': 'list',
            'aria-activedescendant': open && hits.length ? `${listId}-${active}` : undefined, autoComplete: 'off', spellCheck: false, type: 'search',
          }}
          sx={{ flex: 1, minWidth: 0, color: 'text.primary', '& input::-webkit-search-cancel-button': { display: 'none' } }}
        />
        {query ? (
          <IconButton size="small" aria-label="Clear search" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQuery(''); input.current?.focus() }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : (
          <Box component="kbd" aria-hidden sx={{ fontFamily: tokens.mono, fontSize: '0.72rem', border: 1, borderColor: 'divider', borderRadius: 1.5, px: 0.75, display: { xs: 'none', md: 'inline' } }}>/</Box>
        )}
      </Box>

      {open && (
        <Paper elevation={8} sx={{ position: { xs: 'fixed', md: 'absolute' }, top: { xs: 62, md: 52 }, left: { xs: 12, md: 'auto' }, right: { xs: 12, md: 0 }, width: { md: 440 }, maxWidth: 'calc(100vw - 24px)', borderRadius: 3.5, overflow: 'hidden', zIndex: 1300, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1, borderBottom: 1, borderColor: 'divider', fontSize: '0.78rem', color: 'text.secondary' }}>
            <span aria-live="polite">{hits.length ? `${hits.length} result${hits.length > 1 ? 's' : ''}` : ''}</span>
            <span>this site only</span>
          </Box>
          <Box component="ul" role="listbox" id={listId} aria-label="Search results" sx={{ listStyle: 'none', m: 0, p: 0.75, maxHeight: '60vh', overflowY: 'auto' }}>
            {hits.length === 0 && (
              <Box component="li" role="option" aria-disabled="true" aria-selected="false" sx={{ p: 2, color: 'text.secondary', fontSize: '0.92rem' }}>
                No results for “{query.trim()}”. Try a company, a skill or a book.
              </Box>
            )}
            {hits.map((h, i) => (
              <Box component="li" key={h.doc.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()} onClick={() => choose(h)} onMouseEnter={() => setActive(i)}
                sx={{ px: 1.5, py: 1.25, borderRadius: 2.5, cursor: 'pointer', bgcolor: i === active ? accentSoft : 'transparent' }}>
                <Typography component="div" sx={{ fontFamily: tokens.mono, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'primary.dark' }}>
                  {h.doc.page} · {h.doc.section.replace(/^Experience · /, '')}
                </Typography>
                <Typography component="div" sx={{ fontWeight: 700, my: 0.25 }}><Marked text={h.doc.title} terms={terms} /></Typography>
                <Typography component="div" variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  <Marked text={snippet(h.doc.text, terms)} terms={terms} />
                </Typography>
              </Box>
            ))}
          </Box>
          <Box aria-hidden sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, px: 2, py: 0.75, borderTop: 1, borderColor: 'divider', fontSize: '0.75rem', color: 'text.secondary' }}>
            <span>↑↓ choose</span><span>↵ open</span><span>esc close</span>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
