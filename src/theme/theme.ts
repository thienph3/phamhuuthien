import { createTheme } from '@mui/material/styles'
import { tokens } from './tokens'

type Scheme = Record<keyof typeof tokens.light, string>

const scheme = (t: Scheme) => ({
  palette: {
    primary: { main: t.accent, dark: t.accentStrong, contrastText: t.onAccent },
    background: { default: t.bg, paper: t.surface },
    text: { primary: t.text, secondary: t.muted },
    divider: t.border,
  },
})

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: { light: scheme(tokens.light), dark: scheme(tokens.dark) },
  shape: { borderRadius: tokens.radius },
  typography: {
    fontFamily: tokens.font,
    h1: { fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' },
    h2: { fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 750, lineHeight: 1.15, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3 },
    body1: { lineHeight: 1.65 },
    button: { textTransform: 'none', fontWeight: 650 },
  },
  components: {
    // Plan requirement: all motion off for users who ask for reduced motion (ripples, skeletons, board).
    MuiCssBaseline: {
      styleOverrides: {
        // Site search: native highlight (CSS Custom Highlight API); keep in sync with HIGHLIGHT_COLOR.
        '::highlight(site-search)': { backgroundColor: 'rgba(250, 204, 21, 0.45)', color: 'inherit' },
        // CV timeline: the job a bar jumps to flashes briefly (motion is off with reduced motion, below).
        '.cv-flash': { animation: 'cv-flash 1.4s ease-out' },
        '@keyframes cv-flash': { from: { backgroundColor: 'color-mix(in srgb, var(--mui-palette-primary-main) 18%, transparent)' }, to: { backgroundColor: 'transparent' } },
        // Printed / PDF CV (/cv only: scoped with body:has(.cv-page), so printing other pages is unchanged). A compact A4
        // record: site chrome, buttons and long details are left out; job and highlight titles stay.
        '@media print': {
          '@page': { size: 'A4', margin: '12mm 13mm 14mm' },
          ':root:has(.cv-page)': { colorScheme: 'light' },
          'body:has(.cv-page)': { fontSize: '9.5pt', lineHeight: 1.35, background: '#fff !important', color: '#111 !important' },
          'body:has(.cv-page) .MuiAppBar-root, body:has(.cv-page) footer, body:has(.cv-page) .cv-noprint, body:has(.cv-page) .cv-detail, body:has(.cv-page) #chat-panel, body:has(.cv-page) [aria-expanded][class*="MuiButton"], body:has(.cv-page) #skip-link, body:has(.cv-page) a[href="#main"]': { display: 'none !important' },
          'body:has(.cv-page) section, body:has(.cv-page) main section': { paddingTop: '6pt !important', paddingBottom: '6pt !important', borderTop: '0 !important', breakInside: 'auto' },
          'body:has(.cv-page) h1': { fontSize: '20pt !important', marginBottom: '2pt !important' },
          'body:has(.cv-page) h2': { fontSize: '12pt !important', margin: '8pt 0 4pt !important', breakAfter: 'avoid' },
          'body:has(.cv-page) h3': { fontSize: '10.5pt !important', margin: '0 !important' },
          'body:has(.cv-page) h4': { fontSize: '9.5pt !important', fontWeight: '600 !important' },
          'body:has(.cv-page) p, body:has(.cv-page) li, body:has(.cv-page) dd, body:has(.cv-page) dt': { fontSize: '9.5pt !important' },
          'body:has(.cv-page) .section-title': { display: 'none !important' },
          // Each job: "Company · role · period" on one line, then its highlight titles as bullets.
          'body:has(.cv-page) .cv-job': { display: 'block !important', paddingTop: '3pt !important', paddingBottom: '3pt !important', breakInside: 'avoid' },
          'body:has(.cv-page) .cv-job > :first-child > :not(.cv-detail)': { display: 'inline !important', margin: '0 !important', fontSize: '10pt !important' },
          'body:has(.cv-page) .cv-job > :first-child > :not(.cv-detail):not(:last-child)::after': { content: '" · "', fontWeight: 400 },
          'body:has(.cv-page) .cv-job > :first-child > * > span': { display: 'inline !important', margin: '0 !important' },
          'body:has(.cv-page) .cv-job > :first-child > * > span::before': { content: '" · "' },
          'body:has(.cv-page) .cv-job > p:first-child > span:first-of-type::before': { content: '" · "' },
          'body:has(.cv-page) .cv-job ul': { display: 'block !important', listStyle: 'disc !important', paddingLeft: '14pt !important', margin: '1pt 0 0 !important' },
          'body:has(.cv-page) .cv-job ul > li': { display: 'list-item !important' },
          'body:has(.cv-page) .cv-job ul > li > div:not(.cv-detail)': { display: 'inline !important', margin: '0 !important' },
          'body:has(.cv-page) .cv-job ul > li h4': { display: 'inline !important' },
          'body:has(.cv-page) .cv-group': { marginTop: '6pt !important', paddingTop: '0 !important', borderTop: '0 !important' },
          'body:has(.cv-page) #awards ol, body:has(.cv-page) #experience ol': { gap: '2pt !important' },
          'body:has(.cv-page) li[id^="award-"], body:has(.cv-page) li[id^="paper-"], body:has(.cv-page) li[id^="edu-"]': { gridTemplateColumns: '38mm 1fr !important', gap: '0 10mm !important', breakInside: 'avoid' },
          'body:has(.cv-page) a': { color: 'inherit !important', textDecoration: 'none !important' },
          'body:has(.cv-page) *': { boxShadow: 'none !important' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': { animationDuration: '0.01ms !important', animationIterationCount: '1 !important', transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important' },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, minHeight: 44, paddingInline: 20 } },
    },
    MuiLink: { defaultProps: { underline: 'hover' } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: tokens.radius } },
    },
    MuiChip: { styleOverrides: { root: { fontFamily: tokens.mono } } },
  },
})
