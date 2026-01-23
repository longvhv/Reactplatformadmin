package models

import (
	"time"
	"github.com/google/uuid"
)

// Webhook represents a webhook configuration
type Webhook struct {
	ID                 uuid.UUID       `json:"id" db:"_id"`
	TenantID           uuid.UUID       `json:"tenant_id" db:"tenant_id"`
	Name               string          `json:"name" db:"name"`
	Description        *string         `json:"description,omitempty" db:"description"`
	URL                string          `json:"url" db:"url"`
	Method             string          `json:"method" db:"method"`                      // POST, GET, PUT, PATCH, DELETE
	EventTypes         []string        `json:"event_types" db:"event_types"`            // Array of event types
	EventFilter        map[string]any  `json:"event_filter,omitempty" db:"event_filter"` // JSONB
	SecretKey          *string         `json:"secret_key,omitempty" db:"secret_key"`
	AuthType           string          `json:"auth_type" db:"auth_type"`                // none, basic, bearer, api_key, oauth2
	AuthConfig         map[string]any  `json:"auth_config,omitempty" db:"auth_config"`  // JSONB
	Headers            map[string]any  `json:"headers,omitempty" db:"headers"`          // JSONB
	TimeoutMs          int             `json:"timeout_ms" db:"timeout_ms"`
	RetryConfig        map[string]any  `json:"retry_config" db:"retry_config"`          // JSONB
	IsActive           bool            `json:"is_active" db:"is_active"`
	IsVerified         bool            `json:"is_verified" db:"is_verified"`
	VerificationToken  *string         `json:"verification_token,omitempty" db:"verification_token"`
	VerifiedAt         *time.Time      `json:"verified_at,omitempty" db:"verified_at"`
	LastTriggeredAt    *time.Time      `json:"last_triggered_at,omitempty" db:"last_triggered_at"`
	LastSuccessAt      *time.Time      `json:"last_success_at,omitempty" db:"last_success_at"`
	LastFailureAt      *time.Time      `json:"last_failure_at,omitempty" db:"last_failure_at"`
	SuccessCount       int             `json:"success_count" db:"success_count"`
	FailureCount       int             `json:"failure_count" db:"failure_count"`
	TotalCount         int             `json:"total_count" db:"total_count"`
	AvgResponseTimeMs  *int            `json:"avg_response_time_ms,omitempty" db:"avg_response_time_ms"`
	BatchSize          *int            `json:"batch_size,omitempty" db:"batch_size"`
	RateLimit          *int            `json:"rate_limit,omitempty" db:"rate_limit"`
	Priority           int             `json:"priority" db:"priority"`
	Tags               []string        `json:"tags,omitempty" db:"tags"`
	Metadata           map[string]any  `json:"metadata" db:"metadata"`
	CreatedAt          time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at" db:"updated_at"`
	CreatedBy          *uuid.UUID      `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy          *uuid.UUID      `json:"updated_by,omitempty" db:"updated_by"`
}

// NewWebhook creates a new webhook
func NewWebhook(tenantID uuid.UUID, name, url string, eventTypes []string) *Webhook {
	now := time.Now()
	return &Webhook{
		ID:           uuid.New(),
		TenantID:     tenantID,
		Name:         name,
		URL:          url,
		Method:       "POST",
		EventTypes:   eventTypes,
		AuthType:     "none",
		TimeoutMs:    5000,
		RetryConfig: map[string]any{
			"max_retries":        3,
			"retry_delay":        1000,
			"backoff_multiplier": 2,
		},
		IsActive:      true,
		IsVerified:    false,
		SuccessCount:  0,
		FailureCount:  0,
		TotalCount:    0,
		Priority:      0,
		Headers:       make(map[string]any),
		Metadata:      make(map[string]any),
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// Touch updates the updated_at timestamp
func (w *Webhook) Touch() {
	w.UpdatedAt = time.Now()
}