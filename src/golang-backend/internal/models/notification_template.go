package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// NotificationTemplate represents a notification template
type NotificationTemplate struct {
	ID                 uuid.UUID      `json:"_id" db:"_id"`
	TenantID           uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	TemplateCode       string         `json:"template_code" db:"template_code"`
	TemplateName       string         `json:"template_name" db:"template_name"`
	Description        sql.NullString `json:"description,omitempty" db:"description"`
	Subject            sql.NullString `json:"subject,omitempty" db:"subject"`
	BodyText           sql.NullString `json:"body_text,omitempty" db:"body_text"`
	BodyHTML           sql.NullString `json:"body_html,omitempty" db:"body_html"`
	NotificationType   string         `json:"notification_type" db:"notification_type"` // email, sms, push, in_app
	Category           sql.NullString `json:"category,omitempty" db:"category"`
	Priority           string         `json:"priority" db:"priority"` // low, normal, high, urgent
	LanguageCode       string         `json:"language_code" db:"language_code"`
	Variables          JSONB          `json:"variables,omitempty" db:"variables"`
	SampleData         JSONB          `json:"sample_data,omitempty" db:"sample_data"`
	DeliveryChannels   pq.StringArray `json:"delivery_channels" db:"delivery_channels"`
	SendImmediately    bool           `json:"send_immediately" db:"send_immediately"`
	ScheduledSendTime  sql.NullString `json:"scheduled_send_time,omitempty" db:"scheduled_send_time"`
	Status             string         `json:"status" db:"status"` // active, inactive, archived
	IsSystemTemplate   bool           `json:"is_system_template" db:"is_system_template"`
	IsEditable         bool           `json:"is_editable" db:"is_editable"`
	UsageCount         int            `json:"usage_count" db:"usage_count"`
	LastUsedAt         sql.NullTime   `json:"last_used_at,omitempty" db:"last_used_at"`
	SuccessCount       int            `json:"success_count" db:"success_count"`
	FailureCount       int            `json:"failure_count" db:"failure_count"`
	Version            int            `json:"version" db:"version"`
	ParentTemplateID   sql.NullString `json:"parent_template_id,omitempty" db:"parent_template_id"`
	Attachments        JSONB          `json:"attachments,omitempty" db:"attachments"`
	Headers            JSONB          `json:"headers,omitempty" db:"headers"`
	Metadata           JSONB          `json:"metadata,omitempty" db:"metadata"`
	Tags               pq.StringArray `json:"tags,omitempty" db:"tags"`
	CreatedAt          time.Time      `json:"created_at" db:"created_at"`
	CreatedBy          sql.NullString `json:"created_by,omitempty" db:"created_by"`
	UpdatedAt          time.Time      `json:"updated_at" db:"updated_at"`
	UpdatedBy          sql.NullString `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt          sql.NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy          sql.NullString `json:"deleted_by,omitempty" db:"deleted_by"`
}

// CreateNotificationTemplateRequest represents the request to create a notification template
type CreateNotificationTemplateRequest struct {
	TenantID          uuid.UUID              `json:"tenant_id" validate:"required,uuid"`
	TemplateCode      string                 `json:"template_code" validate:"required,min=1,max=200"`
	TemplateName      string                 `json:"template_name" validate:"required,min=1,max=500"`
	Description       string                 `json:"description,omitempty"`
	Subject           string                 `json:"subject,omitempty"`
	BodyText          string                 `json:"body_text,omitempty"`
	BodyHTML          string                 `json:"body_html,omitempty"`
	NotificationType  string                 `json:"notification_type" validate:"required,oneof=email sms push in_app"`
	Category          string                 `json:"category,omitempty"`
	Priority          string                 `json:"priority,omitempty"`
	LanguageCode      string                 `json:"language_code,omitempty"`
	Variables         []string               `json:"variables,omitempty"`
	SampleData        map[string]interface{} `json:"sample_data,omitempty"`
	DeliveryChannels  []string               `json:"delivery_channels,omitempty"`
	SendImmediately   bool                   `json:"send_immediately"`
	ScheduledSendTime string                 `json:"scheduled_send_time,omitempty"`
	ParentTemplateID  *uuid.UUID             `json:"parent_template_id,omitempty"`
	Attachments       map[string]interface{} `json:"attachments,omitempty"`
	Headers           map[string]interface{} `json:"headers,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
	Tags              []string               `json:"tags,omitempty"`
	CreatedBy         string                 `json:"created_by,omitempty"`
}

// UpdateNotificationTemplateRequest represents the request to update a notification template
type UpdateNotificationTemplateRequest struct {
	TemplateName      *string                 `json:"template_name,omitempty" validate:"omitempty,min=1,max=500"`
	Description       *string                 `json:"description,omitempty"`
	Subject           *string                 `json:"subject,omitempty"`
	BodyText          *string                 `json:"body_text,omitempty"`
	BodyHTML          *string                 `json:"body_html,omitempty"`
	Category          *string                 `json:"category,omitempty"`
	Priority          *string                 `json:"priority,omitempty"`
	LanguageCode      *string                 `json:"language_code,omitempty"`
	Variables         *[]string               `json:"variables,omitempty"`
	SampleData        *map[string]interface{} `json:"sample_data,omitempty"`
	DeliveryChannels  *[]string               `json:"delivery_channels,omitempty"`
	SendImmediately   *bool                   `json:"send_immediately,omitempty"`
	ScheduledSendTime *string                 `json:"scheduled_send_time,omitempty"`
	Status            *string                 `json:"status,omitempty" validate:"omitempty,oneof=active inactive archived"`
	Attachments       *map[string]interface{} `json:"attachments,omitempty"`
	Headers           *map[string]interface{} `json:"headers,omitempty"`
	Metadata          *map[string]interface{} `json:"metadata,omitempty"`
	Tags              *[]string               `json:"tags,omitempty"`
	UpdatedBy         *string                 `json:"updated_by,omitempty"`
}

// TableName returns the table name for NotificationTemplate
func (NotificationTemplate) TableName() string {
	return "notification_templates"
}
