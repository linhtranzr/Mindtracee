import { describe, expect, it } from 'vitest'
import { authErrorMessage, classifyAuthError } from './auth-errors'

describe('classifyAuthError', () => {
  it('recognizes unverified users', () => {
    expect(classifyAuthError('Email not confirmed')).toBe('email_unverified')
  })

  it('keeps unknown account existence messaging generic', () => {
    expect(authErrorMessage(classifyAuthError('User already registered'))).not.toContain('đã tồn tại')
  })

  it('recognizes expired recovery links', () => {
    expect(classifyAuthError('', 'otp_expired')).toBe('expired_link')
  })
})
