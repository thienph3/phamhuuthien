# phamhuuthien

Personal site of Thien Pham (Phạm Hữu Thiên). React + TypeScript + MUI, built with Vite, hosted on
Cloudflare (Workers static assets).

## Develop

Needs Node 22 (`.nvmrc`).

```bash
nvm use
npm install
npm run dev      # local dev server (http://localhost:5173)
npm test         # unit and component tests
npm run build    # type-check + production build into dist/
npm run preview  # serve dist/ (http://localhost:4173)
```

## Structure

```
src/
  theme/        design tokens (green palette, light/dark) and the MUI theme
  components/   reusable component library (import from '@/components')
    layout/     PageContainer, Section, SiteHeader, SiteFooter, SiteLayout, SkipLink
    ui/         LinkButton, Eyebrow, Tag/TagList, StatusPill, ThemeToggle, SearchField,
                FilterChips, EmptyState, Prose (long-form HTML/MDX text)
    cards/      ContentCard, ProjectCard, BookCard, BookCover
    sections/   Hero, AboutSection, ExperienceSection, ProjectsSection, LibrarySection, ContactSection
    books/      BookDetail, BookNotes, BookDemo, BookReader, RepertoireDemo
    search/     SiteSearch (header search box + dropdown), SearchHighlight
    chat/       ChatWidget ("Ask about Thien" button + chat panel, mounted in App.tsx)
    report/     ReportView and its SVG charts (TimeChart, Gauge, MeterTable, Bars) for /report
    chess/      GameViewer, PgnViewer, PositionDiagram, PositionQuiz, LineExplorer,
                RepertoireExplorer (+ BoardView, MoveList, GameControls)
  content/      all page copy and data (site.ts) and its types; books/ holds generated move data
  lib/          pure helpers with tests: book filtering, private books, anchors, lib/search, lib/chess
  pages/        pages only assemble components + content (Home, BookPage, BookReaderPage, Report, NotFound)
  App.tsx       route table: add new pages here
scripts/        build-repertoire and the validation pipeline (Node, run locally)
worker/         the Cloudflare Worker: runs only for /api/* (chatbot, report beacon, stats) and the report cron
```

To change text, edit `src/content/site.ts`. Lines marked `DRAFT` there still need your own facts.
New colours or spacing belong in `src/theme/tokens.ts`, not in components.

- **Experience:** `experience` in `site.ts`, most recent first. Jobs with `early: true` are shown
  compactly under "Earlier". Keep former employers' work at CV level: design and impact only, no
  internal data, features or images.
- **Projects:** `projects` in `site.ts`. The section is hidden on the home page for now; re-add
  `<ProjectsSection projects={projects} />` in `src/pages/Home.tsx` and its link in `navLinks`.
- **Library:** `books` in `site.ts`. A book with `sections`, `notes` or `demos` gets a page at
  `/books/<slug>`. Search and topic filters appear once there are 6 or more books.

## Site search

The search box in the header (press `/`) searches the site's own sections with BM25
(`src/lib/search/bm25.ts`, k1 = 1.2, b = 0.75; title matches count twice; the word being typed matches as a
prefix; accents are ignored, so `pham huu thien` finds Phạm Hữu Thiên).

- **What is searched:** `buildSiteDocs` (`src/lib/search/siteDocs.ts`) builds one entry per section from the
  content data: About, every job highlight, the Library, each book's reader-note sections, Contact. Hidden
  sections, private book text and interactive boards are not included. A test checks that every entry's
  anchor exists on the rendered page.
- **Choosing a result** opens its page at `?q=<query>#<anchor>`, scrolls to the section and highlights the
  words. The highlight never changes the page's DOM: it uses the native CSS Custom Highlight API
  (`::highlight(site-search)`, styled in `src/theme/theme.ts`), and in browsers without it draws boxes in a
  layer over the text. Anything marked `data-search-ignore` is never highlighted. Leaving the page (any URL
  without `?q=`) clears it.
- **Anchors:** ids come from `src/lib/anchors.ts`, shared by the pages and the index. Keep them in sync by
  using `anchors.*`, never hand-written ids.

## Chatbot

"Ask about Thien" (bottom right of every page) answers questions about the site's public pages with
Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, set by `CHAT_MODEL` in `wrangler.jsonc`).
The browser calls `POST /api/chat` on the same Worker that serves the site (`worker/chat.ts`); there is no API key
and no other account.

How an answer is made:

1. **Greetings, thanks, goodbyes** get a fixed reply, without the model.
2. **Retrieval:** the question is searched with the same BM25 index as the site search (whole words only,
   question words removed). If no section scores at least `RELEVANCE_FLOOR`, the visitor gets a fixed
   "I can only answer questions about Thien's pages" reply, without the model.
3. **Model:** the top 4 sections (≤ 4,000 characters) are sent as CONTEXT with rules: answer only from CONTEXT,
   refuse other topics, ignore instructions to change the rules, plain English, ≤ 120 words.
4. **Output check:** an answer that contains a link or email that is not in CONTEXT is replaced by the refusal.
5. **Sources** are built by the server, never by the model: `/<page>?q=<words>#<anchor>`. Clicking one opens
   the section with the words highlighted, like a search result.

Limits and errors (each shown to the visitor as a clear message; the question stays in the box to retry):

| Situation | Code | Visitor sees |
|---|---|---|
| Free daily allocation (10,000 Neurons ≈ 95 answers) used up | `quota` 429 | resets at 07:00 Vietnam time (00:00 UTC) |
| Workers AI out of capacity | `busy` 503 | try again in about 30 seconds |
| More than 3 model answers per visitor, or 10 in total, per minute | `rate_limited` 429 | wait a minute |
| Over 500 characters | `too_long` 413 | keep it under 500 characters |
| Network down, timeout (20 s), anything else | `offline` / `unavailable` | try again later |

Security notes:

- The `Origin` check (must equal the site's own origin, no CORS) only stops **other websites' pages** from
  calling the endpoint in a visitor's browser. It is **not authentication**: a script can send any `Origin`.
  Scripts are bounded by the rate limits, the relevance gate, the size caps and the daily quota.
- Only the visitor's own questions reach the model; `assistant` messages from the client are discarded.
- Answers are rendered as plain text. Nothing is stored or logged except error codes.
- A script rotating IPs can use up the daily quota (accepted: the chat is down until 00:00 UTC, there is no bill on
  Workers Free, the rest of the site is unaffected). **If the account moves to Workers Paid, set a spend cap or
  remove the `ai` binding first.**

Testing:

- `npm test` covers the Worker with a mocked `env.AI` and rate limiters (`worker/chat.test.ts`), and the panel
  with a mocked `fetch` (`src/components/chat/ChatWidget.test.tsx`).
- `npm run dev` / `npm run preview` have no Worker: the panel opens, but questions show "unavailable".
- `npx wrangler dev` runs the Worker and the rate limits locally. Workers AI has no local simulation, so the AI
  binding is `"remote": true`: it needs `npx wrangler login` and uses the real daily quota.
- Real answers can also be checked on a preview upload (`npx wrangler versions upload`) before going live.

After a deploy, check: a real answer with sources, an off-topic refusal, the "busy"/"quota" messages if they
happen (the error mapping matches Workers AI codes 3036/3040 in the error text), and the Worker's CPU time in the
dashboard (Free plan ≈ 10 ms per request).

## Site report (`/report`)

A public page (linked in the footer) with live numbers from the site: page views, visits, chatbot questions by
outcome, answer rate and time, Workers AI quota use per day and today, most read pages, chatbot topics, countries,
referrers, devices, and opens from search and chat sources.

```
browser ──POST /api/visit──▶ Worker ─┐                          ┌─▶ GET /api/stats ─▶ /report
chat Worker (each question) ─────────┴─▶ D1 `daily` (+1 per day × metric × key)
                                          └─ cron */15 ─▶ D1 `snapshot` (7 / 30 / 90 days) ┘
```

- **Data model** (`worker/metrics.ts`): `daily(day, metric, dim, value)` `WITHOUT ROWID`, upserted with
  `value = value + excluded.value`; `snapshot(days, json, built_at)`. Only daily totals: no raw events, IPs, user
  agents, cookies, device storage or chat text. Every `dim` comes from a fixed allowlist (`worker/allowlist.ts`):
  page keys, 30 countries, 9 referrer groups, the chatbot's own section ids. Days older than 90 are deleted.
- **Metrics** (written by `visitRows` in `worker/visit.ts` and `track()` in `worker/chat.ts`):

  | `metric` | `dim` | When |
  |---|---|---|
  | `view` | `home`, `report`, `book:<slug>`, `other` | every page change |
  | `visit`, `country`, `device`, `ref` | `''`, ISO-2 or `other`, `phone`/`desktop`, referrer group | first page of a page load |
  | `via` | `search` / `chat` | page opened from a search result or a chat source |
  | `chat` | `answered`, `small_talk`, `refused`, `rate_limited`, `quota`, `busy`, `error` | every chat question |
  | `neurons` | `''` | every model call (from token usage, `neuronsFor`) |
  | `latency`, `latency_ms`, `topic` | `lt2`…`gt10`, `''` (sum), section id | answers only |
- **Snapshots:** the cron reads the last 90 days once and builds the three periods (`buildSnapshot`, ~2 ms CPU for a full
  table). Top lists use completed days and fold counts under 3 into "Other". `/api/stats?days=7|30|90` reads one
  snapshot row and today's Neurons (2 rows), memoized for 60 s.
- **Own quota:** the chat stops with "daily limit" before calling the model once today's Neurons reach
  `CHAT_NEURON_BUDGET` (9,500). Best-effort: if D1 fails or takes > 800 ms the check is skipped and Cloudflare's own
  limit applies.
- **Limits:** every counter write goes through `WRITE_IP_LIMIT` (20/60 s) and `WRITE_GLOBAL_LIMIT` (8/60 s); over them
  the event is simply not counted. Model calls are counted regardless (already behind the chat limits and the budget).
  Typical worst case ≈ 60k of D1's 100k free rows written per day. Any D1 failure fails open: pages and chat keep working.
- **Not counted:** visitors with Do Not Track or Global Privacy Control, automation (`navigator.webdriver`), ad blockers,
  bots without JavaScript. Numbers are approximate, and the page says so.
- **Rule:** nothing goes into D1 that is not safe to publish. A new metric or key needs a threat-model update.
- **Tests:** `worker/metrics.test.ts`, `worker/report.test.ts` and `worker/allowlist.test.ts` run the real SQL on
  `node:sqlite` through `worker/testDb.ts` (a D1-shaped adapter); `src/components/report/ReportView.test.tsx` and
  `src/lib/visit.test.ts` cover the page and the beacon. Locally `npm run preview` has no Worker: `/report` shows
  "Report data is unavailable".

## Private books (local only)

Full book text lives in `private/books/<slug>/`, which is git-ignored because it is copyrighted.
Each book has `index.tsx` (exports `book: PrivateBook` with its table of contents and the components
its chapters use), `toc.ts`, optional `categories.ts` and `repertoire.ts`, and `pages/*.mdx`.

- Read it with `npm run dev` (http://localhost:5173), or from a production-style build with
  `npm run preview:private` (http://localhost:4174), at `/books/<slug>/read`.
- `npm run build` / `npm run preview` (port 4173) is the public site: no book text.
- The private build goes to the git-ignored `dist-private/`. Wrangler only uploads `dist/`, and Cloudflare
  builds from git, where `private/` does not exist, so deploys cannot contain the book.
- `npm test` also renders every private chapter when the folder exists.
- Back the folder up yourself: it is not in git.

## Opening repertoire (public)

```bash
npm run repertoire                           # colle-system, every move of every line
node scripts/build-repertoire.ts <slug> 24   # another book, or stop after 24 half-moves
```

Reads `private/books/<slug>/` and sorts every line into one kind:

| Kind | From | File (`src/content/books/`) |
|---|---|---|
| lesson | boards on lesson pages | `<slug>.lessons.moves.json` |
| question | each question + answer (`div.qrow`), turned into a line that branches off that page's board | `<slug>.questions.moves.json` |
| game | boards on example-game pages (the parts listed in `private/books/<slug>/categories.ts`) | `<slug>.games.moves.json` |
| mine | `private/books/<slug>/repertoire.ts`, if present | (repertoire only) |

The **repertoire** is lesson + question + mine: `<slug>.moves.json` (flat list) and `<slug>.repertoire.json`
(position graph, shown on the book page). Example games are kept out of it.

Only `<slug>.repertoire.json` is committed, because the site uses it. The `*.moves.json` flat lists are
local working data: the script writes them, and `.gitignore` keeps them out of git.

Question lines: the moves written in a question and its answer are attached to the lesson board at the move
the question is about (its move number must match the board), continued only without gaps, and checked for
legality from move 1. Anything that cannot be attached is never guessed; it is listed in
`private/books/<slug>/questions-unresolved.txt` (private, contains book text) so you can add those lines by hand.

- Output is **moves only**: positions keyed by FEN (transpositions merge), the moves played from each, and
  which page each line came from. No comments, captions, glyphs or notes. These files are safe to commit.
- Flat lists have one record per position and move. The unique key is `before` + `toMove`; `before` is FEN
  fields 1-4 (pieces, side to move, castling, en passant), so moves with the same key start from the same
  position and can merge:

  ```json
  { "before": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -", "toMove": "white", "move": "d4",
    "after": "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -", "sources": [0, 1, 2] }
  ```

  Each source has `kind`: `lesson`, `question`, `game` or `mine`.
- MDX props are read as data, never executed (`src/lib/chess/mdxGames.ts`); anything that is not a plain
  value is rejected.
- Lines that start from a custom position (`startFen`) are skipped, since they cannot be reached from move 1.
- Re-run it after editing the book, then commit the JSON. A private test fails if any book comment,
  caption or question text ever appears in it.

To show it on a book page, add `demo: { type: 'repertoire', slug: '<slug>' }` to one of the book's
`sections` in `src/content/site.ts`. Add your own notes in `src/content/books/<slug>.notes.ts`, keyed by
the moves from the start (on the dev server the explorer shows the key under each position):

```ts
export const notes: Record<string, string> = {
  '1.d4 d5 2.Nf3 Nf6 3.e3': 'The Colle triangle starts here.',
}
```

Any move order that reaches the same position shows the same note. A test fails on an illegal move.

## Validation pipeline (local, private)

```bash
npm run pipeline:build      # stage 1: lessons in book order, then pause at a checkpoint
npm run pipeline:validate   # stage 2: Stockfish (depth 20; or: node scripts/pipeline-validate.ts colle-system 24)
npm run pipeline            # both, stage 2 only if stage 1 passed
```

- **Stage 1** reads the lesson pages in book order (example games left out). Each page's board lines and
  question/answer lines become nodes `{ before, toMove, move, after }`; a node already in the repertoire
  (same `before` + `toMove` + `move`) is merged. Every node is checked: legal from move 1, `after` really
  follows from `before` + `move`, no conflicting key. It prints new / merged nodes per page and writes the
  checkpoint `private/books/<slug>/pipeline/build.json`. Any error stops the pipeline before stage 2.
- **Stage 2** scores every position once with Stockfish (cached in `pipeline/evals-depth<N>.json`) and grades
  each node by the win-chance drop for the side that moved, with the Lichess thresholds the book uses:
  >= 10 inaccuracy, >= 20 mistake, >= 30 blunder.
  - **invalid**: White moves (the repertoire's moves) graded mistake or blunder
  - **warning**: White inaccuracies
  - **opponent**: Black errors, which lessons often show on purpose; listed, not counted as invalid
- Report: `private/books/<slug>/pipeline/validation.md`.
- Stockfish path: `STOCKFISH=/path/to/stockfish` (default `../chess/opening/tools/stockfish/stockfish-macos-universal`).

## Deploy (Cloudflare)

Connect this repo in Workers & Pages with:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (serves `dist/` and the `worker/` for `/api/*`, see `wrangler.jsonc`)
- Worker name must match `name` in `wrangler.jsonc` (`phamhuuthien`)

Check the config locally with `npx wrangler deploy --dry-run` after a build. It should list the bindings `DB`, `AI`,
`CHAT_IP_LIMIT`, `CHAT_GLOBAL_LIMIT`, `WRITE_IP_LIMIT`, `WRITE_GLOBAL_LIMIT`, `ASSETS` and the `CHAT_MODEL` and
`CHAT_NEURON_BUDGET` variables. Workers AI, rate limits and the cron need no dashboard setup. The D1 database
`phamhuuthien-metrics` is created automatically on the first deploy (no `database_id` in `wrangler.jsonc`).

After the first deploy with the report:

1. In the dashboard (Storage & Databases → D1), confirm `phamhuuthien-metrics` exists, copy its ID into `database_id`
   in `wrangler.jsonc` and commit, so later deploys (including a local `wrangler deploy`) always use the same database.
2. Open a few pages, wait up to 15 minutes, then check `/report` shows them and `/api/stats?days=7` returns data.
3. In Workers → phamhuuthien → Metrics, check the cron's CPU time stays well under 10 ms (fallback: `*/30` in
   `triggers.crons` and "Every 15 minutes" in `ReportView.tsx`).
4. After day 91, check that no `daily` rows older than 90 days remain:
   `npx wrangler d1 execute phamhuuthien-metrics --remote --command "SELECT MIN(day) FROM daily"`.
