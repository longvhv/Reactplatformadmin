package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// NOTIFICATION ENGAGEMENT - User Engagement Tracking
// ============================================================================
// Purpose: Track user engagement with notifications
// Table: notification_engagements
// Primary Key: _id (UUID)
// Features: Click tracking, Action tracking, Time spent
// ============================================================================

type EngagementType string

const (
	EngagementTypeView     EngagementType = "VIEW"
	EngagementTypeRead     EngagementType = "READ"
	EngagementTypeClick    EngagementType = "CLICK"
	EngagementTypeAction   EngagementType = "ACTION"
	EngagementTypeDismiss  EngagementType = "DISMISS"
	EngagementTypeShare    EngagementType = "SHARE"
)

type NotificationEngagement struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	NotificationID uuid.UUID `gorm:"column:notification_id;type:uuid;not null;index" json:"notification_id"`
	UserID         uuid.UUID `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Engagement Info (4 fields)
	Type        EngagementType `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Action      *string        `gorm:"column:action;type:varchar(100)" json:"action,omitempty"` // button_click, link_click
	Target      *string        `gorm:"column:target;type:varchar(255)" json:"target,omitempty"` // URL or action ID
	Value       *string        `gorm:"column:value;type:text" json:"value,omitempty"`

	// Device Info (4 fields)
	DeviceType *string `gorm:"column:device_type;type:varchar(50)" json:"device_type,omitempty"` // mobile, desktop, tablet
	Platform   *string `gorm:"column:platform;type:varchar(50)" json:"platform,omitempty"`   // ios, android, web
	Browser    *string `gorm:"column:browser;type:varchar(50)" json:"browser,omitempty"`
	IPAddress  *string `gorm:"column:ip_address;type:varchar(50)" json:"ip_address,omitempty"`

	// Timing (2 fields)
	TimeSpent *int       `gorm:"column:time_spent" json:"time_spent,omitempty"` // Seconds
	EngagedAt time.Time  `gorm:"column:engaged_at;not null;index" json:"engaged_at"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relationships
	Notification *Notification `gorm:"foreignKey:NotificationID" json:"notification,omitempty"`
}

func (NotificationEngagement) TableName() string {
	return "notification_engagements"
}

// ============================================================================
// NOTIFICATION ANALYTICS - Analytics & Metrics
// ============================================================================

type AnalyticsInterval string

const (
	AnalyticsIntervalHour  AnalyticsInterval = "HOUR"
	AnalyticsIntervalDay   AnalyticsInterval = "DAY"
	AnalyticsIntervalWeek  AnalyticsInterval = "WEEK"
	AnalyticsIntervalMonth AnalyticsInterval = "MONTH"
)

type NotificationAnalytics struct {
	// Identity (3 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`

	// Time Bucket (3 fields)
	Interval    AnalyticsInterval `gorm:"column:interval;type:varchar(20);not null;index" json:"interval"`
	BucketStart time.Time         `gorm:"column:bucket_start;not null;index" json:"bucket_start"`
	BucketEnd   time.Time         `gorm:"column:bucket_end;not null" json:"bucket_end"`

	// Notification Metrics (5 fields)
	TotalSent      int64 `gorm:"column:total_sent;default:0" json:"total_sent"`
	TotalDelivered int64 `gorm:"column:total_delivered;default:0" json:"total_delivered"`
	TotalFailed    int64 `gorm:"column:total_failed;default:0" json:"total_failed"`
	TotalRead      int64 `gorm:"column:total_read;default:0" json:"total_read"`
	TotalClicked   int64 `gorm:"column:total_clicked;default:0" json:"total_clicked"`

	// Channel Breakdown (4 fields)
	EmailSent  int64 `gorm:"column:email_sent;default:0" json:"email_sent"`
	SMSSent    int64 `gorm:"column:sms_sent;default:0" json:"sms_sent"`
	PushSent   int64 `gorm:"column:push_sent;default:0" json:"push_sent"`
	InAppSent  int64 `gorm:"column:in_app_sent;default:0" json:"in_app_sent"`

	// Engagement Rates (3 fields)
	DeliveryRate float64 `gorm:"column:delivery_rate;type:decimal(5,2)" json:"delivery_rate"` // %
	ReadRate     float64 `gorm:"column:read_rate;type:decimal(5,2)" json:"read_rate"`     // %
	ClickRate    float64 `gorm:"column:click_rate;type:decimal(5,2)" json:"click_rate"`    // %

	// User Metrics (2 fields)
	UniqueUsers    int64 `gorm:"column:unique_users;default:0" json:"unique_users"`
	ActiveUsers    int64 `gorm:"column:active_users;default:0" json:"active_users"` // Users who engaged

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (NotificationAnalytics) TableName() string {
	return "notification_analytics"
}

func (a *NotificationAnalytics) CalculateRates() {
	if a.TotalSent > 0 {
		a.DeliveryRate = (float64(a.TotalDelivered) / float64(a.TotalSent)) * 100
	}
	
	if a.TotalDelivered > 0 {
		a.ReadRate = (float64(a.TotalRead) / float64(a.TotalDelivered)) * 100
	}
	
	if a.TotalRead > 0 {
		a.ClickRate = (float64(a.TotalClicked) / float64(a.TotalRead)) * 100
	}
}

// ============================================================================
// NOTIFICATION REPORT - Periodic Reports
// ============================================================================

type ReportType string

const (
	ReportTypeDaily   ReportType = "DAILY"
	ReportTypeWeekly  ReportType = "WEEKLY"
	ReportTypeMonthly ReportType = "MONTHLY"
	ReportTypeCustom  ReportType = "CUSTOM"
)

type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "PENDING"
	ReportStatusGenerating ReportStatus = "GENERATING"
	ReportStatusCompleted ReportStatus = "COMPLETED"
	ReportStatusFailed    ReportStatus = "FAILED"
)

type NotificationReport struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Report Info (5 fields)
	ReportNumber string       `gorm:"column:report_number;type:varchar(50);uniqueIndex;not null" json:"report_number"`
	Type         ReportType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status       ReportStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title        string       `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Description  *string      `gorm:"column:description;type:text" json:"description,omitempty"`

	// Period (2 fields)
	PeriodStart time.Time `gorm:"column:period_start;not null;index" json:"period_start"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null;index" json:"period_end"`

	// Summary Statistics (10 fields)
	TotalNotifications int64   `gorm:"column:total_notifications;default:0" json:"total_notifications"`
	TotalSent          int64   `gorm:"column:total_sent;default:0" json:"total_sent"`
	TotalDelivered     int64   `gorm:"column:total_delivered;default:0" json:"total_delivered"`
	TotalRead          int64   `gorm:"column:total_read;default:0" json:"total_read"`
	TotalClicked       int64   `gorm:"column:total_clicked;default:0" json:"total_clicked"`
	DeliveryRate       float64 `gorm:"column:delivery_rate;type:decimal(5,2)" json:"delivery_rate"`
	ReadRate           float64 `gorm:"column:read_rate;type:decimal(5,2)" json:"read_rate"`
	ClickRate          float64 `gorm:"column:click_rate;type:decimal(5,2)" json:"click_rate"`
	UniqueRecipients   int64   `gorm:"column:unique_recipients;default:0" json:"unique_recipients"`
	ActiveRecipients   int64   `gorm:"column:active_recipients;default:0" json:"active_recipients"`

	// Top Performers (3 fields)
	TopCategories JSONB `gorm:"column:top_categories;type:jsonb" json:"top_categories,omitempty"`
	TopTemplates  JSONB `gorm:"column:top_templates;type:jsonb" json:"top_templates,omitempty"`
	TopChannels   JSONB `gorm:"column:top_channels;type:jsonb" json:"top_channels,omitempty"`

	// Insights (2 fields)
	Insights        JSONB `gorm:"column:insights;type:jsonb" json:"insights,omitempty"`
	Recommendations JSONB `gorm:"column:recommendations;type:jsonb" json:"recommendations,omitempty"`

	// Generation (4 fields)
	GeneratedAt    *time.Time `gorm:"column:generated_at" json:"generated_at,omitempty"`
	GeneratedBy    *uuid.UUID `gorm:"column:generated_by;type:uuid" json:"generated_by,omitempty"`
	GenerationTime *int       `gorm:"column:generation_time" json:"generation_time,omitempty"` // Seconds
	ErrorMessage   *string    `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Export (2 fields)
	FileURL  *string `gorm:"column:file_url;type:text" json:"file_url,omitempty"`
	FileSize *int64  `gorm:"column:file_size" json:"file_size,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (NotificationReport) TableName() string {
	return "notification_reports"
}

func (r *NotificationReport) GetEngagementRate() float64 {
	if r.TotalDelivered == 0 {
		return 0
	}
	engaged := r.TotalRead + r.TotalClicked
	return (float64(engaged) / float64(r.TotalDelivered)) * 100
}

// ============================================================================
// Helper Functions
// ============================================================================

// TrackEngagement tracks user engagement
func TrackEngagement(
	db *gorm.DB,
	notificationID, userID uuid.UUID,
	engagementType EngagementType,
	action, target *string,
) error {
	engagement := &NotificationEngagement{
		NotificationID: notificationID,
		UserID:         userID,
		Type:           engagementType,
		Action:         action,
		Target:         target,
		EngagedAt:      time.Now(),
	}

	if err := db.Create(engagement).Error; err != nil {
		return err
	}

	// Update notification
	var notification Notification
	if err := db.First(&notification, notificationID).Error; err != nil {
		return err
	}

	switch engagementType {
	case EngagementTypeRead:
		notification.MarkAsRead()
	case EngagementTypeClick, EngagementTypeAction:
		notification.MarkAsClicked()
	}

	return db.Save(&notification).Error
}

// AggregateAnalytics aggregates analytics for a time period
func AggregateAnalytics(
	db *gorm.DB,
	interval AnalyticsInterval,
	bucketStart, bucketEnd time.Time,
	tenantID, categoryID *uuid.UUID,
) error {
	analytics := &NotificationAnalytics{
		TenantID:    tenantID,
		CategoryID:  categoryID,
		Interval:    interval,
		BucketStart: bucketStart,
		BucketEnd:   bucketEnd,
	}

	// Query notifications
	query := db.Model(&Notification{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd)

	if tenantID != nil {
		query = query.Where("tenant_id = ?", tenantID)
	}
	if categoryID != nil {
		query = query.Where("category_id = ?", categoryID)
	}

	// Total sent
	query.Where("status IN ?", []NotificationStatus{
		NotificationStatusSent,
		NotificationStatusDelivered,
	}).Count(&analytics.TotalSent)

	// Total delivered
	query.Where("status = ?", NotificationStatusDelivered).Count(&analytics.TotalDelivered)

	// Total failed
	query.Where("status = ?", NotificationStatusFailed).Count(&analytics.TotalFailed)

	// Total read
	query.Where("is_read = ?", true).Count(&analytics.TotalRead)

	// Total clicked
	query.Where("is_clicked = ?", true).Count(&analytics.TotalClicked)

	// Channel breakdown
	db.Model(&Notification{}).
		Where("created_at BETWEEN ? AND ? AND send_email = ?", bucketStart, bucketEnd, true).
		Count(&analytics.EmailSent)

	db.Model(&Notification{}).
		Where("created_at BETWEEN ? AND ? AND send_sms = ?", bucketStart, bucketEnd, true).
		Count(&analytics.SMSSent)

	db.Model(&Notification{}).
		Where("created_at BETWEEN ? AND ? AND send_push = ?", bucketStart, bucketEnd, true).
		Count(&analytics.PushSent)

	db.Model(&Notification{}).
		Where("created_at BETWEEN ? AND ? AND send_in_app = ?", bucketStart, bucketEnd, true).
		Count(&analytics.InAppSent)

	// Unique users
	db.Model(&Notification{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Distinct("recipient_user_id").
		Count(&analytics.UniqueUsers)

	// Active users (who engaged)
	db.Model(&NotificationEngagement{}).
		Where("engaged_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Distinct("user_id").
		Count(&analytics.ActiveUsers)

	// Calculate rates
	analytics.CalculateRates()

	return db.Create(analytics).Error
}

// GenerateReport generates a notification report
func GenerateReport(
	db *gorm.DB,
	reportType ReportType,
	startDate, endDate time.Time,
	tenantID *uuid.UUID,
	userID *uuid.UUID,
) (*NotificationReport, error) {
	startTime := time.Now()

	report := &NotificationReport{
		TenantID:     tenantID,
		ReportNumber: generateReportNumber(),
		Type:         reportType,
		Status:       ReportStatusGenerating,
		Title:        fmt.Sprintf("%s Notification Report", reportType),
		PeriodStart:  startDate,
		PeriodEnd:    endDate,
		GeneratedBy:  userID,
	}

	if err := db.Create(report).Error; err != nil {
		return nil, err
	}

	// Calculate statistics
	if err := calculateReportStats(db, report, startDate, endDate, tenantID); err != nil {
		report.Status = ReportStatusFailed
		report.ErrorMessage = strPtr(err.Error())
		db.Save(report)
		return report, err
	}

	// Generate insights
	generateInsights(db, report)

	// Complete report
	now := time.Now()
	generationTime := int(now.Sub(startTime).Seconds())
	report.Status = ReportStatusCompleted
	report.GeneratedAt = &now
	report.GenerationTime = &generationTime

	db.Save(report)

	return report, nil
}

func calculateReportStats(
	db *gorm.DB,
	report *NotificationReport,
	startDate, endDate time.Time,
	tenantID *uuid.UUID,
) error {
	query := db.Model(&Notification{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate)

	if tenantID != nil {
		query = query.Where("tenant_id = ?", tenantID)
	}

	// Total notifications
	query.Count(&report.TotalNotifications)

	// Status counts
	query.Where("status IN ?", []NotificationStatus{
		NotificationStatusSent,
		NotificationStatusDelivered,
	}).Count(&report.TotalSent)

	query.Where("status = ?", NotificationStatusDelivered).Count(&report.TotalDelivered)

	// Engagement
	query.Where("is_read = ?", true).Count(&report.TotalRead)
	query.Where("is_clicked = ?", true).Count(&report.TotalClicked)

	// Unique recipients
	query.Distinct("recipient_user_id").Count(&report.UniqueRecipients)

	// Active recipients
	db.Model(&NotificationEngagement{}).
		Where("engaged_at BETWEEN ? AND ?", startDate, endDate).
		Distinct("user_id").
		Count(&report.ActiveRecipients)

	// Calculate rates
	if report.TotalSent > 0 {
		report.DeliveryRate = (float64(report.TotalDelivered) / float64(report.TotalSent)) * 100
	}
	if report.TotalDelivered > 0 {
		report.ReadRate = (float64(report.TotalRead) / float64(report.TotalDelivered)) * 100
	}
	if report.TotalRead > 0 {
		report.ClickRate = (float64(report.TotalClicked) / float64(report.TotalRead)) * 100
	}

	// Top categories
	var topCategories []struct {
		CategoryID uuid.UUID
		Count      int64
	}
	db.Model(&Notification{}).
		Select("category_id, count(*) as count").
		Where("created_at BETWEEN ? AND ? AND category_id IS NOT NULL", startDate, endDate).
		Group("category_id").
		Order("count DESC").
		Limit(5).
		Scan(&topCategories)

	topCategoriesJSON := make([]map[string]interface{}, len(topCategories))
	for i, tc := range topCategories {
		topCategoriesJSON[i] = map[string]interface{}{
			"category_id": tc.CategoryID,
			"count":       tc.Count,
		}
	}
	report.TopCategories = JSONB{"categories": topCategoriesJSON}

	return nil
}

func generateInsights(db *gorm.DB, report *NotificationReport) {
	insights := make([]map[string]interface{}, 0)

	// Read rate insight
	if report.ReadRate < 30 {
		insights = append(insights, map[string]interface{}{
			"type":        "warning",
			"title":       "Low Read Rate",
			"description": fmt.Sprintf("Read rate is %.1f%%, below average", report.ReadRate),
			"recommendation": "Consider improving notification titles and timing",
		})
	} else if report.ReadRate > 70 {
		insights = append(insights, map[string]interface{}{
			"type":        "success",
			"title":       "Excellent Read Rate",
			"description": fmt.Sprintf("Read rate is %.1f%%, above average", report.ReadRate),
		})
	}

	// Click rate insight
	if report.ClickRate < 10 && report.TotalRead > 0 {
		insights = append(insights, map[string]interface{}{
			"type":        "info",
			"title":       "Low Click Rate",
			"description": fmt.Sprintf("Click rate is %.1f%%", report.ClickRate),
			"recommendation": "Add clear call-to-action buttons",
		})
	}

	report.Insights = JSONB{"insights": insights}
}

func generateReportNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("NR-%s-%s", dateStr, randomStr)
}

// GetEngagementStats gets engagement statistics
func GetEngagementStats(
	db *gorm.DB,
	startDate, endDate time.Time,
) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total engagements
	var totalCount int64
	db.Model(&NotificationEngagement{}).
		Where("engaged_at BETWEEN ? AND ?", startDate, endDate).
		Count(&totalCount)
	stats["total_engagements"] = totalCount

	// By type
	var typeStats []struct {
		Type  EngagementType
		Count int64
	}
	db.Model(&NotificationEngagement{}).
		Select("type, count(*) as count").
		Where("engaged_at BETWEEN ? AND ?", startDate, endDate).
		Group("type").
		Scan(&typeStats)
	stats["by_type"] = typeStats

	// Unique users
	var uniqueUsers int64
	db.Model(&NotificationEngagement{}).
		Where("engaged_at BETWEEN ? AND ?", startDate, endDate).
		Distinct("user_id").
		Count(&uniqueUsers)
	stats["unique_users"] = uniqueUsers

	return stats, nil
}

// GetUserEngagementHistory gets user engagement history
func GetUserEngagementHistory(
	db *gorm.DB,
	userID uuid.UUID,
	limit int,
) ([]NotificationEngagement, error) {
	var engagements []NotificationEngagement
	err := db.Where("user_id = ?", userID).
		Order("engaged_at DESC").
		Limit(limit).
		Preload("Notification").
		Find(&engagements).Error

	return engagements, err
}

// CleanupOldAnalytics removes old analytics data
func CleanupOldAnalytics(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("bucket_start < ?", cutoff).
		Delete(&NotificationAnalytics{}).Error
}
