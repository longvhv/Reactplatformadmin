/**
 * User Authentication Methods Type Definitions
 * For Linked Identities and MFA Methods
 */

export type IdentityProvider = 
  | 'GOOGLE' | 'FACEBOOK' | 'GITHUB' | 'GITLAB' | 'BITBUCKET'
  | 'LINKEDIN' | 'TWITTER' | 'MICROSOFT' | 'APPLE' | 'SLACK'
  | 'DISCORD' | 'OKTA' | 'AUTH0' | 'SAML' | 'LDAP' | 'OTHER';

export type IdentityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED';

export type MFAMethodType = 
  | 'TOTP' | 'SMS' | 'EMAIL' | 'WEBAUTHN' | 'BACKUP_CODES'
  | 'PUSH_NOTIFICATION' | 'BIOMETRIC' | 'HARDWARE_TOKEN' | 'OTHER';

export type MFAStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED' | 'PENDING';

export interface LinkedIdentity {
  _id: string;
  user_id: string;
  provider: IdentityProvider;
  provider_user_id: string;
  provider_username?: string;
  provider_email?: string;
  provider_profile?: Record<string, any>;
  avatar_url?: string;
  display_name?: string;
  status: IdentityStatus;
  is_verified: boolean;
  is_primary: boolean;
  last_used_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface MFAMethod {
  _id: string;
  user_id: string;
  method_type: MFAMethodType;
  method_name?: string;
  sms_phone_number?: string;
  sms_phone_verified?: boolean;
  email_address?: string;
  email_verified?: boolean;
  status: MFAStatus;
  is_verified: boolean;
  is_primary: boolean;
  is_enforced: boolean;
  last_used_at?: string;
  last_verified_at?: string;
  success_count: number;
  failure_count: number;
  device_name?: string;
  device_type?: string;
  backup_codes_used?: number;
  backup_codes_total?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export const IDENTITY_PROVIDERS: { value: IdentityProvider; label: string; color: string }[] = [
  { value: 'GOOGLE', label: 'Google', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'FACEBOOK', label: 'Facebook', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'GITHUB', label: 'GitHub', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'GITLAB', label: 'GitLab', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'MICROSOFT', label: 'Microsoft', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'APPLE', label: 'Apple', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'LINKEDIN', label: 'LinkedIn', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'TWITTER', label: 'Twitter', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'SLACK', label: 'Slack', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'DISCORD', label: 'Discord', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'BITBUCKET', label: 'Bitbucket', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'OKTA', label: 'Okta', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'AUTH0', label: 'Auth0', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'SAML', label: 'SAML', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'LDAP', label: 'LDAP', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-50 text-gray-700 border-gray-200' },
];

export const IDENTITY_STATUSES: { value: IdentityStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'REVOKED', label: 'Revoked', color: 'bg-red-50 text-red-700 border-red-200' },
];

export const MFA_METHOD_TYPES: { value: MFAMethodType; label: string; description: string }[] = [
  { value: 'TOTP', label: 'Authenticator App', description: 'Google Authenticator, Authy, 1Password' },
  { value: 'SMS', label: 'SMS Text Message', description: 'Receive codes via text message' },
  { value: 'EMAIL', label: 'Email', description: 'Receive codes via email' },
  { value: 'WEBAUTHN', label: 'Security Key', description: 'YubiKey, USB security keys' },
  { value: 'BACKUP_CODES', label: 'Backup Codes', description: 'One-time recovery codes' },
  { value: 'PUSH_NOTIFICATION', label: 'Push Notification', description: 'Mobile app push notifications' },
  { value: 'BIOMETRIC', label: 'Biometric', description: 'Fingerprint, Face ID' },
  { value: 'HARDWARE_TOKEN', label: 'Hardware Token', description: 'Physical token devices' },
  { value: 'OTHER', label: 'Other', description: 'Custom MFA method' },
];

export const MFA_STATUSES: { value: MFAStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'PENDING', label: 'Pending', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'REVOKED', label: 'Revoked', color: 'bg-red-50 text-red-700 border-red-200' },
];
