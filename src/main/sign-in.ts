import {
  createDecipheriv,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  type KeyObject,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'

// Browser sign-in through the app's own address. The desktop makes a key pair and a state for each attempt, and the portal
// seals the session for that key. Only this process can open the box, and the state must match this attempt.
export const signInAddress = 'api-docs://auth/finish'
const signInTimeoutMs = 5 * 60_000
const version = 1
const spkiPrefix = Buffer.from('302a300506032b656e032100', 'hex')
const info = Buffer.from('api-docs desktop sign-in v1')

export type SignInAttempt = { state: string; publicKey: string; privateKey: KeyObject; startedAt: number }

export function startSignInAttempt(now = Date.now()): SignInAttempt {
  const pair = generateKeyPairSync('x25519')
  return {
    state: randomBytes(32).toString('base64url'),
    publicKey: pair.publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('base64url'),
    privateKey: pair.privateKey,
    startedAt: now,
  }
}

export function signInUrl(attempt: SignInAttempt, portal: URL): string {
  const url = new URL('/desktop-login', portal)
  url.searchParams.set('desktopLoginState', attempt.state)
  url.searchParams.set('redirect', signInAddress)
  url.searchParams.set('pk', attempt.publicKey)
  return url.toString()
}

// True only for the attempt in progress, with the same state, before it expires.
export function attemptMatches(attempt: SignInAttempt | undefined, state: string, now = Date.now()): boolean {
  if (!attempt || now - attempt.startedAt > signInTimeoutMs) return false
  const expected = Buffer.from(attempt.state)
  const given = Buffer.from(state)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

// Reads the state and the box from an api-docs://auth/finish link. Anything else is ignored.
export function parseSignInLink(link: string): { state: string; box: string } | undefined {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return undefined
  }
  if (url.protocol !== 'api-docs:' || url.host !== 'auth' || url.pathname !== '/finish') return undefined
  const state = url.searchParams.get('state')
  const box = url.searchParams.get('box')
  if (!state || !box) return undefined
  return { state, box }
}

// Opens a box with this attempt's private key. Layout, base64url: version (1) | server ephemeral public key (32) | iv (12) | tag (16) | ciphertext.
// Mirrors the server's sealForDesktop, and the test vector keeps the two in step.
export function openSignInBox(privateKey: KeyObject, box: string): string {
  const data = Buffer.from(box, 'base64url')
  if (data[0] !== version) throw new Error('Unknown box version.')
  const serverRaw = data.subarray(1, 33)
  const iv = data.subarray(33, 45)
  const tag = data.subarray(45, 61)
  const ciphertext = data.subarray(61)
  const serverKey = createPublicKey({ key: Buffer.concat([spkiPrefix, serverRaw]), format: 'der', type: 'spki' })
  const clientRaw = createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).subarray(12)
  const shared = diffieHellman({ privateKey, publicKey: serverKey })
  const key = Buffer.from(hkdfSync('sha256', shared, Buffer.concat([serverRaw, clientRaw]), info, 32))
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAAD(Buffer.concat([Buffer.from([version]), serverRaw]))
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
