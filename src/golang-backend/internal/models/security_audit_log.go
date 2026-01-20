package models

import (
	"time"

	"github.com/google/uuid"
)

type SecurityAuditLog struct {
	ID              uuid.UUID  `json:"id" db:"_id"`
	TenantID        *uuid.UUID `json:"tenant_id,omitempty" db:"tenant_id"`
	ActorID         *uuid.UUID `json:"actor_id,omitempty" db:"actor_id"`
	ImpersonatorID  *uuid.UUID `json:"impersonator_id,omitempty" db:"impersonator_id"`
	EventCategory   *string    `json:"event_category,omitempty" db:"event_category"`
	EventAction     *string    `json:"event_action,omitempty" db:"event_action"`
	TargetID        *uuid.UUID `json:"target_id,omitempty" db:"target_id"`
	ResourceType    *string    `json:"resource_type,omitempty" db:"resource_type"`
	IPAddress       *string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent       *string    `json:"user_agent,omitempty" db:"user_agent"`
	Details         []byte     `json:"details,omitempty" db:"details"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
}

type CreateSecurityAuditLogRequest struct {
	TenantID       *uuid.UUID `json:"tenant_id"`
	ActorID        *uuid.UUID `json:"actor_id"`
	ImpersonatorID *uuid.UUID `json:"impersonator_id"`
	EventCategory  *string    `json:"event_category"`
	EventAction    *string    `json:"event_action"`
	TargetID       *uuid.UUID `json:"target_id"`
	ResourceType   *string    `json:"resource_type"`
	IPAddress      *string    `json:"ip_address"`
	UserAgent      *string    `json:"user_agent"`
	Details        []byte     `json:"details"`
}
