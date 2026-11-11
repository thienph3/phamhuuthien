import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

export type FilterOption = { value: string; label: string }
export type FilterChipsProps = { options: FilterOption[]; value: string; onChange: (value: string) => void; label: string }

/** Single-select chip group. Uses aria-pressed so the selected state is announced. */
export function FilterChips({ options, value, onChange, label }: FilterChipsProps) {
  return (
    <Stack direction="row" useFlexGap spacing={1} role="group" aria-label={label} sx={{ flexWrap: 'wrap' }}>
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          clickable
          aria-pressed={o.value === value}
          color={o.value === value ? 'primary' : 'default'}
          variant={o.value === value ? 'filled' : 'outlined'}
          onClick={() => onChange(o.value)}
          sx={{ minHeight: 44, px: 1, fontFamily: 'inherit' }}
        />
      ))}
    </Stack>
  )
}
