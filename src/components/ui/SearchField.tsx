import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'

export type SearchFieldProps = { value: string; onChange: (value: string) => void; label: string; placeholder?: string }

/** Rounded search box with a visible-to-screen-readers label. */
export function SearchField({ value, onChange, label, placeholder }: SearchFieldProps) {
  return (
    <TextField
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="small"
      slotProps={{
        htmlInput: { 'aria-label': label },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          sx: { borderRadius: 999, minHeight: 44 },
        },
      }}
      sx={{ flex: 1, minWidth: 200 }}
    />
  )
}
