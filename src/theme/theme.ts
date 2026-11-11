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
