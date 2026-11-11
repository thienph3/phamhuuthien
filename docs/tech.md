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

## Cloudflare D1, cron triggers, request.cf, AI usage (verified 2026-11-11)

- **D1 binding:** `"d1_databases": [{ "binding": "DB", "database_name": "…" }]`. Without `database_id`, Wrangler
  **auto-provisions** the database on deploy; from a Git-connected deploy the ID is only shown in the dashboard (not
  written back), so pin it in `wrangler.jsonc` afterwards. Source: https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning
- **D1 API:** `env.DB.prepare(sql).bind(...values)` → `.run()` (D1Result `{ success, meta, results }`), `.all()`,
  `.first(column?)` (row or `null`), `.raw()`; `env.DB.batch([stmt, …])` runs statements sequentially as one transaction
  (rolls back on error). Parameters: `?` or `?NNN` only (no named params). `exec()` only for maintenance.
  Source: https://developers.cloudflare.com/d1/worker-api/d1-database/ , https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- **D1 free limits:** 100,000 rows written and 5,000,000 rows read per day (all databases, reset 00:00 UTC), 5 GB; since
  2026-09-01 queries fail on Free once exceeded. Source: https://developers.cloudflare.com/d1/platform/pricing
- **Cron triggers:** `"triggers": { "crons": ["*/15 * * * *"] }`; handler `scheduled(controller, env, ctx)`; Free plan:
  5 crons per account, **10 ms CPU** per run (waiting on D1 is not CPU). Source: https://developers.cloudflare.com/workers/platform/limits/
- **`ctx.waitUntil(promise)`:** work after the response, up to 30 s. Source: https://developers.cloudflare.com/workers/runtime-apis/context/
- **`request.cf.country`:** 2-letter code or null (same as `CF-IPCountry`; `XX` unknown, `T1` Tor).
  Source: https://developers.cloudflare.com/workers/runtime-apis/request/
- **Workers AI usage:** the 70B model's synchronous output has `usage: { prompt_tokens, completion_tokens, total_tokens }`.
  Source: https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/sync-output.json
- **`preview_urls`** (boolean, default false) in the Wrangler schema (`node_modules/wrangler/config-schema.json`, 4.157.0).
- **Tests:** `node:sqlite` (`DatabaseSync`, Node 22.23, experimental warning) supports `WITHOUT ROWID` and
  `ON CONFLICT … DO UPDATE SET value = value + excluded.value`; `worker/testDb.ts` wraps it in the D1 shape.
