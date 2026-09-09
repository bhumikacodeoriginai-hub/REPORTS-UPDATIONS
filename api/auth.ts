import crypto from 'node:crypto'

/**
 * Server-side HR authentication seam.
 * Configure HR_EMAIL and a scrypt password hash in the deployment environment.
 * No credentials are sent to or stored in the browser.
 */
const getHash = (password: string, salt: string) => crypto.scryptSync(password, salt, 64).toString('hex')

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
  const body = await request.json().catch(() => ({})) as { email?: string; password?: string }
  const expectedEmail = process.env.HR_EMAIL || 'gagana@codeoriginai.com'
  const expectedHash = process.env.HR_PASSWORD_HASH
  const salt = process.env.HR_PASSWORD_SALT
  if (!expectedHash || !salt || body.email?.toLowerCase() !== expectedEmail.toLowerCase() || !body.password) {
    return Response.json({ error: 'Invalid HR credentials' }, { status: 401 })
  }
  const suppliedHash = getHash(body.password, salt)
  const valid = suppliedHash.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(suppliedHash), Buffer.from(expectedHash))
  if (!valid) return Response.json({ error: 'Invalid HR credentials' }, { status: 401 })
  return Response.json({ role: 'hr', name: 'Gagana Priya N' })
}
