import { APIError } from 'payload'

/**
 * Validates API key from Authorization header
 * Returns true if valid, throws APIError if invalid
 */
export function validateApiKey(req: Request): void {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    throw new APIError('Missing Authorization header', 401)
  }

  // Support both "Bearer <token>" and direct token
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  const expectedApiKey = process.env.PAYLOAD_KEY

  if (!expectedApiKey) {
    throw new APIError('API key authentication not configured', 500)
  }

  if (token !== expectedApiKey) {
    throw new APIError('Invalid API key', 401)
  }
}

