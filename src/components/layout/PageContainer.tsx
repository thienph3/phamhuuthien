import Container, { type ContainerProps } from '@mui/material/Container'
import { tokens } from '@/theme'

/** Centered content column. `prose` gives a narrow, readable text width. */
export function PageContainer({ prose = false, sx, ...rest }: ContainerProps & { prose?: boolean }) {
  return <Container disableGutters sx={[{ maxWidth: `${prose ? tokens.proseWidth : tokens.contentWidth}px !important`, px: 3 }, ...(Array.isArray(sx) ? sx : [sx])]} {...rest} />
}
