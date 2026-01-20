package models

import (
	"time"
)

type Webhook struct {
	ID                  string      `json:"_id" db:"_id"`
	TenantID            string      `json:"tenant_id" db:"tenant_id"`
	Name                string      `json:"name" db:"name"`
	Description         *string     `json:"description,omitempty" db:"description"`
	URL                 string      `json:"url" db:"url"`
	Method              string      `json:"method" db:"method"`
	EventTypes          StringArray `json:"event_types" db:"event_types"`
	EventFilter         JSONB       `json:"event_filter,omitempty" db:"event_filter"`
	SecretKey           *string     `json:"secret_key,omitempty" db:"secret_key"`
	AuthType            string      `json:"auth_type" db:"auth_type"`
	AuthConfig          JSONB       `json:"auth_config,omitempty" db:"auth_config"`
	Headers             JSONB       `json:"headers" db:"headers"`
	TimeoutMs           int         `json:"timeout_ms" db:"timeout_ms"`
	RetryConfig         JSONB       `json:"retry_config" db:"retry_config"`
	IsActive            bool        `json:"is_active" db:"is_active"`
	IsVerified          bool        `json:"is_verified" db:"is_verified"`
	VerificationToken   *string     `json:"verification_token,omitempty" db:"verification_token"`
	VerifiedAt          *time.Time  `json:"verified_at,omitempty" db:"verified_at"`
	LastTriggeredAt     *time.Time  `json:"last_triggered_at,omitempty" db:"last_triggered_at"`
	LastSuccessAt       *time.Time  `json:"last_success_at,omitempty" db:"last_success_at"`
	LastFailureAt       *time.Time  `json:"last_failure_at,omitempty" db:"last_failure_at"`
	SuccessCount        int         `json:"success_count" db:"success_count"`
	FailureCount        int         `json:"failure_count" db:"failure_count"`
	TotalCount          int         `json:"total_count" db:"total_count"`
	AvgResponseTimeMs   *int        `json:"avg_response_time_ms,omitempty" db:"avg_response_time_ms"`
	BatchSize           *int        `json:"batch_size,omitempty" db:"batch_size"`
	RateLimit           *int        `json:"rate_limit,omitempty" db:"rate_limit"`
	Priority            int         `json:"priority" db:"priority"`
	Tags                StringArray `json:"tags" db:"tags"`
	Metadata            JSONB       `json:"metadata" db:"metadata"`
	CreatedAt           time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time   `json:"updated_at" db:"updated_at"`
	CreatedBy           *string     `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy           *string     `json:"updated_by,omitempty" db:"updated_by"`
}

type CreateWebhookRequest struct {
	TenantID      string   `json:"tenant_id" validate:"required,uuid"`
	Name          string   `json:"name" validate:"required"`
	Description   *string  `json:"description,omitempty"`
	URL           string   `json:"url" validate:"required,url"`
	Method        string   `json:"method" validate:"required,oneof=POST GET PUT PATCH DELETE"`
	EventTypes    []string `json:"event_types" validate:"required,min=1"`
	EventFilter   JSONB    `json:"event_filter,omitempty"`
	AuthType      string   `json:"auth_type" validate:"required,oneof=none basic bearer api_key oauth2"`
	AuthConfig    JSONB    `json:"auth_config,omitempty"`
	Headers       JSONB    `json:"headers,omitempty"`
	TimeoutMs     int      `json:"timeout_ms" validate:"required,gt=0,lte=60000"`
	RetryConfig   JSONB    `json:"retry_config,omitempty"`
	IsActive      bool     `json:"is_active"`
	BatchSize     *int     `json:"batch_size,omitempty"`
	RateLimit     *int     `json:"rate_limit,omitempty"`
	Priority      int      `json:"priority"`
	Tags          []string `json:"tags,omitempty"`
	Metadata      JSONB    `json:"metadata,omitempty"`
	CreatedBy     *string  `json:"created_by,omitempty" validate:"omitempty,uuid"`
}

type UpdateWebhookRequest struct {
	Name          *string  `json:"name,omitempty"`
	Description   *string  `json:"description,omitempty"`
	URL           *string  `json:"url,omitempty" validate:"omitempty,url"`
	Method        *string  `json:"method,omitempty" validate:"omitempty,oneof=POST GET PUT PATCH DELETE"`
	EventTypes    []string `json:"event_types,omitempty"`
	EventFilter   JSONB    `json:"event_filter,omitempty"`
	AuthType      *string  `json:"auth_type,omitempty" validate:"omitempty,oneof=none basic bearer api_key oauth2"`
	AuthConfig    JSONB    `json:"auth_config,omitempty"`
	Headers       JSONB    `json:"headers,omitempty"`
	TimeoutMs     *int     `json:"timeout_ms,omitempty" validate:"omitempty,gt=0,lte=60000"`
	RetryConfig   JSONB    `json:"retry_config,omitempty"`
	IsActive      *bool    `json:"is_active,omitempty"`
	BatchSize     *int     `json:"batch_size,omitempty"`
	RateLimit     *int     `json:"rate_limit,omitempty"`
	Priority      *int     `json:"priority,omitempty"`
	Tags          []string `json:"tags,omitempty"`
	Metadata      JSONB    `json:"metadata,omitempty"`
	UpdatedBy     *string  `json:"updated_by,omitempty" validate:"omitempty,uuid"`
}
