import ChatIcon from '@mui/icons-material/ChatBubble'
import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { markVia } from '@/lib/visit'
import { accentSoft, tokens } from '@/theme'

export type Source = { title: string; url: string }
type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'bot'; text: string; sources: Source[] }
  | { kind: 'alert'; tone: 'warn' | 'error'; title: string; text: string }

export const MAX_LENGTH = 500
const CLIENT_TIMEOUT_MS = 30_000
const SUGGESTIONS = ['What does Thien do now?', 'What did he build at be?', 'How did he speed up the chatbot?', 'What did he learn from The Colle System?']
const WELCOME = 'Hi! I can answer questions about Thien’s work, experience and reading notes on this site. What would you like to know?'

/** What the visitor sees for each failure. Fixed copy: nothing from the server is shown as an error. */
export const ALERTS: Record<string, { tone: 'warn' | 'error'; title: string; text: string }> = {
  quota: { tone: 'warn', title: 'The chatbot has reached its free daily limit.', text: 'It resets at 07:00 Vietnam time (00:00 UTC). Meanwhile, use the search at the top, or email Thien from the Contact section.' },
  busy: { tone: 'warn', title: 'The AI is busy right now.', text: 'Please try again in about 30 seconds. Your question is still in the box.' },
  rate_limited: { tone: 'warn', title: 'Too many messages in a short time.', text: 'Please wait a minute, then try again. Your question is still in the box.' },
  too_long: { tone: 'warn', title: 'That message is too long.', text: `Please keep it under ${MAX_LENGTH} characters.` },
  offline: { tone: 'error', title: 'Can’t reach the chatbot.', text: 'Check your connection and try again. Your question is still in the box.' },
  unavailable: { tone: 'error', title: 'The chatbot is unavailable right now.', text: 'Please try again later, or use the search at the top.' },
}

/** Only same-site paths: starts with `/`, not `//` or `/\` (which browsers treat as another host). */
export const isSafePath = (url: unknown): url is string => typeof url === 'string' && /^\/(?![/\\])/.test(url) && !/[\s\\]/.test(url)

type Reply = { answer: string; sources: Source[] } | { error: string }

/** Calls the Worker. Any failure becomes an error code the panel knows how to explain. */
export async function askChat(questions: string[], signal?: AbortSignal): Promise<Reply> {
  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: questions.map((content) => ({ role: 'user', content })) }),
      signal,
    })
  } catch (e) {
    return { error: (e as Error)?.name === 'AbortError' ? 'unavailable' : 'offline' }
  }
  let data: { answer?: unknown; sources?: unknown; error?: { code?: unknown } }
  try {
    data = await res.json()
  } catch {
    return { error: 'unavailable' }
  }
  if (!res.ok || typeof data.answer !== 'string') {
    const code = typeof data.error?.code === 'string' ? data.error.code : ''
    return { error: Object.hasOwn(ALERTS, code) ? code : 'unavailable' }
  }
  const sources = Array.isArray(data.sources)
    ? data.sources.filter((s): s is Source => !!s && typeof s.title === 'string' && isSafePath(s.url)).slice(0, 4)
    : []
  return { answer: data.answer, sources }
}

/**
 * "Ask about Thien": a button at the bottom right that opens a small chat about the site's own pages
 * (answers come from the Worker at /api/chat, see worker/chat.ts). Sources open the page section with the
 * words highlighted. Non-modal: Esc or ✕ closes it and focus returns to the button.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [waiting, setWaiting] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const phone = useMediaQuery('(max-width:600px)')

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])
  useEffect(() => {
    log.current?.scrollTo?.({ top: log.current.scrollHeight })
  }, [entries, waiting])

  const close = () => {
    setOpen(false)
    setTimeout(() => launcher.current?.focus(), 0)
  }

  const send = async (question: string) => {
    const q = question.trim()
    if (!q || waiting) return
    if (q.length > MAX_LENGTH) return setEntries((e) => [...e, { kind: 'alert', ...ALERTS.too_long }])
    // The server uses only the last two questions (plan W1), so that is all the client sends.
    const previous = entries.filter((e) => e.kind === 'user').slice(-1).map((e) => e.text)
    setEntries((e) => [...e, { kind: 'user', text: q }])
    setText('')
    setWaiting(true)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS)
    const reply = await askChat([...previous, q], ctrl.signal)
    clearTimeout(timer)
    setWaiting(false)
    if ('error' in reply) {
      // The last entry is this question (`waiting` blocks a second send). Drop it from the log and put it back in the box, so a retry is not a duplicate.
      setEntries((e) => [...e.slice(0, -1), { kind: 'alert', ...ALERTS[reply.error] }])
      setText(q)
    } else setEntries((e) => [...e, { kind: 'bot', text: reply.answer, sources: reply.sources }])
    input.current?.focus()
  }

  const openSource = (url: string) => {
    if (!isSafePath(url)) return
    const u = new URL(url, window.location.origin)
    markVia('chat', u.pathname)
    navigate({ pathname: u.pathname, search: u.search, hash: u.hash })
    if (phone) close()
  }

  const bubble = { position: 'relative', maxWidth: '88%', px: 1.5, py: 1, borderRadius: 3.5, fontSize: '0.95rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } as const

  return (
    <>
      {!(open && phone) && (
        <Button
          ref={launcher}
          variant="contained"
          startIcon={<ChatIcon aria-hidden />}
          aria-expanded={open}
          aria-controls={open ? 'chat-panel' : undefined}
          onClick={() => (open ? close() : setOpen(true))}
          sx={{ position: 'fixed', right: { xs: 16, sm: 24 }, bottom: { xs: 16, sm: 24 }, zIndex: 1200, height: 56, px: 2.5, boxShadow: '0 16px 40px rgb(15 31 25 / 0.18)' }}
        >
          Ask about Thien
        </Button>
      )}

      {open && (
        <Paper
          id="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Chat about Thien’s pages"
          elevation={8}
          onKeyDown={(e) => e.key === 'Escape' && close()}
          sx={{
            position: 'fixed', zIndex: 1200, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: 1, borderColor: 'divider',
            right: { xs: 0, sm: 24 }, left: { xs: 0, sm: 'auto' }, bottom: { xs: 0, sm: 96 }, width: { xs: 'auto', sm: 380 },
            maxHeight: { xs: '85vh', sm: 'min(620px, calc(100vh - 120px))' }, borderRadius: { xs: '18px 18px 0 0', sm: '18px' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Box aria-hidden sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', fontWeight: 800, flex: 'none' }}>t</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1rem' }}>Ask about Thien</Typography>
              <Typography variant="caption" color="text.secondary">Answers only from this site</Typography>
            </Box>
            <IconButton aria-label="Close chat" onClick={close} sx={{ ml: 'auto', border: 1, borderColor: 'divider', width: 44, height: 44 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box ref={log} role="log" aria-live="polite" aria-label="Conversation" tabIndex={0} sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 160 }}>
            <Box sx={{ ...bubble, alignSelf: 'flex-start', bgcolor: accentSoft, borderBottomLeftRadius: 4 }}>{WELCOME}</Box>
            {entries.length === 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="outlined" size="small" onClick={() => send(s)} sx={{ minHeight: 36, px: 1.5, fontWeight: 500, color: 'text.primary', borderColor: 'divider', textAlign: 'left' }}>{s}</Button>
                ))}
              </Box>
            )}
            {entries.map((e, i) =>
              e.kind === 'user' ? (
                <Box key={i} sx={{ ...bubble, alignSelf: 'flex-end', bgcolor: 'primary.main', color: 'primary.contrastText', borderBottomRightRadius: 4 }}>
                  <Box component="span" sx={visuallyHidden}>You: </Box>{e.text}
                </Box>
              ) : e.kind === 'bot' ? (
                <Box key={i} sx={{ ...bubble, alignSelf: 'flex-start', bgcolor: accentSoft, borderBottomLeftRadius: 4 }}>
                  {/* Plain text only: React escapes it, nothing is parsed as HTML, Markdown or links. */}
                  <Box component="span" sx={visuallyHidden}>Assistant: </Box>{e.text}
                  {e.sources.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                      <Typography component="div" sx={{ width: '100%', fontFamily: tokens.mono, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Sources</Typography>
                      {e.sources.map((s) => (
                        <Button key={s.url} variant="outlined" size="small" title={s.title} onClick={() => openSource(s.url)}
                          sx={{ minHeight: 32, py: 0.25, px: 1.25, fontSize: '0.8rem', fontWeight: 500, bgcolor: 'background.paper', color: 'primary.dark', maxWidth: '100%' }}>
                          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</Box>
                        </Button>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box key={i} role="alert" sx={(t) => ({
                  alignSelf: 'stretch', borderRadius: 3, px: 1.5, py: 1, fontSize: '0.9rem',
                  bgcolor: e.tone === 'warn' ? '#fff7e6' : '#fdecec', color: e.tone === 'warn' ? '#7a4f00' : '#a1271b',
                  ...t.applyStyles('dark', { bgcolor: e.tone === 'warn' ? '#2a2210' : '#2c1513', color: e.tone === 'warn' ? '#f5c56b' : '#ff9b8f' }),
                })}>
                  <Box component="strong" sx={{ display: 'block' }}>{e.title}</Box>
                  {e.text}
                </Box>
              ),
            )}
            {waiting && <Typography variant="body2" color="text.secondary" role="status">Thinking…</Typography>}
          </Box>

          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', px: 2, pb: 1 }}>
            Messages are sent to Cloudflare Workers AI and are not stored by this site. Please don’t share personal data.
          </Typography>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); send(text) }} sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <InputBase
              inputRef={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about Thien’s work, experience, books…"
              inputProps={{ 'aria-label': 'Your question', maxLength: MAX_LENGTH, autoComplete: 'off' }}
              sx={{ flex: 1, minWidth: 0, height: 44, px: 2, border: 1, borderColor: 'divider', borderRadius: 999, bgcolor: 'background.default', '&.Mui-focused': { borderColor: 'primary.main' } }}
            />
            <Button type="submit" variant="contained" disabled={waiting || !text.trim()}>Send</Button>
          </Box>
        </Paper>
      )}
    </>
  )
}

const visuallyHidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const
