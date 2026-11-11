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
    chess/      GameViewer, PgnViewer, PositionDiagram, PositionQuiz, LineExplorer,
                RepertoireExplorer (+ BoardView, MoveList, GameControls)
  content/      all page copy and data (site.ts) and its types; books/ holds generated move data
  lib/          pure helpers with tests: book filtering, private books, lib/chess
  pages/        pages only assemble components + content (Home, BookPage, BookReaderPage, NotFound)
  App.tsx       route table: add new pages here
scripts/        build-repertoire and the validation pipeline (Node, run locally)
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
- Deploy command: `npx wrangler deploy` (serves `dist/`, see `wrangler.jsonc`)
- Worker name must match `name` in `wrangler.jsonc` (`phamhuuthien`)

Check the config locally with `npx wrangler deploy --dry-run` after a build.
