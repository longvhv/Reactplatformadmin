package models

import (
	"time"

	"github.com/google/uuid"
)

type TrafficLog struct {
	ID           uuid.UUID  `json:"id" db:"_id"`
	TenantID     *uuid.UUID `json:"tenant_id,omitempty" db:"tenant_id"`
	UserID       *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	AppCode      *string    `json:"app_code,omitempty" db:"app_code"`
	Method       *string    `json:"method,omitempty" db:"method"`
	Domain       *string    `json:"domain,omitempty" db:"domain"`
	Path         *string    `json:"path,omitempty" db:"path"`
	StatusCode   *int16     `json:"status_code,omitempty" db:"status_code"`
	LatencyMs    *int       `json:"latency_ms,omitempty" db:"latency_ms"`
	RequestSize  int64      `json:"request_size" db:"request_size"`
	ResponseSize int64      `json:"response_size" db:"response_size"`
	IPAddress    *string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent    *string    `json:"user_agent,omitempty" db:"user_agent"`
	DataRegion   string     `json:"data_region" db:"data_region"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

type CreateTrafficLogRequest struct {
	TenantID     *uuid.UUID `json:"tenant_id"`
	UserID       *uuid.UUID `json:"user_id"`
	AppCode      *string    `json:"app_code"`
	Method       *string    `json:"method"`
	Domain       *string    `json:"domain"`
	Path         *string    `json:"path"`
	StatusCode   *int16     `json:"status_code"`
	LatencyMs    *int       `json:"latency_ms"`
	RequestSize  *int64     `json:"request_size"`
	ResponseSize *int64     `json:"response_size"`
	IPAddress    *string    `json:"ip_address"`
	UserAgent    *string    `json:"user_agent"`
	DataRegion   *string    `json:"data_region"`
}
