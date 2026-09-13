export type AuthErrorKind =
  | 'invalid_credentials'
  | 'email_unverified'
  | 'email_exists'
  | 'expired_link'
  | 'rate_limited'
  | 'network'
  | 'unknown'

export function classifyAuthError(message = '', code = ''): AuthErrorKind {
  const value = `${code} ${message}`.toLowerCase()
  if (value.includes('email not confirmed')) return 'email_unverified'
  if (value.includes('invalid login credentials')) return 'invalid_credentials'
  if (value.includes('already registered') || value.includes('user_already_exists')) return 'email_exists'
  if (value.includes('expired') || value.includes('otp_expired')) return 'expired_link'
  if (value.includes('rate limit') || value.includes('over_email_send_rate_limit')) return 'rate_limited'
  if (value.includes('fetch') || value.includes('network')) return 'network'
  return 'unknown'
}

export function authErrorMessage(kind: AuthErrorKind) {
  const messages: Record<AuthErrorKind, string> = {
    invalid_credentials: 'Email hoặc mật khẩu chưa đúng. Hãy kiểm tra và thử lại.',
    email_unverified: 'Email này chưa được xác minh.',
    email_exists: 'Không thể tạo tài khoản với thông tin này. Hãy thử đăng nhập hoặc đặt lại mật khẩu.',
    expired_link: 'Liên kết đã hết hạn hoặc không còn hợp lệ. Hãy yêu cầu một liên kết mới.',
    rate_limited: 'Bạn đã thử quá nhiều lần. Vui lòng đợi một chút rồi thử lại.',
    network: 'Không thể kết nối. Nội dung bạn nhập vẫn được giữ lại; hãy thử lại khi có mạng.',
    unknown: 'Đã có lỗi xảy ra. Hãy thử lại sau ít phút.',
  }
  return messages[kind]
}
