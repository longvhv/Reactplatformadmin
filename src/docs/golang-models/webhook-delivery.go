package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// WEBHOOK DELIVERY - Delivery Tracking
// ============================================================================
// Purpose: Track webhook delivery attempts
// Table: webhook_deliveries
// Primary Key: _id (UUID)
// Features: Multi-attempt tracking, Retry logic, Response logging
// ============================================================================

type DeliveryStatus string

const (
	DeliveryStatusPending    DeliveryStatus = "PENDING"
	DeliveryStatusSending    DeliveryStatus = "SENDING"
	DeliveryStatusSuccess    DeliveryStatus = "SUCCESS"
	DeliveryStatusFailed     DeliveryStatus = "FAILED"
	DeliveryStatusRetrying   DeliveryStatus = "RETRYING"
	DeliveryStatusCanceled   DeliveryStatus = "CANCELED"
	DeliveryStatusTimedOut   DeliveryStatus = "TIMED_OUT"
)

type WebhookDelivery struct {
	// ========== Identity (4 fields) ==========
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PayloadID  uuid.UUID `gorm:"column:payload_id;type:uuid;not null;index" json:"payload_id"`
	EndpointID uuid.UUID `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// ========== Delivery Info (5 fields) ==========
	Status         DeliveryStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	AttemptNumber  int            `gorm:"column:attempt_number;default:1" json:"attempt_number"`
	MaxAttempts    int            `gorm:"column:max_attempts;default:3" json:"max_attempts"`
	NextRetryAt    *time.Time     `gorm:"column:next_retry_at" json:"next_retry_at,omitempty"`
	LastAttemptAt  *time.Time     `gorm:"column:last_attempt_at" json:"last_attempt_at,omitempty"`

	// ========== Request Details (6 fields) ==========
	RequestURL     string  `gorm:"column:request_url;type:text;not null" json:"request_url"`
	RequestMethod  string  `gorm:"column:request_method;type:varchar(10);default:'POST'" json:"request_method"`
	RequestHeaders JSONB   `gorm:"column:request_headers;type:jsonb" json:"request_headers,omitempty"`
	RequestBody    *string `gorm:"column:request_body;type:text" json:"request_body,omitempty"`
	RequestSize    int     `gorm:"column:request_size" json:"request_size"` // Bytes
	Signature      string  `gorm:"column:signature;type:varchar(255)" json:"signature"`

	// ========== Response Details (6 fields) ==========
	ResponseStatus  *int    `gorm:"column:response_status" json:"response_status,omitempty"`
	ResponseHeaders JSONB   `gorm:"column:response_headers;type:jsonb" json:"response_headers,omitempty"`
	ResponseBody    *string `gorm:"column:response_body;type:text" json:"response_body,omitempty"`
	ResponseSize    *int    `gorm:"column:response_size" json:"response_size,omitempty"` // Bytes
	ResponseTime    *int    `gorm:"column:response_time" json:"response_time,omitempty"` // Milliseconds
	ErrorMessage    *string `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// ========== Timing (4 fields) ==========
	ScheduledAt time.Time  `gorm:"column:scheduled_at;not null;index" json:"scheduled_at"`
	StartedAt   *time.Time `gorm:"column:started_at" json:"started_at,omitempty"`
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	Duration    *int       `gorm:"column:duration" json:"duration,omitempty"` // Milliseconds

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (2 fields) ==========
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Payload  *WebhookPayload  `gorm:"foreignKey:PayloadID" json:"payload,omitempty"`
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
	Attempts []DeliveryAttempt `gorm:"foreignKey:DeliveryID" json:"attempts,omitempty"`
}

func (WebhookDelivery) TableName() string {
	return "webhook_deliveries"
}

// Helper Methods
func (d *WebhookDelivery) IsSuccess() bool {
	return d.Status == DeliveryStatusSuccess
}

func (d *WebhookDelivery) IsFailed() bool {
	return d.Status == DeliveryStatusFailed
}

func (d *WebhookDelivery) CanRetry() bool {
	return d.AttemptNumber < d.MaxAttempts && 
	       (d.Status == DeliveryStatusFailed || d.Status == DeliveryStatusTimedOut)
}

func (d *WebhookDelivery) ShouldRetry() bool {
	return d.CanRetry() && d.NextRetryAt != nil && time.Now().After(*d.NextRetryAt)
}

func (d *WebhookDelivery) CalculateNextRetry() time.Time {
	// Exponential backoff: 1min, 5min, 30min
	delays := []int{60, 300, 1800}
	delayIndex := d.AttemptNumber - 1
	if delayIndex >= len(delays) {
		delayIndex = len(delays) - 1
	}
	return time.Now().Add(time.Duration(delays[delayIndex]) * time.Second)
}

func (d *WebhookDelivery) MarkSuccess(statusCode int, responseBody string, responseTime int) {
	now := time.Now()
	d.Status = DeliveryStatusSuccess
	d.ResponseStatus = &statusCode
	d.ResponseBody = &responseBody
	d.ResponseTime = &responseTime
	d.CompletedAt = &now
	
	if d.StartedAt != nil {
		duration := int(now.Sub(*d.StartedAt).Milliseconds())
		d.Duration = &duration
	}
}

func (d *WebhookDelivery) MarkFailed(errorMsg string) {
	now := time.Now()
	d.Status = DeliveryStatusFailed
	d.ErrorMessage = &errorMsg
	d.LastAttemptAt = &now
	d.CompletedAt = &now

	if d.CanRetry() {
		d.Status = DeliveryStatusRetrying
		nextRetry := d.CalculateNextRetry()
		d.NextRetryAt = &nextRetry
	}
}

// ============================================================================
// DELIVERY ATTEMPT - Individual Delivery Attempts
// ============================================================================

type AttemptResult string

const (
	AttemptResultSuccess     AttemptResult = "SUCCESS"
	AttemptResultFailed      AttemptResult = "FAILED"
	AttemptResultTimeout     AttemptResult = "TIMEOUT"
	AttemptResultNetworkError AttemptResult = "NETWORK_ERROR"
	AttemptResultServerError AttemptResult = "SERVER_ERROR"
)

type DeliveryAttempt struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	DeliveryID uuid.UUID `gorm:"column:delivery_id;type:uuid;not null;index" json:"delivery_id"`

	// Attempt Info (4 fields)
	AttemptNumber int           `gorm:"column:attempt_number;not null" json:"attempt_number"`
	Result        AttemptResult `gorm:"column:result;type:varchar(30);not null" json:"result"`
	ErrorMessage  *string       `gorm:"column:error_message;type:text" json:"error_message,omitempty"`
	ErrorCode     *string       `gorm:"column:error_code;type:varchar(50)" json:"error_code,omitempty"`

	// Request (3 fields)
	RequestURL     string `gorm:"column:request_url;type:text;not null" json:"request_url"`
	RequestHeaders JSONB  `gorm:"column:request_headers;type:jsonb" json:"request_headers,omitempty"`
	RequestSize    int    `gorm:"column:request_size" json:"request_size"`

	// Response (5 fields)
	ResponseStatus  *int    `gorm:"column:response_status" json:"response_status,omitempty"`
	ResponseHeaders JSONB   `gorm:"column:response_headers;type:jsonb" json:"response_headers,omitempty"`
	ResponseBody    *string `gorm:"column:response_body;type:text" json:"response_body,omitempty"`
	ResponseSize    *int    `gorm:"column:response_size" json:"response_size,omitempty"`
	ResponseTime    int     `gorm:"column:response_time" json:"response_time"` // Milliseconds

	// Timing (3 fields)
	StartedAt   time.Time  `gorm:"column:started_at;not null" json:"started_at"`
	CompletedAt time.Time  `gorm:"column:completed_at;not null" json:"completed_at"`
	Duration    int        `gorm:"column:duration" json:"duration"` // Milliseconds

	// Network (2 fields)
	RemoteIP   *string `gorm:"column:remote_ip;type:varchar(50)" json:"remote_ip,omitempty"`
	DNSLookup  *int    `gorm:"column:dns_lookup" json:"dns_lookup,omitempty"` // Milliseconds

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relationship
	Delivery *WebhookDelivery `gorm:"foreignKey:DeliveryID" json:"delivery,omitempty"`
}

func (DeliveryAttempt) TableName() string {
	return "delivery_attempts"
}

// ============================================================================
// DELIVERY LOG - Consolidated Delivery Logs
// ============================================================================

type DeliveryLog struct {
	// Identity (4 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	DeliveryID uuid.UUID  `gorm:"column:delivery_id;type:uuid;not null;index" json:"delivery_id"`
	EndpointID uuid.UUID  `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Log Info (5 fields)
	EventType   string         `gorm:"column:event_type;type:varchar(100);not null;index" json:"event_type"`
	Status      DeliveryStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Message     string         `gorm:"column:message;type:text;not null" json:"message"`
	Level       string         `gorm:"column:level;type:varchar(20);default:'INFO'" json:"level"` // INFO, WARN, ERROR
	AttemptNumber int          `gorm:"column:attempt_number" json:"attempt_number"`

	// Response (2 fields)
	ResponseStatus *int    `gorm:"column:response_status" json:"response_status,omitempty"`
	ResponseTime   *int    `gorm:"column:response_time" json:"response_time,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`

	// Relationships
	Delivery *WebhookDelivery `gorm:"foreignKey:DeliveryID" json:"delivery,omitempty"`
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
}

func (DeliveryLog) TableName() string {
	return "delivery_logs"
}

// ============================================================================
// DELIVERY BATCH - Batch Deliveries
// ============================================================================

type BatchStatus string

const (
	BatchStatusPending    BatchStatus = "PENDING"
	BatchStatusProcessing BatchStatus = "PROCESSING"
	BatchStatusCompleted  BatchStatus = "COMPLETED"
	BatchStatusPartial    BatchStatus = "PARTIAL"
	BatchStatusFailed     BatchStatus = "FAILED"
)

type DeliveryBatch struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	EndpointID uuid.UUID `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`

	// Batch Info (4 fields)
	Status      BatchStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	EventType   string      `gorm:"column:event_type;type:varchar(100);not null" json:"event_type"`
	BatchSize   int         `gorm:"column:batch_size;not null" json:"batch_size"`
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`

	// Payload IDs (1 field)
	PayloadIDs JSONB `gorm:"column:payload_ids;type:jsonb;not null" json:"payload_ids"`

	// Statistics (3 fields)
	SuccessCount int `gorm:"column:success_count;default:0" json:"success_count"`
	FailedCount  int `gorm:"column:failed_count;default:0" json:"failed_count"`
	TotalCount   int `gorm:"column:total_count;not null" json:"total_count"`

	// Timing (4 fields)
	ScheduledAt time.Time  `gorm:"column:scheduled_at;not null" json:"scheduled_at"`
	StartedAt   *time.Time `gorm:"column:started_at" json:"started_at,omitempty"`
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	Duration    *int       `gorm:"column:duration" json:"duration,omitempty"` // Seconds

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
}

func (DeliveryBatch) TableName() string {
	return "delivery_batches"
}

func (b *DeliveryBatch) GetSuccessRate() float64 {
	if b.TotalCount == 0 {
		return 0
	}
	return (float64(b.SuccessCount) / float64(b.TotalCount)) * 100
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateDelivery creates a delivery record
func CreateDelivery(
	db *gorm.DB,
	payloadID, endpointID uuid.UUID,
	url string,
	maxAttempts int,
	tenantID *uuid.UUID,
) (*WebhookDelivery, error) {
	delivery := &WebhookDelivery{
		PayloadID:     payloadID,
		EndpointID:    endpointID,
		TenantID:      tenantID,
		Status:        DeliveryStatusPending,
		AttemptNumber: 1,
		MaxAttempts:   maxAttempts,
		RequestURL:    url,
		RequestMethod: "POST",
		ScheduledAt:   time.Now(),
	}

	if err := db.Create(delivery).Error; err != nil {
		return nil, err
	}

	return delivery, nil
}

// RecordAttempt records a delivery attempt
func RecordAttempt(
	db *gorm.DB,
	deliveryID uuid.UUID,
	attemptNumber int,
	result AttemptResult,
	responseStatus *int,
	responseBody *string,
	responseTime int,
	errorMsg *string,
) error {
	attempt := &DeliveryAttempt{
		DeliveryID:     deliveryID,
		AttemptNumber:  attemptNumber,
		Result:         result,
		ResponseStatus: responseStatus,
		ResponseBody:   responseBody,
		ResponseTime:   responseTime,
		ErrorMessage:   errorMsg,
		StartedAt:      time.Now(),
		CompletedAt:    time.Now().Add(time.Duration(responseTime) * time.Millisecond),
		Duration:       responseTime,
	}

	return db.Create(attempt).Error
}

// ProcessDelivery processes a webhook delivery
func ProcessDelivery(db *gorm.DB, deliveryID uuid.UUID) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var delivery WebhookDelivery
		if err := tx.Preload("Payload").Preload("Endpoint").
			First(&delivery, deliveryID).Error; err != nil {
			return err
		}

		// Mark as sending
		now := time.Now()
		delivery.Status = DeliveryStatusSending
		delivery.StartedAt = &now
		tx.Save(&delivery)

		// Here you would actually send the HTTP request
		// For now, we'll simulate it
		success := simulateHTTPRequest(&delivery)

		if success {
			// Record success
			delivery.MarkSuccess(200, "OK", 150)
			
			// Update endpoint stats
			delivery.Endpoint.RecordSuccess()
			tx.Save(delivery.Endpoint)
			
			// Update payload stats
			delivery.Payload.SuccessfulDeliveries++
			if delivery.Payload.SuccessfulDeliveries >= delivery.Payload.DeliveryCount {
				delivery.Payload.MarkCompleted()
			}
			tx.Save(delivery.Payload)
			
		} else {
			// Record failure
			delivery.MarkFailed("HTTP request failed")
			delivery.AttemptNumber++
			
			// Update endpoint stats
			delivery.Endpoint.RecordFailure()
			tx.Save(delivery.Endpoint)
			
			// Update payload stats
			delivery.Payload.FailedDeliveries++
			tx.Save(delivery.Payload)
		}

		return tx.Save(&delivery).Error
	})
}

// RetryFailedDeliveries retries failed deliveries
func RetryFailedDeliveries(db *gorm.DB) error {
	var deliveries []WebhookDelivery
	
	err := db.Where(
		"status = ? AND next_retry_at IS NOT NULL AND next_retry_at <= ?",
		DeliveryStatusRetrying, time.Now(),
	).Find(&deliveries).Error

	if err != nil {
		return err
	}

	for _, delivery := range deliveries {
		if err := ProcessDelivery(db, delivery.ID); err != nil {
			fmt.Printf("Error retrying delivery %s: %v\n", delivery.ID, err)
		}
	}

	return nil
}

// GetDeliveryStats gets delivery statistics
func GetDeliveryStats(
	db *gorm.DB,
	endpointID *uuid.UUID,
	startDate, endDate time.Time,
) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := db.Model(&WebhookDelivery{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate)

	if endpointID != nil {
		query = query.Where("endpoint_id = ?", endpointID)
	}

	// Total deliveries
	var totalCount int64
	query.Count(&totalCount)
	stats["total_deliveries"] = totalCount

	// By status
	var statusStats []struct {
		Status DeliveryStatus
		Count  int64
	}
	db.Model(&WebhookDelivery{}).
		Select("status, count(*) as count").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("status").
		Scan(&statusStats)
	stats["by_status"] = statusStats

	// Success rate
	var successCount int64
	query.Where("status = ?", DeliveryStatusSuccess).Count(&successCount)
	successRate := 0.0
	if totalCount > 0 {
		successRate = (float64(successCount) / float64(totalCount)) * 100
	}
	stats["success_rate"] = successRate

	// Average response time
	var avgResponseTime float64
	db.Model(&WebhookDelivery{}).
		Select("AVG(response_time)").
		Where("created_at BETWEEN ? AND ? AND response_time IS NOT NULL",
			startDate, endDate).
		Scan(&avgResponseTime)
	stats["avg_response_time"] = avgResponseTime

	return stats, nil
}

// GetPendingDeliveries gets deliveries pending processing
func GetPendingDeliveries(db *gorm.DB, limit int) ([]WebhookDelivery, error) {
	var deliveries []WebhookDelivery
	
	err := db.Where("status = ? AND scheduled_at <= ?", 
		DeliveryStatusPending, time.Now()).
		Preload("Payload").
		Preload("Endpoint").
		Order("scheduled_at ASC").
		Limit(limit).
		Find(&deliveries).Error

	return deliveries, err
}

// GetRecentDeliveries gets recent deliveries
func GetRecentDeliveries(
	db *gorm.DB,
	endpointID *uuid.UUID,
	limit int,
) ([]WebhookDelivery, error) {
	query := db.Preload("Payload").Preload("Endpoint")

	if endpointID != nil {
		query = query.Where("endpoint_id = ?", endpointID)
	}

	var deliveries []WebhookDelivery
	err := query.Order("created_at DESC").Limit(limit).Find(&deliveries).Error

	return deliveries, err
}

// CreateDeliveryLog creates a delivery log entry
func CreateDeliveryLog(
	db *gorm.DB,
	deliveryID, endpointID uuid.UUID,
	eventType string,
	status DeliveryStatus,
	message string,
	level string,
	attemptNumber int,
) error {
	log := &DeliveryLog{
		DeliveryID:    deliveryID,
		EndpointID:    endpointID,
		EventType:     eventType,
		Status:        status,
		Message:       message,
		Level:         level,
		AttemptNumber: attemptNumber,
	}

	return db.Create(log).Error
}

// CleanupOldDeliveries removes old delivery records
func CleanupOldDeliveries(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	
	// Delete old successful deliveries
	return db.Where("status = ? AND completed_at < ?", 
		DeliveryStatusSuccess, cutoff).
		Delete(&WebhookDelivery{}).Error
}

// CleanupOldLogs removes old delivery logs
func CleanupOldLogs(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("created_at < ?", cutoff).
		Delete(&DeliveryLog{}).Error
}

// GetDeliveryTimeline gets delivery timeline
func GetDeliveryTimeline(db *gorm.DB, deliveryID uuid.UUID) ([]map[string]interface{}, error) {
	var attempts []DeliveryAttempt
	err := db.Where("delivery_id = ?", deliveryID).
		Order("attempt_number ASC").
		Find(&attempts).Error

	if err != nil {
		return nil, err
	}

	timeline := make([]map[string]interface{}, len(attempts))
	for i, attempt := range attempts {
		timeline[i] = map[string]interface{}{
			"attempt":       attempt.AttemptNumber,
			"result":        attempt.Result,
			"status":        attempt.ResponseStatus,
			"response_time": attempt.ResponseTime,
			"started_at":    attempt.StartedAt,
			"completed_at":  attempt.CompletedAt,
			"error":         attempt.ErrorMessage,
		}
	}

	return timeline, nil
}

func simulateHTTPRequest(delivery *WebhookDelivery) bool {
	// Simulate success 80% of the time
	return time.Now().Unix()%5 != 0
}

// ProcessDeliveryQueue processes the delivery queue
func ProcessDeliveryQueue(db *gorm.DB, batchSize int) error {
	deliveries, err := GetPendingDeliveries(db, batchSize)
	if err != nil {
		return err
	}

	fmt.Printf("Processing %d deliveries\n", len(deliveries))

	for _, delivery := range deliveries {
		if err := ProcessDelivery(db, delivery.ID); err != nil {
			fmt.Printf("Error processing delivery %s: %v\n", delivery.ID, err)
		}
	}

	return nil
}
