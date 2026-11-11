// @vitest-environment node
import { COUNTRY_KEYS, countryKey, PAGE_KEYS, pageKey, REF_KEYS, refKey } from './allowlist.ts'

const OWN = 'phamhuuthien.thienph3.workers.dev'

describe('pageKey', () => {
  it.each([
    ['/', 'home'],
    ['/report', 'report'],
    ['/books/colle-system', 'book:colle-system'],
    ['/books/unknown-book', 'other'],
    ['/books/../x', 'other'],
    ['/books/<script>', 'other'],
    ['/books/colle-system/read', 'other'],
    ['/anything', 'other'],
    ['/' + 'a'.repeat(300), undefined],
    [{}, undefined],
    [['/'], undefined],
  ])('%s → %s', (path, key) => expect(pageKey(path)).toBe(key))
})

describe('refKey', () => {
  it.each([
    ['', 'direct'],
    [OWN, undefined],
    [OWN.toUpperCase(), undefined],
    ['www.linkedin.com', 'linkedin'],
    ['lnkd.in', 'linkedin'],
    ['www.google.com', 'google'],
    ['google.com.vn', 'google'],
    ['Google.COM.', 'google'],
    ['google.com:443', 'google'],
    ['google.com.evil.com', 'other'],
    ['evil-google.com', 'other'],
    ['evilgithub.com', 'other'],
    ['github.com.evil.com', 'other'],
    ['gist.github.com', 'github'],
    ['t.co', 'x'],
    ['user@google.com', undefined],
    ['visit evil.com now', 'other'],
    ['x'.repeat(300), undefined],
    [{}, undefined],
    [['google.com'], undefined],
  ])('%s → %s', (host, key) => expect(refKey(host, OWN)).toBe(key))
})

describe('countryKey', () => {
  it.each([['VN', 'VN'], ['US', 'US'], ['XX', 'other'], ['T1', 'other'], ['vn', 'other'], ['ZZ', 'other'], [undefined, 'other'], [5, 'other']])(
    '%s → %s',
    (c, key) => expect(countryKey(c)).toBe(key),
  )
})

it('every possible key is in a small fixed set', () => {
  expect(PAGE_KEYS.size).toBeLessThan(10)
  expect(REF_KEYS.size).toBe(9)
  expect(COUNTRY_KEYS.size).toBe(31)
})
