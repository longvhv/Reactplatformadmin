package models

import (
	"time"
)

type WebhookDeliveryLog struct {
	ID            string     `json:"_id" db:"_id"`
	TenantID      *string    `json:"tenant_id,omitempty" db:"tenant_id"`
	WebhookID     *string    `json:"webhook_id,omitempty" db:"webhook_id"`
	EventType     *string    `json:"event_type,omitempty" db:"event_type"`
	TargetURL     *string    `json:"target_url,omitempty" db:"target_url"`
	Payload       JSONB      `json:"payload,omitempty" db:"payload"`
	ResponseBody  *string    `json:"response_body,omitempty" db:"response_body"`
	StatusCode    *int       `json:"status_code,omitempty" db:"status_code"`
	IsSuccess     *bool      `json:"is_success,omitempty" db:"is_success"`
	LatencyMs     *int       `json:"latency_ms,omitempty" db:"latency_ms"`
	AttemptNumber int        `json:"attempt_number" db:"attempt_number"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
}

type CreateWebhookDeliveryLogRequest struct {
	TenantID      *string `json:"tenant_id,omitempty" validate:"omitempty,uuid"`
	WebhookID     *string `json:"webhook_id,omitempty" validate:"omitempty,uuid"`
	EventType     *string `json:"event_type,omitempty"`
	TargetURL     *string `json:"target_url,omitempty" validate:"omitempty,url"`
	Payload       JSONB   `json:"payload,omitempty"`
	ResponseBody  *string `json:"response_body,omitempty"`
	StatusCode    *int    `json:"status_code,omitempty"`
	IsSuccess     *bool   `json:"is_success,omitempty"`
	LatencyMs     *int    `json:"latency_ms,omitempty"`
	AttemptNumber int     `json:"attempt_number" validate:"required,gte=1"`
}
