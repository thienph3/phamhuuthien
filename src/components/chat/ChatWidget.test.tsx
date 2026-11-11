import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { ALERTS, ChatWidget, isSafePath } from './ChatWidget'

function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.pathname + l.search + l.hash}</output>
}
const setup = () => {
  render(<MemoryRouter><ThemeProvider theme={createTheme()}><ChatWidget /><Where /></ThemeProvider></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Ask about Thien' }))
}
const reply = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
const ask = (text: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Your question' }), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
}

afterEach(() => vi.restoreAllMocks())

describe('ChatWidget', () => {
  it('opens a labelled panel with suggestions and the privacy line, focuses the input, and Esc closes it', async () => {
    setup()
    const launcher = screen.getByRole('button', { name: 'Ask about Thien' })
    expect(launcher).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Chat about Thien’s pages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'What does Thien do now?' })).toBeInTheDocument()
    expect(screen.getByText(/not stored by this site/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Your question' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(launcher).toHaveFocus())
  })

  it('sends the question, shows the answer as plain text, and a source opens the page with the highlight', async () => {
    const fetch = reply(200, { answer: '<img src=x onerror=alert(1)> Thien leads seven ML engineers.', sources: [{ title: 'Leading a team', url: '/?q=team#exp-vinamilk-leading' }] })
    setup()
    ask('Has he led a team?')
    expect(await screen.findByText(/Thien leads seven ML engineers/)).toHaveTextContent('<img src=x onerror=alert(1)>')
    expect(document.querySelector('img')).toBeNull()
    const sent = JSON.parse((fetch.mock.calls[0][1] as RequestInit).body as string)
    expect(sent).toEqual({ messages: [{ role: 'user', content: 'Has he led a team?' }] })
    fireEvent.click(screen.getByRole('button', { name: 'Leading a team' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/?q=team#exp-vinamilk-leading')
  })

  it('sends the previous question with a follow-up', async () => {
    const fetch = reply(200, { answer: 'ok', sources: [] })
    setup()
    ask('Tell me about MoMo')
    await screen.findByText('ok')
    ask('and at Tiki?')
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(JSON.parse((fetch.mock.calls[1][1] as RequestInit).body as string).messages.map((m: { content: string }) => m.content)).toEqual(['Tell me about MoMo', 'and at Tiki?'])
  })

  it('drops sources that are not same-site paths', async () => {
    reply(200, { answer: 'ok', sources: [{ title: 'Evil', url: '//evil.example' }, { title: 'Evil2', url: 'https://evil.example' }, { title: 'Evil3', url: '/\\evil.example' }, { title: 'Good', url: '/#about' }] })
    setup()
    ask('Who is Thien?')
    await screen.findByText('ok')
    expect(screen.queryByRole('button', { name: /Evil/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument()
  })

  it.each([
    [429, 'quota', ALERTS.quota.title],
    [503, 'busy', ALERTS.busy.title],
    [429, 'rate_limited', ALERTS.rate_limited.title],
    [503, 'unavailable', ALERTS.unavailable.title],
    [500, 'something_new', ALERTS.unavailable.title],
  ])('HTTP %i %s shows a clear alert and keeps the question', async (status, code, title) => {
    reply(status, { error: { code, message: 'server text' } })
    setup()
    ask('Tell me about MoMo')
    expect(await screen.findByRole('alert')).toHaveTextContent(title)
    expect(screen.queryByText('server text')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Your question' })).toHaveValue('Tell me about MoMo')
  })

  it('a retry after an error does not duplicate the question or send it twice', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'busy' } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ answer: 'ok', sources: [] }), { status: 200 }))
    setup()
    ask('Tell me about MoMo')
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('ok')
    expect(screen.getAllByText('Tell me about MoMo')).toHaveLength(1)
    expect(JSON.parse((fetch.mock.calls[1][1] as RequestInit).body as string).messages).toHaveLength(1)
  })

  it('a question over 500 characters is stopped in the browser with a clear message', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    setup()
    // The input caps typing at 500; this covers pasted or programmatic text.
    fireEvent.change(screen.getByRole('textbox', { name: 'Your question' }), { target: { value: 'a'.repeat(501) } })
    fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent(ALERTS.too_long.title)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('a network failure says the chatbot cannot be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    setup()
    ask('Tell me about MoMo')
    expect(await screen.findByRole('alert')).toHaveTextContent(ALERTS.offline.title)
  })

  it('a non-JSON reply (e.g. the dev server) is shown as unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<!doctype html>', { status: 200 }))
    setup()
    ask('Tell me about MoMo')
    expect(await screen.findByRole('alert')).toHaveTextContent(ALERTS.unavailable.title)
  })
})

describe('isSafePath', () => {
  it.each([['/', true], ['/books/colle-system?q=e4#section-five-core-ideas', true], ['//evil.example', false], ['/\\evil.example', false], ['https://evil.example', false], ['javascript:alert(1)', false], [' /x', false], [5, false]])(
    '%s → %s',
    (url, ok) => expect(isSafePath(url)).toBe(ok),
  )
})
