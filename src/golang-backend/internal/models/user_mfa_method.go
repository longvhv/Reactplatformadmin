package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// UserMFAMethod represents a user's MFA method
type UserMFAMethod struct {
	ID                        uuid.UUID      `json:"_id" db:"_id"`
	UserID                    uuid.UUID      `json:"user_id" db:"user_id"`
	MethodType                string         `json:"method_type" db:"method_type"` // TOTP, SMS, EMAIL, WEBAUTHN, BACKUP_CODES, PUSH_NOTIFICATION, BIOMETRIC, HARDWARE_TOKEN, OTHER
	MethodName                sql.NullString `json:"method_name,omitempty" db:"method_name"`
	SMSPhoneNumber            sql.NullString `json:"sms_phone_number,omitempty" db:"sms_phone_number"`
	SMSPhoneVerified          bool           `json:"sms_phone_verified" db:"sms_phone_verified"`
	EmailAddress              sql.NullString `json:"email_address,omitempty" db:"email_address"`
	EmailVerified             bool           `json:"email_verified" db:"email_verified"`
	Status                    string         `json:"status" db:"status"` // ACTIVE, INACTIVE, SUSPENDED, REVOKED, PENDING
	IsVerified                bool           `json:"is_verified" db:"is_verified"`
	IsPrimary                 bool           `json:"is_primary" db:"is_primary"`
	IsEnforced                bool           `json:"is_enforced" db:"is_enforced"`
	LastUsedAt                sql.NullTime   `json:"last_used_at,omitempty" db:"last_used_at"`
	LastVerifiedAt            sql.NullTime   `json:"last_verified_at,omitempty" db:"last_verified_at"`
	SuccessCount              int            `json:"success_count" db:"success_count"`
	FailureCount              int            `json:"failure_count" db:"failure_count"`
	DeviceName                sql.NullString `json:"device_name,omitempty" db:"device_name"`
	DeviceType                sql.NullString `json:"device_type,omitempty" db:"device_type"`
	BackupCodesUsed           int            `json:"backup_codes_used" db:"backup_codes_used"`
	BackupCodesTotal          int            `json:"backup_codes_total" db:"backup_codes_total"`
	TOTPSecretEncrypted       sql.NullString `json:"-" db:"totp_secret_encrypted"` // Never expose
	TOTPBackupCodesEncrypted  sql.NullString `json:"-" db:"totp_backup_codes_encrypted"`
	BackupCodesEncrypted      sql.NullString `json:"-" db:"backup_codes_encrypted"`
	Metadata                  JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt                 time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt                 time.Time      `json:"updated_at" db:"updated_at"`
	CreatedBy                 sql.NullString `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy                 sql.NullString `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt                 sql.NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy                 sql.NullString `json:"deleted_by,omitempty" db:"deleted_by"`
	Version                   int64          `json:"version" db:"version"`
}

// CreateUserMFAMethodRequest represents the request to create an MFA method
type CreateUserMFAMethodRequest struct {
	UserID           uuid.UUID `json:"user_id" validate:"required,uuid"`
	MethodType       string    `json:"method_type" validate:"required,oneof=TOTP SMS EMAIL WEBAUTHN BACKUP_CODES PUSH_NOTIFICATION BIOMETRIC HARDWARE_TOKEN OTHER"`
	MethodName       string    `json:"method_name,omitempty"`
	SMSPhoneNumber   string    `json:"sms_phone_number,omitempty"`
	EmailAddress     string    `json:"email_address,omitempty"`
	IsPrimary        bool      `json:"is_primary,omitempty"`
	IsEnforced       bool      `json:"is_enforced,omitempty"`
	DeviceName       string    `json:"device_name,omitempty"`
	DeviceType       string    `json:"device_type,omitempty"`
	BackupCodesTotal int       `json:"backup_codes_total,omitempty"`
}

// UpdateUserMFAMethodRequest represents the request to update an MFA method
type UpdateUserMFAMethodRequest struct {
	MethodName       *string `json:"method_name,omitempty"`
	Status           *string `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE INACTIVE SUSPENDED REVOKED PENDING"`
	IsPrimary        *bool   `json:"is_primary,omitempty"`
	IsEnforced       *bool   `json:"is_enforced,omitempty"`
	SMSPhoneNumber   *string `json:"sms_phone_number,omitempty"`
	SMSPhoneVerified *bool   `json:"sms_phone_verified,omitempty"`
	EmailAddress     *string `json:"email_address,omitempty"`
	EmailVerified    *bool   `json:"email_verified,omitempty"`
}

// VerifyMFAMethodRequest represents verification request
type VerifyMFAMethodRequest struct {
	Code string `json:"code" validate:"required"`
}

// TableName returns the table name for UserMFAMethod
func (UserMFAMethod) TableName() string {
	return "user_mfa_methods"
}
