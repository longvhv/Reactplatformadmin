package models

import (
	"time"

	"github.com/google/uuid"
)

type APIUsageLog struct {
	ID           uuid.UUID  `json:"id" db:"_id"`
	TenantID     *uuid.UUID `json:"tenant_id,omitempty" db:"tenant_id"`
	AppCode      *string    `json:"app_code,omitempty" db:"app_code"`
	APIEndpoint  *string    `json:"api_endpoint,omitempty" db:"api_endpoint"`
	APIMethod    *string    `json:"api_method,omitempty" db:"api_method"`
	StatusCode   *int16     `json:"status_code,omitempty" db:"status_code"`
	RequestSize  int64      `json:"request_size" db:"request_size"`
	ResponseSize int64      `json:"response_size" db:"response_size"`
	LatencyMs    *int       `json:"latency_ms,omitempty" db:"latency_ms"`
	APIKeyID     *uuid.UUID `json:"api_key_id,omitempty" db:"api_key_id"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

type CreateAPIUsageLogRequest struct {
	TenantID     *uuid.UUID `json:"tenant_id"`
	AppCode      *string    `json:"app_code"`
	APIEndpoint  *string    `json:"api_endpoint"`
	APIMethod    *string    `json:"api_method"`
	StatusCode   *int16     `json:"status_code"`
	RequestSize  *int64     `json:"request_size"`
	ResponseSize *int64     `json:"response_size"`
	LatencyMs    *int       `json:"latency_ms"`
	APIKeyID     *uuid.UUID `json:"api_key_id"`
}
