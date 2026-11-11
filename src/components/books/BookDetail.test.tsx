import { keepMoves, splitLead } from './BookDetail'

describe('splitLead', () => {
  it('splits at the first full stop or colon', () => {
    expect(splitLead('Know what is coming. Black usually meets 1.d4 with 1…d5.')).toEqual(['Know what is coming.', ' Black usually meets 1.d4 with 1…d5.'])
    expect(splitLead('One break to aim for: e4. White prepares it.')).toEqual(['One break to aim for:', ' e4. White prepares it.'])
  })
  it('does not split inside move numbers', () => {
    expect(splitLead('Play 1.d4 and wait.')[0]).not.toBe('Play 1.')
  })
  it('leaves text without a short lead-in alone', () => {
    expect(splitLead('no stop here')).toEqual(['', 'no stop here'])
  })
})

describe('keepMoves', () => {
  it('joins the ellipsis to the move so 2…Nf6 never wraps', () => {
    expect(keepMoves('after 2…Nf6 and …c5')).toBe('after 2…\u2060Nf6 and …\u2060c5')
  })
})
