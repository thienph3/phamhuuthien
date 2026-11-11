import { error, handleChat, type Env } from './chat.ts'

/**
 * The site's Worker. Cloudflare runs it only for `/api/*` (`assets.run_worker_first` in wrangler.jsonc);
 * every other path is served straight from the static assets in dist/.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/chat') {
      try {
        return await handleChat(request, env)
      } catch {
        // Anything unexpected still answers as JSON with the safe headers and a fixed message.
        console.error('chat: unavailable')
        return error('unavailable')
      }
    }
    if (pathname.startsWith('/api/')) return error('not_found')
    return env.ASSETS.fetch(request)
  },
}
