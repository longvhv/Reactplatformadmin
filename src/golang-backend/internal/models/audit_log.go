package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// AuditLog represents an audit log entry
type AuditLog struct {
	ID              uuid.UUID      `json:"_id" db:"_id"`
	TenantID        sql.NullString `json:"tenant_id,omitempty" db:"tenant_id"`
	UserID          sql.NullString `json:"user_id,omitempty" db:"user_id"`
	ImpersonatorID  sql.NullString `json:"impersonator_id,omitempty" db:"impersonator_id"`
	EventTime       time.Time      `json:"event_time" db:"event_time"`
	Action          sql.NullString `json:"action,omitempty" db:"action"`
	Resource        sql.NullString `json:"resource,omitempty" db:"resource"`
	ResourceID      sql.NullString `json:"resource_id,omitempty" db:"resource_id"`
	Details         JSONB          `json:"details,omitempty" db:"details"`
	IPAddress       sql.NullString `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent       sql.NullString `json:"user_agent,omitempty" db:"user_agent"`
	Status          sql.NullString `json:"status,omitempty" db:"status"` // success, failure, partial
}

// CreateAuditLogRequest represents the request to create an audit log
type CreateAuditLogRequest struct {
	TenantID       *uuid.UUID             `json:"tenant_id,omitempty"`
	UserID         *uuid.UUID             `json:"user_id,omitempty"`
	ImpersonatorID *uuid.UUID             `json:"impersonator_id,omitempty"`
	Action         string                 `json:"action" validate:"required"`
	Resource       string                 `json:"resource,omitempty"`
	ResourceID     string                 `json:"resource_id,omitempty"`
	Details        map[string]interface{} `json:"details,omitempty"`
	IPAddress      string                 `json:"ip_address,omitempty"`
	UserAgent      string                 `json:"user_agent,omitempty"`
	Status         string                 `json:"status,omitempty"`
}

// TableName returns the table name for AuditLog
func (AuditLog) TableName() string {
	return "telemetry.audit_logs"
}
