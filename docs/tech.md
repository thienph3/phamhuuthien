# Verified APIs

Checked against installed packages on 2026-11-11. Versions are pinned in `package.json`.

## MUI 9.5.0
- `Stack` no longer accepts system props such as `flexWrap` or `alignItems`; pass them in `sx`
  (`<Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap' }}>`). Found by `tsc`.
- Light/dark: `createTheme({ cssVariables: { colorSchemeSelector: 'data' }, colorSchemes: { light, dark } })`,
  toggle with `useColorScheme()` (`mode`, `systemMode`, `setMode`); `<ThemeProvider noSsr>` for a client-only app.
  Source: https://mui.com/material-ui/customization/dark-mode/

## chess.js 1.4.0
- `new Chess(fen?)`, `move(san)` throws on illegal moves, `fen()`, `inCheck()`, `turn()`, `validateFen(fen).ok`.
- `loadPgn(pgn)` keeps the main line, headers (`header()`) and comments (`getComments()` → `{ fen, comment }[]`),
  but drops `( … )` variations. Verified by running it.

## react-chessboard 5.12.1
- `<Chessboard options={{ position, boardOrientation, allowDragging, showNotation, squareStyles, … }} />`.
- Renders each square as an unnamed `role="button"`; `BoardView` wraps it in `role="img"` + `inert`.

## @mdx-js/rollup 3.1.1 / @mdx-js/mdx 3.1.1
- Vite: `plugins: [{ enforce: 'pre', ...mdx() }, react({ include: /\.(mdx|tsx|ts|jsx|js)$/ })]`.
- Literal lowercase JSX in MDX (`<h1>`, `<details>`) is not replaced by the `components` prop; style it with CSS (`Prose`).
- `createProcessor().parse(src)` gives `mdxJsxFlowElement` / `mdxJsxTextElement` nodes; expression props carry
  `value.data.estree` (an ESTree `Program`). Verified by parsing a sample.

## Node 22.23.1
- Runs `.ts` files directly (type stripping, `process.features.typescript === 'strip'`). Imports between files
  run this way need explicit `.ts` extensions (`tsconfig`: `allowImportingTsExtensions`).

## Cloudflare Workers AI, rate limiting, Worker + static assets (verified 2026-11-11)

- **AI binding:** `"ai": { "binding": "AI" }` in `wrangler.jsonc`; call `await env.AI.run(model, { messages, max_tokens })`.
  Source: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- **Model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`: input `messages` ([{ role, content }]), `max_tokens` (default 256),
  `temperature` (0–5, default 0.6); output `{ response: string, usage }`. Context window 24,000 tokens; zero data retention.
  Source: https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/
- **Pricing:** 10,000 Neurons/day free on Workers Free and Paid, reset 00:00 UTC; on Workers Free, requests fail once used up.
  llama-3.3-70b-instruct-fp8-fast: 26,668 Neurons per M input tokens, 204,805 per M output tokens.
  Source: https://developers.cloudflare.com/workers-ai/platform/pricing/
- **Errors:** `3036` / HTTP 429 "Account limited" (daily free allocation used up); `3040` / 429 "Out of capacity"
  (try again); `3007` / 408 timeout; `3006` / 413 request too large.
  Source: https://developers.cloudflare.com/workers-ai/platform/errors/
- **Worker + assets:** `"main"` points at the Worker; in `"assets"`, `"binding": "ASSETS"` and
  `"run_worker_first": ["/api/*"]` run the Worker only for `/api/*`; everything else is served as static assets
  (with `not_found_handling: "single-page-application"`). Source: https://developers.cloudflare.com/workers/static-assets/binding/
- **Rate limiting binding:** `"ratelimits": [{ "name", "namespace_id": "<integer as string>", "simple": { "limit", "period": 10 | 60 } }]`;
  `await env.X.limit({ key })` → `{ success }`. Needs Wrangler ≥ 4.36. Limits are approximate and per Cloudflare location.
  Cloudflare advises against IP keys (shared IPs); for anonymous visitors there is no better key, so pair it with a global key.
  Source: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- **Local dev:** Workers AI has no local simulation; the binding needs `"remote": true` for `wrangler dev` (and
  `wrangler login`). Rate-limit bindings run locally. Source: https://developers.cloudflare.com/workers/development-testing/
- **Not verified (needs a deploy):** the exact text of errors thrown by `env.AI.run`. `worker/chat.ts` `mapAiError`
  matches `3036` / "account limited" → quota and `3040` / "out of capacity" → busy in `err.message`; anything else
  fails safe to `unavailable`. Check on the live Worker and update this note. Verified with Wrangler 4.157.0
  (`npx wrangler deploy --dry-run` lists AI, both rate limits, ASSETS, CHAT_MODEL).
