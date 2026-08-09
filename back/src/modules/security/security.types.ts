export enum SecurityRateLimitScope {
  fileUpload = 'file-upload',
  loginAccount = 'login-account',
  loginIp = 'login-ip',
  publicEventRead = 'public-event-read',
  publicRegistrationEvent = 'public-registration-event',
  publicRegistrationIp = 'public-registration-ip',
  setup = 'setup',
}

export interface SecurityRateLimitPolicy {
  limit: number;
  windowMs: number;
}

export interface SecurityRateLimitEntry {
  count: number;
  expiresAt: number;
}

export enum SecurityAuditEvent {
  fileVisibilityChanged = 'file_visibility_changed',
  loginFailed = 'login_failed',
  loginSucceeded = 'login_succeeded',
  passwordChanged = 'password_changed',
  passwordReset = 'password_reset',
  publicEventStateChanged = 'public_event_state_changed',
  roleChanged = 'role_changed',
  sessionRevoked = 'session_revoked',
  setupCompleted = 'setup_completed',
  setupRejected = 'setup_rejected',
  userChanged = 'user_changed',
}

export type SecurityAuditValue = boolean | number | string | null;
export type SecurityAuditDetails = Record<string, SecurityAuditValue>;
