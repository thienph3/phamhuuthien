import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import IconButton from '@mui/material/IconButton'
import { useColorScheme } from '@mui/material/styles'

/** Switches between light and dark. Needs a ThemeProvider created with colorSchemes. */
export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme()
  if (!mode) return null
  const dark = (mode === 'system' ? systemMode : mode) === 'dark'
  return (
    <IconButton
      onClick={() => setMode(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      sx={{ border: 1, borderColor: 'divider', width: 44, height: 44, flex: 'none' }}
    >
      {dark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
    </IconButton>
  )
}
