package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// NOTIFICATION DELIVERY - Delivery Tracking
// ============================================================================
// Purpose: Track notification delivery across channels
// Table: notification_deliveries
// Primary Key: _id (UUID)
// Features: Multi-channel delivery, Retry logic, Status tracking
// ============================================================================

type DeliveryChannel string

const (
	DeliveryChannelInApp  DeliveryChannel = "IN_APP"
	DeliveryChannelEmail  DeliveryChannel = "EMAIL"
	DeliveryChannelSMS    DeliveryChannel = "SMS"
	DeliveryChannelPush   DeliveryChannel = "PUSH"
	DeliveryChannelWebhook DeliveryChannel = "WEBHOOK"
)

type DeliveryStatus string

const (
	DeliveryStatusPending   DeliveryStatus = "PENDING"
	DeliveryStatusProcessing DeliveryStatus = "PROCESSING"
	DeliveryStatusSent      DeliveryStatus = "SENT"
	DeliveryStatusDelivered DeliveryStatus = "DELIVERED"
	DeliveryStatusFailed    DeliveryStatus = "FAILED"
	DeliveryStatusBounced   DeliveryStatus = "BOUNCED"
	DeliveryStatusRejected  DeliveryStatus = "REJECTED"
)

type NotificationDelivery struct {
	// ========== Identity (3 fields) ==========
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	NotificationID uuid.UUID `gorm:"column:notification_id;type:uuid;not null;index" json:"notification_id"`
	UserID         *uuid.UUID `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`

	// ========== Delivery Info (5 fields) ==========
	Channel        DeliveryChannel `gorm:"column:channel;type:varchar(20);not null;index" json:"channel"`
	Status         DeliveryStatus  `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Recipient      string          `gorm:"column:recipient;type:varchar(255);not null" json:"recipient"`
	Subject        *string         `gorm:"column:subject;type:varchar(255)" json:"subject,omitempty"`
	Content        string          `gorm:"column:content;type:text;not null" json:"content"`

	// ========== Provider (3 fields) ==========
	Provider       *string `gorm:"column:provider;type:varchar(50)" json:"provider,omitempty"` // SendGrid, Twilio, etc.
	ProviderID     *string `gorm:"column:provider_id;type:varchar(255)" json:"provider_id,omitempty"`
	ProviderStatus *string `gorm:"column:provider_status;type:varchar(50)" json:"provider_status,omitempty"`

	// ========== Response (4 fields) ==========
	StatusCode    *int    `gorm:"column:status_code" json:"status_code,omitempty"`
	ResponseBody  *string `gorm:"column:response_body;type:text" json:"response_body,omitempty"`
	ErrorMessage  *string `gorm:"column:error_message;type:text" json:"error_message,omitempty"`
	ErrorCode     *string `gorm:"column:error_code;type:varchar(50)" json:"error_code,omitempty"`

	// ========== Retry (3 fields) ==========
	AttemptNumber int        `gorm:"column:attempt_number;default:1" json:"attempt_number"`
	MaxAttempts   int        `gorm:"column:max_attempts;default:3" json:"max_attempts"`
	NextRetryAt   *time.Time `gorm:"column:next_retry_at" json:"next_retry_at,omitempty"`

	// ========== Timing (4 fields) ==========
	ScheduledAt time.Time  `gorm:"column:scheduled_at;not null" json:"scheduled_at"`
	SentAt      *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`
	DeliveredAt *time.Time `gorm:"column:delivered_at" json:"delivered_at,omitempty"`
	FailedAt    *time.Time `gorm:"column:failed_at" json:"failed_at,omitempty"`

	// ========== Engagement (3 fields) ==========
	OpenedAt  *time.Time `gorm:"column:opened_at" json:"opened_at,omitempty"`
	ClickedAt *time.Time `gorm:"column:clicked_at" json:"clicked_at,omitempty"`
	RepliedAt *time.Time `gorm:"column:replied_at" json:"replied_at,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (2 fields) ==========
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Notification *Notification `gorm:"foreignKey:NotificationID" json:"notification,omitempty"`
}

func (NotificationDelivery) TableName() string {
	return "notification_deliveries"
}

// Helper Methods
func (d *NotificationDelivery) MarkSent() {
	now := time.Now()
	d.Status = DeliveryStatusSent
	d.SentAt = &now
}

func (d *NotificationDelivery) MarkDelivered() {
	now := time.Now()
	d.Status = DeliveryStatusDelivered
	d.DeliveredAt = &now
}

func (d *NotificationDelivery) MarkFailed(errorMsg string) {
	now := time.Now()
	d.Status = DeliveryStatusFailed
	d.ErrorMessage = &errorMsg
	d.FailedAt = &now

	// Calculate next retry
	if d.AttemptNumber < d.MaxAttempts {
		nextRetry := d.calculateNextRetry()
		d.NextRetryAt = &nextRetry
	}
}

func (d *NotificationDelivery) calculateNextRetry() time.Time {
	// Exponential backoff: 5min, 30min, 2hours
	delays := []int{300, 1800, 7200}
	delayIndex := d.AttemptNumber - 1
	if delayIndex >= len(delays) {
		delayIndex = len(delays) - 1
	}
	return time.Now().Add(time.Duration(delays[delayIndex]) * time.Second)
}

func (d *NotificationDelivery) CanRetry() bool {
	return d.AttemptNumber < d.MaxAttempts && d.Status == DeliveryStatusFailed
}

// ============================================================================
// NOTIFICATION SCHEDULE - Scheduled Notifications
// ============================================================================

type ScheduleStatus string

const (
	ScheduleStatusActive    ScheduleStatus = "ACTIVE"
	ScheduleStatusPaused    ScheduleStatus = "PAUSED"
	ScheduleStatusCompleted ScheduleStatus = "COMPLETED"
	ScheduleStatusCanceled  ScheduleStatus = "CANCELED"
)

type ScheduleFrequency string

const (
	ScheduleFrequencyOnce    ScheduleFrequency = "ONCE"
	ScheduleFrequencyDaily   ScheduleFrequency = "DAILY"
	ScheduleFrequencyWeekly  ScheduleFrequency = "WEEKLY"
	ScheduleFrequencyMonthly ScheduleFrequency = "MONTHLY"
	ScheduleFrequencyCustom  ScheduleFrequency = "CUSTOM"
)

type NotificationSchedule struct {
	// Identity (3 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	TemplateID uuid.UUID  `gorm:"column:template_id;type:uuid;not null;index" json:"template_id"`

	// Schedule Info (5 fields)
	Name        string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	Status      ScheduleStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Frequency   ScheduleFrequency `gorm:"column:frequency;type:varchar(20);not null" json:"frequency"`
	Timezone    string         `gorm:"column:timezone;type:varchar(50);default:'UTC'" json:"timezone"`

	// Schedule Timing (5 fields)
	StartDate   time.Time  `gorm:"column:start_date;not null" json:"start_date"`
	EndDate     *time.Time `gorm:"column:end_date" json:"end_date,omitempty"`
	NextRunAt   *time.Time `gorm:"column:next_run_at;index" json:"next_run_at,omitempty"`
	LastRunAt   *time.Time `gorm:"column:last_run_at" json:"last_run_at,omitempty"`
	CronPattern *string    `gorm:"column:cron_pattern;type:varchar(100)" json:"cron_pattern,omitempty"`

	// Recipients (2 fields)
	RecipientType string `gorm:"column:recipient_type;type:varchar(20);not null" json:"recipient_type"` // ALL, SEGMENT, LIST
	Recipients    JSONB  `gorm:"column:recipients;type:jsonb" json:"recipients,omitempty"` // User IDs or segment criteria

	// Template Data (1 field)
	DefaultData JSONB `gorm:"column:default_data;type:jsonb" json:"default_data,omitempty"`

	// Statistics (3 fields)
	RunCount      int64 `gorm:"column:run_count;default:0" json:"run_count"`
	SuccessCount  int64 `gorm:"column:success_count;default:0" json:"success_count"`
	FailureCount  int64 `gorm:"column:failure_count;default:0" json:"failure_count"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Template *NotificationTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

func (NotificationSchedule) TableName() string {
	return "notification_schedules"
}

func (s *NotificationSchedule) CalculateNextRun() time.Time {
	if s.LastRunAt == nil {
		return s.StartDate
	}

	lastRun := *s.LastRunAt

	switch s.Frequency {
	case ScheduleFrequencyDaily:
		return lastRun.AddDate(0, 0, 1)
	case ScheduleFrequencyWeekly:
		return lastRun.AddDate(0, 0, 7)
	case ScheduleFrequencyMonthly:
		return lastRun.AddDate(0, 1, 0)
	default:
		return lastRun.AddDate(0, 0, 1)
	}
}

func (s *NotificationSchedule) IsActive() bool {
	return s.Status == ScheduleStatusActive
}

func (s *NotificationSchedule) ShouldRun() bool {
	if !s.IsActive() {
		return false
	}

	if s.NextRunAt == nil {
		return false
	}

	if time.Now().Before(*s.NextRunAt) {
		return false
	}

	if s.EndDate != nil && time.Now().After(*s.EndDate) {
		return false
	}

	return true
}

// ============================================================================
// NOTIFICATION BATCH - Batch Notifications
// ============================================================================

type BatchStatus string

const (
	BatchStatusPending    BatchStatus = "PENDING"
	BatchStatusProcessing BatchStatus = "PROCESSING"
	BatchStatusCompleted  BatchStatus = "COMPLETED"
	BatchStatusPartial    BatchStatus = "PARTIAL"
	BatchStatusFailed     BatchStatus = "FAILED"
)

type NotificationBatch struct {
	// Identity (2 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Batch Info (5 fields)
	Name        string      `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`
	Status      BatchStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	TemplateID  *uuid.UUID  `gorm:"column:template_id;type:uuid;index" json:"template_id,omitempty"`
	BatchType   string      `gorm:"column:batch_type;type:varchar(20);not null" json:"batch_type"` // CAMPAIGN, ANNOUNCEMENT, etc.

	// Recipients (2 fields)
	RecipientCount int   `gorm:"column:recipient_count;not null" json:"recipient_count"`
	Recipients     JSONB `gorm:"column:recipients;type:jsonb;not null" json:"recipients"`

	// Statistics (5 fields)
	ProcessedCount int64 `gorm:"column:processed_count;default:0" json:"processed_count"`
	SuccessCount   int64 `gorm:"column:success_count;default:0" json:"success_count"`
	FailedCount    int64 `gorm:"column:failed_count;default:0" json:"failed_count"`
	ReadCount      int64 `gorm:"column:read_count;default:0" json:"read_count"`
	ClickCount     int64 `gorm:"column:click_count;default:0" json:"click_count"`

	// Timing (4 fields)
	ScheduledAt time.Time  `gorm:"column:scheduled_at;not null" json:"scheduled_at"`
	StartedAt   *time.Time `gorm:"column:started_at" json:"started_at,omitempty"`
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	Duration    *int       `gorm:"column:duration" json:"duration,omitempty"` // Seconds

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Template *NotificationTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

func (NotificationBatch) TableName() string {
	return "notification_batches"
}

func (b *NotificationBatch) GetSuccessRate() float64 {
	if b.ProcessedCount == 0 {
		return 0
	}
	return (float64(b.SuccessCount) / float64(b.ProcessedCount)) * 100
}

func (b *NotificationBatch) GetReadRate() float64 {
	if b.SuccessCount == 0 {
		return 0
	}
	return (float64(b.ReadCount) / float64(b.SuccessCount)) * 100
}

func (b *NotificationBatch) GetClickRate() float64 {
	if b.ReadCount == 0 {
		return 0
	}
	return (float64(b.ClickCount) / float64(b.ReadCount)) * 100
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateDelivery creates a delivery record
func CreateDelivery(
	db *gorm.DB,
	notificationID uuid.UUID,
	channel DeliveryChannel,
	recipient string,
	content string,
	userID *uuid.UUID,
) (*NotificationDelivery, error) {
	delivery := &NotificationDelivery{
		NotificationID: notificationID,
		UserID:         userID,
		Channel:        channel,
		Status:         DeliveryStatusPending,
		Recipient:      recipient,
		Content:        content,
		ScheduledAt:    time.Now(),
		MaxAttempts:    3,
	}

	if err := db.Create(delivery).Error; err != nil {
		return nil, err
	}

	return delivery, nil
}

// ProcessDelivery processes a notification delivery
func ProcessDelivery(db *gorm.DB, deliveryID uuid.UUID) error {
	var delivery NotificationDelivery
	if err := db.First(&delivery, deliveryID).Error; err != nil {
		return err
	}

	// Mark as processing
	delivery.Status = DeliveryStatusProcessing
	db.Save(&delivery)

	// Simulate delivery
	success := simulateDelivery(delivery.Channel)

	if success {
		delivery.MarkDelivered()
	} else {
		delivery.MarkFailed("Delivery failed")
		delivery.AttemptNumber++
	}

	return db.Save(&delivery).Error
}

func simulateDelivery(channel DeliveryChannel) bool {
	// Simulate 95% success rate
	return time.Now().Unix()%20 != 0
}

// RetryFailedDeliveries retries failed deliveries
func RetryFailedDeliveries(db *gorm.DB) error {
	var deliveries []NotificationDelivery

	err := db.Where(
		"status = ? AND next_retry_at IS NOT NULL AND next_retry_at <= ?",
		DeliveryStatusFailed, time.Now(),
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

// ProcessScheduledNotifications processes scheduled notifications
func ProcessScheduledNotifications(db *gorm.DB) error {
	var schedules []NotificationSchedule

	err := db.Where("status = ? AND next_run_at IS NOT NULL AND next_run_at <= ?",
		ScheduleStatusActive, time.Now()).
		Preload("Template").
		Find(&schedules).Error

	if err != nil {
		return err
	}

	for _, schedule := range schedules {
		if !schedule.ShouldRun() {
			continue
		}

		// Process schedule
		if err := processSchedule(db, &schedule); err != nil {
			fmt.Printf("Error processing schedule %s: %v\n", schedule.ID, err)
			schedule.FailureCount++
		} else {
			schedule.SuccessCount++
		}

		// Update schedule
		now := time.Now()
		schedule.LastRunAt = &now
		schedule.RunCount++

		nextRun := schedule.CalculateNextRun()
		schedule.NextRunAt = &nextRun

		// Check if completed
		if schedule.Frequency == ScheduleFrequencyOnce ||
			(schedule.EndDate != nil && nextRun.After(*schedule.EndDate)) {
			schedule.Status = ScheduleStatusCompleted
		}

		db.Save(&schedule)
	}

	return nil
}

func processSchedule(db *gorm.DB, schedule *NotificationSchedule) error {
	// Get recipients
	recipients, ok := schedule.Recipients["user_ids"].([]interface{})
	if !ok {
		return fmt.Errorf("invalid recipients format")
	}

	// Create notifications for each recipient
	for _, recipientInterface := range recipients {
		recipientStr, ok := recipientInterface.(string)
		if !ok {
			continue
		}

		recipientID, err := uuid.Parse(recipientStr)
		if err != nil {
			continue
		}

		// Create notification from template
		data := make(map[string]interface{})
		if schedule.DefaultData != nil {
			data = schedule.DefaultData
		}

		CreateFromTemplate(
			db,
			schedule.Template.Code,
			recipientID,
			data,
			schedule.CreatedBy,
		)
	}

	return nil
}

// ProcessBatch processes a notification batch
func ProcessBatch(db *gorm.DB, batchID uuid.UUID) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var batch NotificationBatch
		if err := tx.Preload("Template").First(&batch, batchID).Error; err != nil {
			return err
		}

		// Mark as processing
		now := time.Now()
		batch.Status = BatchStatusProcessing
		batch.StartedAt = &now
		tx.Save(&batch)

		// Get recipients
		recipients, ok := batch.Recipients["user_ids"].([]interface{})
		if !ok {
			return fmt.Errorf("invalid recipients format")
		}

		// Process each recipient
		successCount := int64(0)
		failedCount := int64(0)

		for _, recipientInterface := range recipients {
			recipientStr, ok := recipientInterface.(string)
			if !ok {
				failedCount++
				continue
			}

			recipientID, err := uuid.Parse(recipientStr)
			if err != nil {
				failedCount++
				continue
			}

			// Create notification
			data := make(map[string]interface{})
			if batch.Metadata != nil {
				if batchData, ok := batch.Metadata["data"].(map[string]interface{}); ok {
					data = batchData
				}
			}

			_, err = CreateFromTemplate(
				tx,
				batch.Template.Code,
				recipientID,
				data,
				batch.CreatedBy,
			)

			if err != nil {
				failedCount++
			} else {
				successCount++
			}
		}

		// Update batch
		batch.ProcessedCount = int64(len(recipients))
		batch.SuccessCount = successCount
		batch.FailedCount = failedCount

		completedAt := time.Now()
		batch.CompletedAt = &completedAt
		duration := int(completedAt.Sub(*batch.StartedAt).Seconds())
		batch.Duration = &duration

		if failedCount == 0 {
			batch.Status = BatchStatusCompleted
		} else if successCount == 0 {
			batch.Status = BatchStatusFailed
		} else {
			batch.Status = BatchStatusPartial
		}

		return tx.Save(&batch).Error
	})
}

// GetDeliveryStats gets delivery statistics
func GetDeliveryStats(
	db *gorm.DB,
	startDate, endDate time.Time,
	channel *DeliveryChannel,
) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := db.Model(&NotificationDelivery{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate)

	if channel != nil {
		query = query.Where("channel = ?", channel)
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
	db.Model(&NotificationDelivery{}).
		Select("status, count(*) as count").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("status").
		Scan(&statusStats)
	stats["by_status"] = statusStats

	// By channel
	var channelStats []struct {
		Channel DeliveryChannel
		Count   int64
	}
	db.Model(&NotificationDelivery{}).
		Select("channel, count(*) as count").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("channel").
		Scan(&channelStats)
	stats["by_channel"] = channelStats

	// Success rate
	var successCount int64
	query.Where("status = ?", DeliveryStatusDelivered).Count(&successCount)
	successRate := 0.0
	if totalCount > 0 {
		successRate = (float64(successCount) / float64(totalCount)) * 100
	}
	stats["success_rate"] = successRate

	return stats, nil
}

// CleanupOldDeliveries removes old delivery records
func CleanupOldDeliveries(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("created_at < ?", cutoff).
		Delete(&NotificationDelivery{}).Error
}
