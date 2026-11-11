import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import Link from '@mui/material/Link'
import { PageContainer, SiteLayout } from '@/components'

/** Shown for unknown addresses. */
export function NotFound() {
  return (
    <SiteLayout>
      <PageContainer prose sx={{ py: 10 }}>
        <Typography variant="h1" component="h1" sx={{ fontSize: '2.2rem', mb: 2 }}>Page not found</Typography>
        <Link component={RouterLink} to="/">Go to the home page</Link>
      </PageContainer>
    </SiteLayout>
  )
}
