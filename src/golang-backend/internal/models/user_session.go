package models

import (
	"time"
)

type UserSession struct {
	ID             string     `json:"_id" db:"_id"`
	UserID         string     `json:"user_id" db:"user_id"`
	SessionToken   string     `json:"session_token" db:"session_token"`
	DeviceName     *string    `json:"device_name,omitempty" db:"device_name"`
	DeviceType     *string    `json:"device_type,omitempty" db:"device_type"`
	Browser        *string    `json:"browser,omitempty" db:"browser"`
	OS             *string    `json:"os,omitempty" db:"os"`
	IPAddress      *string    `json:"ip_address,omitempty" db:"ip_address"`
	Location       *string    `json:"location,omitempty" db:"location"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	LastActivityAt time.Time  `json:"last_activity_at" db:"last_activity_at"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateUserSessionRequest struct {
	UserID       string     `json:"user_id" validate:"required,uuid"`
	SessionToken string     `json:"session_token" validate:"required"`
	DeviceName   *string    `json:"device_name,omitempty"`
	DeviceType   *string    `json:"device_type,omitempty"`
	Browser      *string    `json:"browser,omitempty"`
	OS           *string    `json:"os,omitempty"`
	IPAddress    *string    `json:"ip_address,omitempty"`
	Location     *string    `json:"location,omitempty"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
}

type UpdateUserSessionRequest struct {
	IsActive       *bool      `json:"is_active,omitempty"`
	LastActivityAt *time.Time `json:"last_activity_at,omitempty"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
}
