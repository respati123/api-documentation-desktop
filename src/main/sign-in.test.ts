import { createPrivateKey } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { attemptMatches, openSignInBox, parseSignInLink, signInUrl, startSignInAttempt } from './sign-in'

// A box made by the server's sealForDesktop for this fixed desktop key. The server tests produced it, so this checks the two sides agree.
const vector = {
  seedHex: '1111111111111111111111111111111111111111111111111111111111111111',
  box: 'Aasddsu2p7tDrhue3VkfffFA8hntuwHEDqSnc5hAOckVPg3Ti2wvgjJA6SSjsPHeCTp9ziZjVB-e-I3RmR0nDnrpIF6mlliMwbc99NU',
  token: 'vector-token-123',
}

function vectorKey() {
  return createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), Buffer.from(vector.seedHex, 'hex')]),
    format: 'der',
    type: 'pkcs8',
  })
}

describe('sign-in attempt', () => {
  it('starts with a fresh state and public key each time', () => {
    const first = startSignInAttempt()
    const second = startSignInAttempt()
    expect(first.state).not.toBe(second.state)
    expect(first.publicKey).not.toBe(second.publicKey)
  })

  it('points the browser at the portal with the state, the app address, and the public key', () => {
    const attempt = startSignInAttempt()
    const url = new URL(signInUrl(attempt, new URL('https://docs.respati.web.id')))
    expect(url.pathname).toBe('/desktop-login')
    expect(url.searchParams.get('desktopLoginState')).toBe(attempt.state)
    expect(url.searchParams.get('redirect')).toBe('api-docs://auth/finish')
    expect(url.searchParams.get('pk')).toBe(attempt.publicKey)
  })

  it('matches only the same state, and only before it expires', () => {
    const attempt = startSignInAttempt(1_000)
    expect(attemptMatches(attempt, attempt.state, 2_000)).toBe(true)
    expect(attemptMatches(attempt, 'another-state', 2_000)).toBe(false)
    expect(attemptMatches(attempt, attempt.state, 1_000 + 5 * 60_000 + 1)).toBe(false)
    expect(attemptMatches(undefined, attempt.state, 2_000)).toBe(false)
  })
})

describe('sign-in link', () => {
  it('reads the state and the box from the app address', () => {
    expect(parseSignInLink('api-docs://auth/finish?state=abc&box=xyz')).toEqual({ state: 'abc', box: 'xyz' })
  })

  it('ignores other addresses and links without a state or a box', () => {
    expect(parseSignInLink('api-docs://auth/other?state=abc&box=xyz')).toBeUndefined()
    expect(parseSignInLink('api-docs://invite?token=abc')).toBeUndefined()
    expect(parseSignInLink('api-docs://auth/finish?state=abc')).toBeUndefined()
    expect(parseSignInLink('api-docs://auth/finish?box=xyz')).toBeUndefined()
    expect(parseSignInLink('not a url')).toBeUndefined()
  })
})

describe('sign-in box', () => {
  it('opens a box that the server made for this desktop key', () => {
    expect(openSignInBox(vectorKey(), vector.box)).toBe(vector.token)
  })

  it('refuses a box that was changed', () => {
    const tampered = vector.box.slice(0, -2) + (vector.box.endsWith('AA') ? 'BB' : 'AA')
    expect(() => openSignInBox(vectorKey(), tampered)).toThrow()
  })

  it('refuses a box sealed for another desktop key', () => {
    const other = startSignInAttempt().privateKey
    expect(() => openSignInBox(other, vector.box)).toThrow()
  })
})
