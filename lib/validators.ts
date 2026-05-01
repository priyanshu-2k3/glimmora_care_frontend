/**
 * Shared frontend input validators. Each function returns:
 *   - `null` when the value is valid (or empty + optional)
 *   - a string with a human-readable error message when invalid
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** RFC-loose email check. Pass `optional: true` to allow empty strings. */
export function validateEmail(value: string, opts: { optional?: boolean } = {}): string | null {
  const v = value.trim()
  if (!v) return opts.optional ? null : 'Email is required'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address'
  return null
}

/**
 * Phone number — accepts international format with optional leading +,
 * digits, spaces, dashes, parentheses. Requires at least 7 actual digits.
 */
export function validatePhone(value: string, opts: { optional?: boolean } = {}): string | null {
  const v = value.trim()
  if (!v) return opts.optional ? null : 'Phone number is required'
  if (!/^[+0-9 ()\-]+$/.test(v)) return 'Phone may contain only digits, spaces, +, -, ()'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 7) return 'Phone number is too short'
  if (digits.length > 15) return 'Phone number is too long'
  return null
}

/**
 * Website URL — accepts http(s)://hostname[.tld][/path]. Auto-prepends
 * https:// if the user typed a bare domain.
 */
export function validateWebsite(value: string, opts: { optional?: boolean } = {}): string | null {
  const v = value.trim()
  if (!v) return opts.optional ? null : 'Website is required'
  // Allow values without protocol — the form should normalise on save.
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(candidate)
    if (!u.hostname.includes('.')) return 'Enter a valid website (e.g. clinic.example.com)'
    return null
  } catch {
    return 'Enter a valid website URL'
  }
}

/** Returns the URL with https:// prepended if no scheme present. */
export function normaliseWebsite(value: string): string {
  const v = value.trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}
