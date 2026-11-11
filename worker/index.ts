import { error, handleChat, TOPIC_TITLES, type Env } from './chat.ts'
import { runCron } from './metrics.ts'
import { handleStats } from './stats.ts'
import { handleVisit } from './visit.ts'

type Ctx = { waitUntil(promise: Promise<unknown>): void }
const log = (code: string) => console.error(`report: ${code}`)

/**
 * The site's Worker. Cloudflare runs it only for `/api/*` (`assets.run_worker_first` in wrangler.jsonc); every other path
 * is served straight from the static assets in dist/. The cron builds the report snapshots (worker/metrics.ts).
 */
export default {
  async fetch(request: Request, env: Env, ctx?: Ctx): Promise<Response> {
    const { pathname } = new URL(request.url)
    const waitUntil = ctx && ((p: Promise<unknown>) => ctx.waitUntil(p))
    const route =
      pathname === '/api/chat' ? () => handleChat(request, env, { waitUntil }) :
      pathname === '/api/visit' ? () => handleVisit(request, env, { waitUntil }) :
      pathname === '/api/stats' ? () => handleStats(request, env) :
      undefined
    if (route) {
      try {
        return await route()
      } catch {
        // Anything unexpected still answers as JSON with the safe headers and a fixed message.
        console.error('api: unavailable')
        return error('unavailable')
      }
    }
    if (pathname.startsWith('/api/')) return error('not_found')
    return env.ASSETS.fetch(request)
  },

  async scheduled(controller: { scheduledTime: number }, env: Env, ctx: Ctx): Promise<void> {
    if (!env.DB) return
    ctx.waitUntil(runCron(env.DB, controller.scheduledTime, TOPIC_TITLES, log).catch(() => log('cron_error')))
  },
}
