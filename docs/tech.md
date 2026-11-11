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
