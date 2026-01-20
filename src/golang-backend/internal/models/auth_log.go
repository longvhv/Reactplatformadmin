package models

import (
	"time"

	"github.com/google/uuid"
)

type AuthLog struct {
	ID           uuid.UUID  `json:"id" db:"_id"`
	UserID       *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	TenantID     *uuid.UUID `json:"tenant_id,omitempty" db:"tenant_id"`
	Action       string     `json:"action" db:"action"`
	Status       string     `json:"status" db:"status"`
	IPAddress    *string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent    *string    `json:"user_agent,omitempty" db:"user_agent"`
	Browser      *string    `json:"browser,omitempty" db:"browser"`
	OS           *string    `json:"os,omitempty" db:"os"`
	DeviceType   *string    `json:"device_type,omitempty" db:"device_type"`
	Location     *string    `json:"location,omitempty" db:"location"`
	CountryCode  *string    `json:"country_code,omitempty" db:"country_code"`
	ErrorMessage *string    `json:"error_message,omitempty" db:"error_message"`
	Metadata     []byte     `json:"metadata,omitempty" db:"metadata"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

type CreateAuthLogRequest struct {
	UserID       *uuid.UUID `json:"user_id"`
	TenantID     *uuid.UUID `json:"tenant_id"`
	Action       string     `json:"action" binding:"required"`
	Status       string     `json:"status" binding:"required"`
	IPAddress    *string    `json:"ip_address"`
	UserAgent    *string    `json:"user_agent"`
	Browser      *string    `json:"browser"`
	OS           *string    `json:"os"`
	DeviceType   *string    `json:"device_type"`
	Location     *string    `json:"location"`
	CountryCode  *string    `json:"country_code"`
	ErrorMessage *string    `json:"error_message"`
	Metadata     []byte     `json:"metadata"`
}
