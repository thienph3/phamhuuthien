import Button, { type ButtonProps } from '@mui/material/Button'
import { Link as RouterLink } from 'react-router-dom'

export type LinkButtonProps = Omit<ButtonProps<'a'>, 'variant' | 'href' | 'component'> & {
  href: string
  /** 'primary' is filled green; 'ghost' is outlined. */
  tone?: 'primary' | 'ghost'
}

/**
 * Link styled as a button. In-app paths ("/books/x") use the router (no page reload);
 * anchors and mailto stay plain; external http(s) links open safely in a new tab.
 */
export function LinkButton({ tone = 'primary', href, ...rest }: LinkButtonProps) {
  const variant = tone === 'primary' ? 'contained' : 'outlined'
  // In-app pages use the router; anchors and files (e.g. "/cv.pdf") are plain links.
  if (href.startsWith('/') && !href.startsWith('/#') && !/\.[a-z0-9]+$/i.test(href)) {
    return <Button variant={variant} component={RouterLink} to={href} {...(rest as ButtonProps)} />
  }
  const external = /^https?:\/\//.test(href)
  return <Button variant={variant} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest} />
}
