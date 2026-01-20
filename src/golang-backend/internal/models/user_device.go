package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// UserDevice represents a user's device
type UserDevice struct {
	ID              uuid.UUID      `json:"_id" db:"_id"`
	UserID          uuid.UUID      `json:"user_id" db:"user_id"`
	DeviceType      string         `json:"device_type" db:"device_type"` // desktop, mobile, tablet, watch, tv, other
	DeviceName      sql.NullString `json:"device_name,omitempty" db:"device_name"`
	DeviceModel     sql.NullString `json:"device_model,omitempty" db:"device_model"`
	Manufacturer    sql.NullString `json:"manufacturer,omitempty" db:"manufacturer"`
	OS              sql.NullString `json:"os,omitempty" db:"os"` // windows, macos, linux, ios, android, chromeos, other
	OSVersion       sql.NullString `json:"os_version,omitempty" db:"os_version"`
	Browser         sql.NullString `json:"browser,omitempty" db:"browser"` // chrome, firefox, safari, edge, opera, brave, samsung, other
	BrowserVersion  sql.NullString `json:"browser_version,omitempty" db:"browser_version"`
	AppName         sql.NullString `json:"app_name,omitempty" db:"app_name"`
	AppVersion      sql.NullString `json:"app_version,omitempty" db:"app_version"`
	IPAddress       sql.NullString `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent       sql.NullString `json:"user_agent,omitempty" db:"user_agent"`
	Location        JSONB          `json:"location,omitempty" db:"location"`
	IsTrusted       bool           `json:"is_trusted" db:"is_trusted"`
	Fingerprint     sql.NullString `json:"fingerprint,omitempty" db:"fingerprint"`
	PushToken       sql.NullString `json:"push_token,omitempty" db:"push_token"`
	FirstSeenAt     time.Time      `json:"first_seen_at" db:"first_seen_at"`
	LastUsedAt      time.Time      `json:"last_used_at" db:"last_used_at"`
	LoginCount      int            `json:"login_count" db:"login_count"`
	Status          string         `json:"status" db:"status"` // active, inactive, blocked, revoked
	RevokedAt       sql.NullTime   `json:"revoked_at,omitempty" db:"revoked_at"`
	RevokedReason   sql.NullString `json:"revoked_reason,omitempty" db:"revoked_reason"`
	Metadata        JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at" db:"updated_at"`
}

// CreateUserDeviceRequest represents the request to register a device
type CreateUserDeviceRequest struct {
	UserID         uuid.UUID              `json:"user_id" validate:"required,uuid"`
	DeviceType     string                 `json:"device_type" validate:"required,oneof=desktop mobile tablet watch tv other"`
	DeviceName     string                 `json:"device_name,omitempty"`
	DeviceModel    string                 `json:"device_model,omitempty"`
	Manufacturer   string                 `json:"manufacturer,omitempty"`
	OS             string                 `json:"os,omitempty" validate:"omitempty,oneof=windows macos linux ios android chromeos other"`
	OSVersion      string                 `json:"os_version,omitempty"`
	Browser        string                 `json:"browser,omitempty" validate:"omitempty,oneof=chrome firefox safari edge opera brave samsung other"`
	BrowserVersion string                 `json:"browser_version,omitempty"`
	AppName        string                 `json:"app_name,omitempty"`
	AppVersion     string                 `json:"app_version,omitempty"`
	IPAddress      string                 `json:"ip_address,omitempty"`
	UserAgent      string                 `json:"user_agent,omitempty"`
	Location       map[string]interface{} `json:"location,omitempty"`
	Fingerprint    string                 `json:"fingerprint,omitempty"`
	PushToken      string                 `json:"push_token,omitempty"`
}

// UpdateUserDeviceRequest represents the request to update a device
type UpdateUserDeviceRequest struct {
	DeviceName   *string `json:"device_name,omitempty"`
	IsTrusted    *bool   `json:"is_trusted,omitempty"`
	PushToken    *string `json:"push_token,omitempty"`
	Status       *string `json:"status,omitempty" validate:"omitempty,oneof=active inactive blocked revoked"`
	RevokedAt    *string `json:"revoked_at,omitempty"`
	RevokedReason *string `json:"revoked_reason,omitempty"`
}

// UpdateDeviceActivityRequest represents updating device activity
type UpdateDeviceActivityRequest struct {
	IPAddress  string                 `json:"ip_address,omitempty"`
	Location   map[string]interface{} `json:"location,omitempty"`
}

// TableName returns the table name for UserDevice
func (UserDevice) TableName() string {
	return "user_devices"
}
