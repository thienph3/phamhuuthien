import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import photo240 from '@/assets/profile-240.webp'
import photo480 from '@/assets/profile-480.webp'

/**
 * My profile photo (the one on my FIDE profile), 4:5 portrait, as small WebP files with no metadata. Width and height
 * are fixed so nothing shifts while it loads. `round` crops it to a circle around the face.
 */
export function ProfilePhoto({ alt, width, round = false, eager = false, sizes, sx }: { alt: string; width: number; round?: boolean; eager?: boolean; sizes?: string; sx?: SxProps<Theme> }) {
  const height = round ? width : Math.round((width * 5) / 4)
  return (
    <Box
      component="img"
      src={photo480}
      srcSet={`${photo240} 240w, ${photo480} 480w`}
      sizes={sizes ?? `${width}px`}
      width={width}
      height={height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      {...(eager ? { fetchPriority: 'high' } : {})}
      sx={[
        { display: 'block', width, height, objectFit: 'cover', objectPosition: round ? 'center 28%' : 'center', borderRadius: round ? '50%' : '20px', border: 1, borderColor: 'divider', bgcolor: '#fff' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}
