package models

import (
	"time"
)

type TenantRateLimit struct {
	ID                  string      `json:"_id" db:"_id"`
	TenantID            string      `json:"tenant_id" db:"tenant_id"`
	ServicePackageID    *string     `json:"service_package_id,omitempty" db:"service_package_id"`
	LimitName           string      `json:"limit_name" db:"limit_name"`
	LimitKey            string      `json:"limit_key" db:"limit_key"`
	ResourceType        *string     `json:"resource_type,omitempty" db:"resource_type"`
	EndpointPattern     *string     `json:"endpoint_pattern,omitempty" db:"endpoint_pattern"`
	MaxRequests         int         `json:"max_requests" db:"max_requests"`
	TimeWindow          int         `json:"time_window" db:"time_window"`
	WindowUnit          string      `json:"window_unit" db:"window_unit"`
	BurstLimit          *int        `json:"burst_limit,omitempty" db:"burst_limit"`
	ConcurrentLimit     *int        `json:"concurrent_limit,omitempty" db:"concurrent_limit"`
	LimitType           string      `json:"limit_type" db:"limit_type"`
	LimitScope          string      `json:"limit_scope" db:"limit_scope"`
	IsEnabled           bool        `json:"is_enabled" db:"is_enabled"`
	IsStrict            bool        `json:"is_strict" db:"is_strict"`
	BlockDuration       *int        `json:"block_duration,omitempty" db:"block_duration"`
	RetryAfter          *int        `json:"retry_after,omitempty" db:"retry_after"`
	CustomErrorMessage  *string     `json:"custom_error_message,omitempty" db:"custom_error_message"`
	CustomErrorCode     *string     `json:"custom_error_code,omitempty" db:"custom_error_code"`
	CurrentUsage        int         `json:"current_usage" db:"current_usage"`
	PeakUsage           int         `json:"peak_usage" db:"peak_usage"`
	LastExceededAt      *time.Time  `json:"last_exceeded_at,omitempty" db:"last_exceeded_at"`
	ExceededCount       int         `json:"exceeded_count" db:"exceeded_count"`
	AlertThreshold      *int        `json:"alert_threshold,omitempty" db:"alert_threshold"`
	AlertEnabled        bool        `json:"alert_enabled" db:"alert_enabled"`
	Priority            int         `json:"priority" db:"priority"`
	CanOverride         bool        `json:"can_override" db:"can_override"`
	OverrideUntil       *time.Time  `json:"override_until,omitempty" db:"override_until"`
	Description         *string     `json:"description,omitempty" db:"description"`
	Tags                StringArray `json:"tags" db:"tags"`
	Metadata            JSONB       `json:"metadata" db:"metadata"`
	CreatedAt           time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time   `json:"updated_at" db:"updated_at"`
	CreatedBy           *string     `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy           *string     `json:"updated_by,omitempty" db:"updated_by"`
}

type CreateTenantRateLimitRequest struct {
	TenantID           string   `json:"tenant_id" validate:"required,uuid"`
	ServicePackageID   *string  `json:"service_package_id,omitempty" validate:"omitempty,uuid"`
	LimitName          string   `json:"limit_name" validate:"required"`
	LimitKey           string   `json:"limit_key" validate:"required"`
	ResourceType       *string  `json:"resource_type,omitempty"`
	EndpointPattern    *string  `json:"endpoint_pattern,omitempty"`
	MaxRequests        int      `json:"max_requests" validate:"required,gt=0"`
	TimeWindow         int      `json:"time_window" validate:"required,gt=0"`
	WindowUnit         string   `json:"window_unit" validate:"required,oneof=second minute hour day month"`
	BurstLimit         *int     `json:"burst_limit,omitempty"`
	ConcurrentLimit    *int     `json:"concurrent_limit,omitempty"`
	LimitType          string   `json:"limit_type" validate:"required,oneof=sliding_window fixed_window token_bucket leaky_bucket"`
	LimitScope         string   `json:"limit_scope" validate:"required,oneof=tenant user ip api_key global"`
	IsEnabled          bool     `json:"is_enabled"`
	IsStrict           bool     `json:"is_strict"`
	BlockDuration      *int     `json:"block_duration,omitempty"`
	RetryAfter         *int     `json:"retry_after,omitempty"`
	CustomErrorMessage *string  `json:"custom_error_message,omitempty"`
	CustomErrorCode    *string  `json:"custom_error_code,omitempty"`
	AlertThreshold     *int     `json:"alert_threshold,omitempty"`
	AlertEnabled       bool     `json:"alert_enabled"`
	Priority           int      `json:"priority"`
	CanOverride        bool     `json:"can_override"`
	Description        *string  `json:"description,omitempty"`
	Tags               []string `json:"tags,omitempty"`
	Metadata           JSONB    `json:"metadata,omitempty"`
	CreatedBy          *string  `json:"created_by,omitempty" validate:"omitempty,uuid"`
}

type UpdateTenantRateLimitRequest struct {
	LimitName          *string  `json:"limit_name,omitempty"`
	MaxRequests        *int     `json:"max_requests,omitempty" validate:"omitempty,gt=0"`
	TimeWindow         *int     `json:"time_window,omitempty" validate:"omitempty,gt=0"`
	WindowUnit         *string  `json:"window_unit,omitempty" validate:"omitempty,oneof=second minute hour day month"`
	BurstLimit         *int     `json:"burst_limit,omitempty"`
	ConcurrentLimit    *int     `json:"concurrent_limit,omitempty"`
	IsEnabled          *bool    `json:"is_enabled,omitempty"`
	IsStrict           *bool    `json:"is_strict,omitempty"`
	BlockDuration      *int     `json:"block_duration,omitempty"`
	RetryAfter         *int     `json:"retry_after,omitempty"`
	CustomErrorMessage *string  `json:"custom_error_message,omitempty"`
	CustomErrorCode    *string  `json:"custom_error_code,omitempty"`
	AlertThreshold     *int     `json:"alert_threshold,omitempty"`
	AlertEnabled       *bool    `json:"alert_enabled,omitempty"`
	Priority           *int     `json:"priority,omitempty"`
	CanOverride        *bool    `json:"can_override,omitempty"`
	Description        *string  `json:"description,omitempty"`
	Tags               []string `json:"tags,omitempty"`
	Metadata           JSONB    `json:"metadata,omitempty"`
	UpdatedBy          *string  `json:"updated_by,omitempty" validate:"omitempty,uuid"`
}
