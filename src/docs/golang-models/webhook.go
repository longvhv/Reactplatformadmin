package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// WEBHOOK ENDPOINT - Webhook Endpoints
// ============================================================================
// Purpose: Define webhook endpoints for receiving events
// Table: webhook_endpoints
// Primary Key: _id (UUID)
// Features: Multi-event subscription, Security, Status management
// ============================================================================

type EndpointStatus string

const (
	EndpointStatusActive    EndpointStatus = "ACTIVE"
	EndpointStatusInactive  EndpointStatus = "INACTIVE"
	EndpointStatusDisabled  EndpointStatus = "DISABLED"
	EndpointStatusFailed    EndpointStatus = "FAILED"
	EndpointStatusSuspended EndpointStatus = "SUSPENDED"
)

type AuthType string

const (
	AuthTypeNone       AuthType = "NONE"
	AuthTypeBasic      AuthType = "BASIC"
	AuthTypeBearer     AuthType = "BEARER"
	AuthTypeAPIKey     AuthType = "API_KEY"
	AuthTypeOAuth2     AuthType = "OAUTH2"
	AuthTypeCustom     AuthType = "CUSTOM"
)

// JSONB type for PostgreSQL jsonb
type JSONB map[string]interface{}

func (j *JSONB) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan JSONB")
	}
	return json.Unmarshal(bytes, j)
}

func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// ============================================================================
// WebhookEndpoint Model (32 fields)
// ============================================================================

type WebhookEndpoint struct {
	// ========== Identity (3 fields) ==========
	ID           uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID     *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	ApplicationID *uuid.UUID `gorm:"column:application_id;type:uuid;index" json:"application_id,omitempty"`

	// ========== Endpoint Info (6 fields) ==========
	Name        string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	URL         string         `gorm:"column:url;type:text;not null" json:"url"`
	Status      EndpointStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	IsVerified  bool           `gorm:"column:is_verified;default:false" json:"is_verified"`
	Version     string         `gorm:"column:version;type:varchar(20);default:'v1'" json:"version"`

	// ========== Security (5 fields) ==========
	Secret        string   `gorm:"column:secret;type:varchar(255);not null" json:"secret"` // For signature verification
	AuthType      AuthType `gorm:"column:auth_type;type:varchar(20);default:'NONE'" json:"auth_type"`
	AuthUsername  *string  `gorm:"column:auth_username;type:varchar(255)" json:"auth_username,omitempty"`
	AuthPassword  *string  `gorm:"column:auth_password;type:varchar(255)" json:"auth_password,omitempty"`
	AuthToken     *string  `gorm:"column:auth_token;type:text" json:"auth_token,omitempty"`

	// ========== Configuration (6 fields) ==========
	TimeoutSeconds   int  `gorm:"column:timeout_seconds;default:30" json:"timeout_seconds"`
	MaxRetries       int  `gorm:"column:max_retries;default:3" json:"max_retries"`
	RetryIntervalSec int  `gorm:"column:retry_interval_sec;default:60" json:"retry_interval_sec"`
	EnableBatching   bool `gorm:"column:enable_batching;default:false" json:"enable_batching"`
	BatchSize        *int `gorm:"column:batch_size" json:"batch_size,omitempty"`
	BatchWindowSec   *int `gorm:"column:batch_window_sec" json:"batch_window_sec,omitempty"`

	// ========== Custom Headers (1 field) ==========
	CustomHeaders JSONB `gorm:"column:custom_headers;type:jsonb" json:"custom_headers,omitempty"`

	// ========== Statistics (4 fields) ==========
	TotalDeliveries   int64      `gorm:"column:total_deliveries;default:0" json:"total_deliveries"`
	SuccessfulDeliveries int64   `gorm:"column:successful_deliveries;default:0" json:"successful_deliveries"`
	FailedDeliveries  int64      `gorm:"column:failed_deliveries;default:0" json:"failed_deliveries"`
	LastDeliveryAt    *time.Time `gorm:"column:last_delivery_at" json:"last_delivery_at,omitempty"`

	// ========== Health (3 fields) ==========
	HealthStatus      string     `gorm:"column:health_status;type:varchar(20);default:'UNKNOWN'" json:"health_status"`
	LastHealthCheck   *time.Time `gorm:"column:last_health_check" json:"last_health_check,omitempty"`
	ConsecutiveFailures int      `gorm:"column:consecutive_failures;default:0" json:"consecutive_failures"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete (2 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Subscriptions []WebhookSubscription `gorm:"foreignKey:EndpointID" json:"subscriptions,omitempty"`
	Deliveries    []WebhookDelivery     `gorm:"foreignKey:EndpointID" json:"deliveries,omitempty"`
}

func (WebhookEndpoint) TableName() string {
	return "webhook_endpoints"
}

// Helper Methods
func (e *WebhookEndpoint) IsActive() bool {
	return e.Status == EndpointStatusActive
}

func (e *WebhookEndpoint) IsHealthy() bool {
	return e.HealthStatus == "HEALTHY" || e.HealthStatus == "UNKNOWN"
}

func (e *WebhookEndpoint) GetSuccessRate() float64 {
	if e.TotalDeliveries == 0 {
		return 0
	}
	return (float64(e.SuccessfulDeliveries) / float64(e.TotalDeliveries)) * 100
}

func (e *WebhookEndpoint) RecordSuccess() {
	e.TotalDeliveries++
	e.SuccessfulDeliveries++
	e.ConsecutiveFailures = 0
	now := time.Now()
	e.LastDeliveryAt = &now
	e.HealthStatus = "HEALTHY"
}

func (e *WebhookEndpoint) RecordFailure() {
	e.TotalDeliveries++
	e.FailedDeliveries++
	e.ConsecutiveFailures++
	now := time.Now()
	e.LastDeliveryAt = &now

	// Auto-suspend after too many failures
	if e.ConsecutiveFailures >= 10 {
		e.Status = EndpointStatusSuspended
		e.HealthStatus = "UNHEALTHY"
	} else if e.ConsecutiveFailures >= 5 {
		e.HealthStatus = "DEGRADED"
	}
}

// ============================================================================
// WEBHOOK SUBSCRIPTION - Event Subscriptions
// ============================================================================

type WebhookSubscription struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	EndpointID uuid.UUID `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`

	// Subscription Info (3 fields)
	EventType   string `gorm:"column:event_type;type:varchar(100);not null;index" json:"event_type"`
	IsActive    bool   `gorm:"column:is_active;default:true" json:"is_active"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`

	// Filters (2 fields)
	Filters       JSONB `gorm:"column:filters;type:jsonb" json:"filters,omitempty"`
	FilterPattern *string `gorm:"column:filter_pattern;type:text" json:"filter_pattern,omitempty"` // JSONPath or regex

	// Statistics (3 fields)
	EventCount     int64      `gorm:"column:event_count;default:0" json:"event_count"`
	LastEventAt    *time.Time `gorm:"column:last_event_at" json:"last_event_at,omitempty"`
	LastDeliveryAt *time.Time `gorm:"column:last_delivery_at" json:"last_delivery_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
}

func (WebhookSubscription) TableName() string {
	return "webhook_subscriptions"
}

func (s *WebhookSubscription) IncrementEventCount() {
	s.EventCount++
	now := time.Now()
	s.LastEventAt = &now
}

func (s *WebhookSubscription) MatchesEvent(eventData map[string]interface{}) bool {
	// Simple filter matching (can be extended)
	if s.Filters == nil || len(s.Filters) == 0 {
		return true
	}

	// Check each filter
	for key, expectedValue := range s.Filters {
		if actualValue, exists := eventData[key]; !exists || actualValue != expectedValue {
			return false
		}
	}

	return true
}

// ============================================================================
// WEBHOOK EVENT - Event Definitions
// ============================================================================

type EventCategory string

const (
	EventCategoryUser     EventCategory = "USER"
	EventCategoryOrder    EventCategory = "ORDER"
	EventCategoryPayment  EventCategory = "PAYMENT"
	EventCategoryProduct  EventCategory = "PRODUCT"
	EventCategorySystem   EventCategory = "SYSTEM"
	EventCategoryCustom   EventCategory = "CUSTOM"
)

type WebhookEvent struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Event Info (7 fields)
	EventType   string        `gorm:"column:event_type;type:varchar(100);uniqueIndex;not null" json:"event_type"`
	EventName   string        `gorm:"column:event_name;type:varchar(255);not null" json:"event_name"`
	Category    EventCategory `gorm:"column:category;type:varchar(30);not null;index" json:"category"`
	Description string        `gorm:"column:description;type:text;not null" json:"description"`
	Version     string        `gorm:"column:version;type:varchar(20);default:'v1'" json:"version"`
	IsActive    bool          `gorm:"column:is_active;default:true" json:"is_active"`
	IsSystem    bool          `gorm:"column:is_system;default:false" json:"is_system"` // System vs custom events

	// Schema (2 fields)
	PayloadSchema JSONB  `gorm:"column:payload_schema;type:jsonb" json:"payload_schema,omitempty"` // JSON Schema
	ExamplePayload JSONB `gorm:"column:example_payload;type:jsonb" json:"example_payload,omitempty"`

	// Statistics (2 fields)
	SubscriptionCount int64      `gorm:"column:subscription_count;default:0" json:"subscription_count"`
	LastTriggeredAt   *time.Time `gorm:"column:last_triggered_at" json:"last_triggered_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
}

func (WebhookEvent) TableName() string {
	return "webhook_events"
}

// ============================================================================
// WEBHOOK PAYLOAD - Event Payloads (Queue)
// ============================================================================

type PayloadStatus string

const (
	PayloadStatusPending    PayloadStatus = "PENDING"
	PayloadStatusQueued     PayloadStatus = "QUEUED"
	PayloadStatusProcessing PayloadStatus = "PROCESSING"
	PayloadStatusDelivered  PayloadStatus = "DELIVERED"
	PayloadStatusFailed     PayloadStatus = "FAILED"
	PayloadStatusCanceled   PayloadStatus = "CANCELED"
)

type WebhookPayload struct {
	// ========== Identity (3 fields) ==========
	ID        uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID  *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	EventType string     `gorm:"column:event_type;type:varchar(100);not null;index" json:"event_type"`

	// ========== Payload Data (4 fields) ==========
	PayloadData  JSONB  `gorm:"column:payload_data;type:jsonb;not null" json:"payload_data"`
	PayloadHash  string `gorm:"column:payload_hash;type:varchar(64);not null" json:"payload_hash"` // SHA256
	PayloadSize  int    `gorm:"column:payload_size;not null" json:"payload_size"` // Bytes
	ContentType  string `gorm:"column:content_type;type:varchar(100);default:'application/json'" json:"content_type"`

	// ========== Status (2 fields) ==========
	Status        PayloadStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	StatusMessage *string       `gorm:"column:status_message;type:text" json:"status_message,omitempty"`

	// ========== Source (3 fields) ==========
	SourceID   *uuid.UUID `gorm:"column:source_id;type:uuid" json:"source_id,omitempty"` // Related entity ID
	SourceType *string    `gorm:"column:source_type;type:varchar(50)" json:"source_type,omitempty"` // Entity type
	SourceUser *uuid.UUID `gorm:"column:source_user;type:uuid" json:"source_user,omitempty"` // User who triggered

	// ========== Processing (4 fields) ==========
	ScheduledAt   time.Time  `gorm:"column:scheduled_at;not null;index" json:"scheduled_at"`
	ProcessedAt   *time.Time `gorm:"column:processed_at" json:"processed_at,omitempty"`
	CompletedAt   *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	ExpiresAt     *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`

	// ========== Delivery Stats (3 fields) ==========
	DeliveryCount      int `gorm:"column:delivery_count;default:0" json:"delivery_count"`
	SuccessfulDeliveries int `gorm:"column:successful_deliveries;default:0" json:"successful_deliveries"`
	FailedDeliveries   int `gorm:"column:failed_deliveries;default:0" json:"failed_deliveries"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (2 fields) ==========
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Deliveries []WebhookDelivery `gorm:"foreignKey:PayloadID" json:"deliveries,omitempty"`
}

func (WebhookPayload) TableName() string {
	return "webhook_payloads"
}

func (p *WebhookPayload) IsPending() bool {
	return p.Status == PayloadStatusPending || p.Status == PayloadStatusQueued
}

func (p *WebhookPayload) IsProcessing() bool {
	return p.Status == PayloadStatusProcessing
}

func (p *WebhookPayload) IsCompleted() bool {
	return p.Status == PayloadStatusDelivered
}

func (p *WebhookPayload) IsExpired() bool {
	return p.ExpiresAt != nil && time.Now().After(*p.ExpiresAt)
}

func (p *WebhookPayload) MarkProcessing() {
	p.Status = PayloadStatusProcessing
	now := time.Now()
	p.ProcessedAt = &now
}

func (p *WebhookPayload) MarkCompleted() {
	p.Status = PayloadStatusDelivered
	now := time.Now()
	p.CompletedAt = &now
}

func (p *WebhookPayload) MarkFailed(reason string) {
	p.Status = PayloadStatusFailed
	p.StatusMessage = &reason
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateEndpoint creates a new webhook endpoint
func CreateEndpoint(
	db *gorm.DB,
	endpoint *WebhookEndpoint,
	eventTypes []string,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		endpoint.CreatedBy = userID
		endpoint.Secret = generateWebhookSecret()

		if err := tx.Create(endpoint).Error; err != nil {
			return err
		}

		// Create subscriptions
		if len(eventTypes) > 0 {
			for _, eventType := range eventTypes {
				subscription := &WebhookSubscription{
					EndpointID: endpoint.ID,
					EventType:  eventType,
					IsActive:   true,
					CreatedBy:  userID,
				}
				if err := tx.Create(subscription).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// SubscribeToEvent subscribes an endpoint to an event
func SubscribeToEvent(
	db *gorm.DB,
	endpointID uuid.UUID,
	eventType string,
	filters map[string]interface{},
	userID *uuid.UUID,
) error {
	// Check if already subscribed
	var existing WebhookSubscription
	err := db.Where("endpoint_id = ? AND event_type = ?", endpointID, eventType).
		First(&existing).Error

	if err == nil {
		// Already subscribed, update filters
		if filters != nil {
			existing.Filters = filters
			existing.UpdatedBy = userID
			return db.Save(&existing).Error
		}
		return nil
	}

	// Create new subscription
	subscription := &WebhookSubscription{
		EndpointID: endpointID,
		EventType:  eventType,
		IsActive:   true,
		CreatedBy:  userID,
	}

	if filters != nil {
		subscription.Filters = filters
	}

	return db.Create(subscription).Error
}

// UnsubscribeFromEvent unsubscribes an endpoint from an event
func UnsubscribeFromEvent(db *gorm.DB, endpointID uuid.UUID, eventType string) error {
	return db.Where("endpoint_id = ? AND event_type = ?", endpointID, eventType).
		Delete(&WebhookSubscription{}).Error
}

// CreatePayload creates a webhook payload for delivery
func CreatePayload(
	db *gorm.DB,
	eventType string,
	payloadData map[string]interface{},
	sourceID *uuid.UUID,
	sourceType *string,
	tenantID *uuid.UUID,
) (*WebhookPayload, error) {
	payloadJSON, err := json.Marshal(payloadData)
	if err != nil {
		return nil, err
	}

	payload := &WebhookPayload{
		TenantID:    tenantID,
		EventType:   eventType,
		PayloadData: payloadData,
		PayloadHash: calculateHash(payloadJSON),
		PayloadSize: len(payloadJSON),
		ContentType: "application/json",
		Status:      PayloadStatusPending,
		SourceID:    sourceID,
		SourceType:  sourceType,
		ScheduledAt: time.Now(),
	}

	// Set expiry (default 7 days)
	expiresAt := time.Now().AddDate(0, 0, 7)
	payload.ExpiresAt = &expiresAt

	if err := db.Create(payload).Error; err != nil {
		return nil, err
	}

	return payload, nil
}

// TriggerEvent triggers a webhook event
func TriggerEvent(
	db *gorm.DB,
	eventType string,
	payloadData map[string]interface{},
	sourceID *uuid.UUID,
	sourceType *string,
	tenantID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create payload
		payload, err := CreatePayload(tx, eventType, payloadData, sourceID, sourceType, tenantID)
		if err != nil {
			return err
		}

		// Find active subscriptions
		var subscriptions []WebhookSubscription
		query := tx.Where("event_type = ? AND is_active = ?", eventType, true).
			Preload("Endpoint")

		if tenantID != nil {
			query = query.Where("endpoint_id IN (SELECT _id FROM webhook_endpoints WHERE tenant_id = ?)", tenantID)
		}

		if err := query.Find(&subscriptions).Error; err != nil {
			return err
		}

		// Filter subscriptions based on filters
		var matchingSubscriptions []WebhookSubscription
		for _, sub := range subscriptions {
			if sub.MatchesEvent(payloadData) && sub.Endpoint.IsActive() {
				matchingSubscriptions = append(matchingSubscriptions, sub)
			}
		}

		if len(matchingSubscriptions) == 0 {
			payload.Status = PayloadStatusCanceled
			payload.StatusMessage = strPtr("No active subscriptions")
			tx.Save(payload)
			return nil
		}

		// Queue payload
		payload.Status = PayloadStatusQueued
		payload.DeliveryCount = len(matchingSubscriptions)
		tx.Save(payload)

		// Update subscription stats
		for _, sub := range matchingSubscriptions {
			sub.IncrementEventCount()
			tx.Save(&sub)
		}

		// Update event stats
		var event WebhookEvent
		if err := tx.Where("event_type = ?", eventType).First(&event).Error; err == nil {
			now := time.Now()
			event.LastTriggeredAt = &now
			tx.Save(&event)
		}

		return nil
	})
}

// GetActiveEndpoints gets all active endpoints
func GetActiveEndpoints(db *gorm.DB, tenantID *uuid.UUID) ([]WebhookEndpoint, error) {
	var endpoints []WebhookEndpoint
	query := db.Where("status = ?", EndpointStatusActive)

	if tenantID != nil {
		query = query.Where("tenant_id = ?", tenantID)
	}

	err := query.Preload("Subscriptions", "is_active = ?", true).
		Order("created_at DESC").
		Find(&endpoints).Error

	return endpoints, err
}

// GetEndpointsByEventType gets endpoints subscribed to an event type
func GetEndpointsByEventType(
	db *gorm.DB,
	eventType string,
	tenantID *uuid.UUID,
) ([]WebhookEndpoint, error) {
	var endpoints []WebhookEndpoint

	query := db.Joins("JOIN webhook_subscriptions ON webhook_subscriptions.endpoint_id = webhook_endpoints._id").
		Where("webhook_subscriptions.event_type = ? AND webhook_subscriptions.is_active = ?", eventType, true).
		Where("webhook_endpoints.status = ?", EndpointStatusActive)

	if tenantID != nil {
		query = query.Where("webhook_endpoints.tenant_id = ?", tenantID)
	}

	err := query.Preload("Subscriptions", "event_type = ? AND is_active = ?", eventType, true).
		Find(&endpoints).Error

	return endpoints, err
}

// GetAvailableEvents gets all available webhook events
func GetAvailableEvents(db *gorm.DB, category *EventCategory) ([]WebhookEvent, error) {
	query := db.Where("is_active = ?", true)

	if category != nil {
		query = query.Where("category = ?", category)
	}

	var events []WebhookEvent
	err := query.Order("category ASC, event_name ASC").Find(&events).Error

	return events, err
}

// VerifyEndpoint verifies an endpoint
func VerifyEndpoint(db *gorm.DB, endpointID uuid.UUID) error {
	return db.Model(&WebhookEndpoint{}).
		Where("_id = ?", endpointID).
		Updates(map[string]interface{}{
			"is_verified":  true,
			"health_status": "HEALTHY",
		}).Error
}

// DisableEndpoint disables an endpoint
func DisableEndpoint(db *gorm.DB, endpointID uuid.UUID, reason string, userID *uuid.UUID) error {
	return db.Transaction(func(tx *gorm.DB) error {
		endpoint := &WebhookEndpoint{}
		if err := tx.First(endpoint, endpointID).Error; err != nil {
			return err
		}

		endpoint.Status = EndpointStatusDisabled
		endpoint.UpdatedBy = userID

		if endpoint.Metadata == nil {
			endpoint.Metadata = JSONB{}
		}
		endpoint.Metadata["disabled_reason"] = reason
		endpoint.Metadata["disabled_at"] = time.Now()

		return tx.Save(endpoint).Error
	})
}

// CleanupExpiredPayloads removes expired payloads
func CleanupExpiredPayloads(db *gorm.DB) error {
	return db.Where("expires_at IS NOT NULL AND expires_at < ?", time.Now()).
		Delete(&WebhookPayload{}).Error
}

func generateWebhookSecret() string {
	return fmt.Sprintf("whsec_%s", uuid.New().String())
}

func calculateHash(data []byte) string {
	// Simple hash for demonstration - use proper crypto hash in production
	return fmt.Sprintf("%x", data[:min(len(data), 32)])
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func strPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}
