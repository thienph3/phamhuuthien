import { render, screen } from '@testing-library/react'
import { ProfilePhoto } from './ProfilePhoto'

describe('ProfilePhoto', () => {
  it('reserves its size, offers two files and is lazy below the fold', () => {
    render(<ProfilePhoto alt="Thien Pham" width={240} />)
    const img = screen.getByRole('img', { name: 'Thien Pham' })
    expect(img).toHaveAttribute('width', '240')
    expect(img).toHaveAttribute('height', '300')
    expect(img.getAttribute('srcset')).toMatch(/240w, .*480w/)
    expect(img).toHaveAttribute('loading', 'lazy')
  })
  it('round is square; eager loads first', () => {
    render(<ProfilePhoto alt="Thien Pham" width={88} round eager />)
    const img = screen.getByRole('img', { name: 'Thien Pham' })
    expect(img).toHaveAttribute('height', '88')
    expect(img).toHaveAttribute('loading', 'eager')
  })
})
