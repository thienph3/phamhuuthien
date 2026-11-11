/** Design tokens: the single source of truth for colour and layout. Mirrors the approved mockup. */
export const tokens = {
  light: {
    bg: '#fbfdfc',
    surface: '#ffffff',
    surface2: '#eef6f2',
    border: '#d7e5de',
    text: '#0f1f19',
    muted: '#4b5f57',
    accent: '#047857',
    accentStrong: '#065f46',
    onAccent: '#ffffff',
  },
  dark: {
    bg: '#0a100e',
    surface: '#111a16',
    surface2: '#16231d',
    border: '#22342b',
    text: '#e6f0eb',
    muted: '#9db3a9',
    accent: '#34d399',
    accentStrong: '#6ee7b7',
    onAccent: '#04130d',
  },
  radius: 14,
  contentWidth: 1088, // 68rem
  proseWidth: 672, // 42rem
  font: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const

/** Soft accent tint that works in both colour schemes (used by pills and tags). */
export const accentSoft = 'color-mix(in srgb, var(--mui-palette-primary-main) 14%, transparent)'
