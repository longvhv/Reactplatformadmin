package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// PACKAGE USAGE - Track usage against package limits
// ============================================================================
// Purpose: Monitor customer usage against package quotas
// Table: package_usage
// Primary Key: _id (UUID)
// Features: Real-time tracking, Quota enforcement, Overage billing
// ============================================================================

// UsageMetric represents the type of metric being tracked
type UsageMetric string

const (
	UsageMetricUsers       UsageMetric = "USERS"        // Number of users
	UsageMetricStorage     UsageMetric = "STORAGE"      // Storage in GB
	UsageMetricBandwidth   UsageMetric = "BANDWIDTH"    // Bandwidth in GB
	UsageMetricAPIRequests UsageMetric = "API_REQUESTS" // API calls
	UsageMetricProjects    UsageMetric = "PROJECTS"     // Number of projects
	UsageMetricEmails      UsageMetric = "EMAILS"       // Emails sent
	UsageMetricSMS         UsageMetric = "SMS"          // SMS sent
)

// UsageResetPeriod defines when usage resets
type UsageResetPeriod string

const (
	UsageResetDaily   UsageResetPeriod = "DAILY"
	UsageResetWeekly  UsageResetPeriod = "WEEKLY"
	UsageResetMonthly UsageResetPeriod = "MONTHLY"
	UsageResetYearly  UsageResetPeriod = "YEARLY"
	UsageResetNever   UsageResetPeriod = "NEVER"
)

type PackageUsage struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`
	CustomerID     uuid.UUID `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Metric Info (4 fields)
	Metric       UsageMetric      `gorm:"column:metric;type:varchar(50);not null;index" json:"metric"`
	ResetPeriod  UsageResetPeriod `gorm:"column:reset_period;type:varchar(20);not null" json:"reset_period"`
	Unit         string           `gorm:"column:unit;type:varchar(20)" json:"unit"` // users, GB, requests, etc.
	Description  *string          `gorm:"column:description;type:text" json:"description,omitempty"`

	// Limits & Usage (4 fields)
	Limit          int64   `gorm:"column:limit;not null" json:"limit"`           // Max allowed
	CurrentUsage   int64   `gorm:"column:current_usage;default:0" json:"current_usage"`
	PeakUsage      int64   `gorm:"column:peak_usage;default:0" json:"peak_usage"`
	UsagePercent   float64 `gorm:"column:usage_percent;default:0" json:"usage_percent"` // Calculated

	// Overage (4 fields)
	AllowOverage     bool    `gorm:"column:allow_overage;default:false" json:"allow_overage"`
	OverageAmount    int64   `gorm:"column:overage_amount;default:0" json:"overage_amount"`
	OveragePrice     float64 `gorm:"column:overage_price;type:decimal(10,4);default:0" json:"overage_price"` // Price per unit
	OverageTotalCost float64 `gorm:"column:overage_total_cost;type:decimal(15,2);default:0" json:"overage_total_cost"`

	// Alerts (2 fields)
	AlertThreshold *int  `gorm:"column:alert_threshold" json:"alert_threshold,omitempty"` // % to trigger alert
	IsAlertSent    bool  `gorm:"column:is_alert_sent;default:false" json:"is_alert_sent"`

	// Reset Info (3 fields)
	LastResetAt  time.Time  `gorm:"column:last_reset_at;autoCreateTime" json:"last_reset_at"`
	NextResetAt  *time.Time `gorm:"column:next_reset_at" json:"next_reset_at,omitempty"`
	ResetCount   int        `gorm:"column:reset_count;default:0" json:"reset_count"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Subscription *Subscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
}

func (PackageUsage) TableName() string {
	return "package_usage"
}

// ============================================================================
// Helper Methods
// ============================================================================

func (pu *PackageUsage) CalculateUsagePercent() {
	if pu.Limit == 0 {
		pu.UsagePercent = 0
		return
	}
	pu.UsagePercent = (float64(pu.CurrentUsage) / float64(pu.Limit)) * 100
}

func (pu *PackageUsage) IsLimitExceeded() bool {
	return pu.CurrentUsage >= pu.Limit
}

func (pu *PackageUsage) IsOverQuota() bool {
	return pu.CurrentUsage > pu.Limit
}

func (pu *PackageUsage) CanIncrement(amount int64) bool {
	if pu.AllowOverage {
		return true
	}
	return pu.CurrentUsage+amount <= pu.Limit
}

func (pu *PackageUsage) Increment(amount int64) error {
	if !pu.CanIncrement(amount) && !pu.AllowOverage {
		return fmt.Errorf("quota exceeded: %d/%d %s", pu.CurrentUsage, pu.Limit, pu.Unit)
	}

	pu.CurrentUsage += amount

	// Update peak usage
	if pu.CurrentUsage > pu.PeakUsage {
		pu.PeakUsage = pu.CurrentUsage
	}

	// Calculate overage
	if pu.CurrentUsage > pu.Limit {
		pu.OverageAmount = pu.CurrentUsage - pu.Limit
		pu.OverageTotalCost = float64(pu.OverageAmount) * pu.OveragePrice
	} else {
		pu.OverageAmount = 0
		pu.OverageTotalCost = 0
	}

	pu.CalculateUsagePercent()

	// Check alert threshold
	if pu.AlertThreshold != nil && !pu.IsAlertSent {
		if pu.UsagePercent >= float64(*pu.AlertThreshold) {
			pu.IsAlertSent = true
		}
	}

	return nil
}

func (pu *PackageUsage) Decrement(amount int64) {
	pu.CurrentUsage -= amount
	if pu.CurrentUsage < 0 {
		pu.CurrentUsage = 0
	}

	// Recalculate overage
	if pu.CurrentUsage > pu.Limit {
		pu.OverageAmount = pu.CurrentUsage - pu.Limit
		pu.OverageTotalCost = float64(pu.OverageAmount) * pu.OveragePrice
	} else {
		pu.OverageAmount = 0
		pu.OverageTotalCost = 0
	}

	pu.CalculateUsagePercent()
}

func (pu *PackageUsage) Reset() {
	pu.CurrentUsage = 0
	pu.OverageAmount = 0
	pu.OverageTotalCost = 0
	pu.UsagePercent = 0
	pu.IsAlertSent = false
	pu.LastResetAt = time.Now()
	pu.ResetCount++

	// Calculate next reset
	pu.NextResetAt = calculateNextResetDate(pu.LastResetAt, pu.ResetPeriod)
}

func (pu *PackageUsage) ShouldReset() bool {
	if pu.NextResetAt == nil {
		return false
	}
	return time.Now().After(*pu.NextResetAt)
}

func (pu *PackageUsage) GetAvailable() int64 {
	available := pu.Limit - pu.CurrentUsage
	if available < 0 {
		return 0
	}
	return available
}

// ============================================================================
// USAGE EVENT - Track individual usage events
// ============================================================================

type UsageEventType string

const (
	UsageEventTypeIncrement UsageEventType = "INCREMENT"
	UsageEventTypeDecrement UsageEventType = "DECREMENT"
	UsageEventTypeReset     UsageEventType = "RESET"
	UsageEventTypeAdjustment UsageEventType = "ADJUSTMENT"
)

type UsageEvent struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`
	UsageID        uuid.UUID `gorm:"column:usage_id;type:uuid;not null;index" json:"usage_id"`

	// Event Info (5 fields)
	EventType   UsageEventType `gorm:"column:event_type;type:varchar(20);not null;index" json:"event_type"`
	Metric      UsageMetric    `gorm:"column:metric;type:varchar(50);not null;index" json:"metric"`
	Amount      int64          `gorm:"column:amount;not null" json:"amount"`
	Description *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	Source      *string        `gorm:"column:source;type:varchar(100)" json:"source,omitempty"` // API, UI, System, etc.

	// Before/After (2 fields)
	UsageBefore int64 `gorm:"column:usage_before;not null" json:"usage_before"`
	UsageAfter  int64 `gorm:"column:usage_after;not null" json:"usage_after"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationships
	Subscription *Subscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
	Usage        *PackageUsage `gorm:"foreignKey:UsageID" json:"usage,omitempty"`
}

func (UsageEvent) TableName() string {
	return "usage_events"
}

// ============================================================================
// USAGE ALERT - Usage quota alerts
// ============================================================================

type AlertSeverity string

const (
	AlertSeverityInfo     AlertSeverity = "INFO"
	AlertSeverityWarning  AlertSeverity = "WARNING"
	AlertSeverityCritical AlertSeverity = "CRITICAL"
)

type AlertStatus string

const (
	AlertStatusPending     AlertStatus = "PENDING"
	AlertStatusSent        AlertStatus = "SENT"
	AlertStatusAcknowledged AlertStatus = "ACKNOWLEDGED"
	AlertStatusResolved    AlertStatus = "RESOLVED"
)

type UsageAlert struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`
	UsageID        uuid.UUID `gorm:"column:usage_id;type:uuid;not null;index" json:"usage_id"`

	// Alert Info (5 fields)
	Metric       UsageMetric   `gorm:"column:metric;type:varchar(50);not null" json:"metric"`
	Severity     AlertSeverity `gorm:"column:severity;type:varchar(20);not null" json:"severity"`
	Status       AlertStatus   `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"`
	Message      string        `gorm:"column:message;type:text;not null" json:"message"`
	UsagePercent float64       `gorm:"column:usage_percent;not null" json:"usage_percent"`

	// Response (3 fields)
	SentAt         *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`
	AcknowledgedAt *time.Time `gorm:"column:acknowledged_at" json:"acknowledged_at,omitempty"`
	ResolvedAt     *time.Time `gorm:"column:resolved_at" json:"resolved_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Subscription *Subscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
	Usage        *PackageUsage `gorm:"foreignKey:UsageID" json:"usage,omitempty"`
}

func (UsageAlert) TableName() string {
	return "usage_alerts"
}

func (ua *UsageAlert) MarkAsSent() {
	now := time.Now()
	ua.Status = AlertStatusSent
	ua.SentAt = &now
}

func (ua *UsageAlert) Acknowledge() {
	now := time.Now()
	ua.Status = AlertStatusAcknowledged
	ua.AcknowledgedAt = &now
}

func (ua *UsageAlert) Resolve() {
	now := time.Now()
	ua.Status = AlertStatusResolved
	ua.ResolvedAt = &now
}

// ============================================================================
// USAGE SUMMARY - Aggregated usage statistics
// ============================================================================
// Type: Computed/View (not a table, calculated on-demand)

type UsageSummary struct {
	SubscriptionID uuid.UUID   `json:"subscription_id"`
	CustomerID     uuid.UUID   `json:"customer_id"`
	PeriodStart    time.Time   `json:"period_start"`
	PeriodEnd      time.Time   `json:"period_end"`
	Metrics        []MetricSummary `json:"metrics"`
	TotalOverage   float64     `json:"total_overage"`
	HasOverage     bool        `json:"has_overage"`
}

type MetricSummary struct {
	Metric           UsageMetric `json:"metric"`
	Limit            int64       `json:"limit"`
	CurrentUsage     int64       `json:"current_usage"`
	PeakUsage        int64       `json:"peak_usage"`
	UsagePercent     float64     `json:"usage_percent"`
	OverageAmount    int64       `json:"overage_amount"`
	OverageCost      float64     `json:"overage_cost"`
	IsLimitExceeded  bool        `json:"is_limit_exceeded"`
}

// ============================================================================
// Helper Functions
// ============================================================================

// TrackUsage increments usage and creates event
func TrackUsage(
	db *gorm.DB,
	subscriptionID uuid.UUID,
	metric UsageMetric,
	amount int64,
	source *string,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get usage record
		var usage PackageUsage
		err := tx.Where("subscription_id = ? AND metric = ?", subscriptionID, metric).
			First(&usage).Error

		if err == gorm.ErrRecordNotFound {
			return errors.New("usage record not found")
		} else if err != nil {
			return err
		}

		// Check if should reset
		if usage.ShouldReset() {
			usage.Reset()
		}

		usageBefore := usage.CurrentUsage

		// Increment usage
		if err := usage.Increment(amount); err != nil {
			return err
		}

		// Save usage
		if err := tx.Save(&usage).Error; err != nil {
			return err
		}

		// Create usage event
		event := &UsageEvent{
			SubscriptionID: subscriptionID,
			UsageID:        usage.ID,
			EventType:      UsageEventTypeIncrement,
			Metric:         metric,
			Amount:         amount,
			UsageBefore:    usageBefore,
			UsageAfter:     usage.CurrentUsage,
			Source:         source,
			CreatedBy:      userID,
		}

		if err := tx.Create(event).Error; err != nil {
			return err
		}

		// Check if alert should be created
		if usage.IsAlertSent && usage.AlertThreshold != nil {
			var existingAlert UsageAlert
			err := tx.Where("usage_id = ? AND status IN ?", usage.ID, 
				[]AlertStatus{AlertStatusPending, AlertStatusSent}).
				First(&existingAlert).Error

			if err == gorm.ErrRecordNotFound {
				// Create alert
				severity := AlertSeverityWarning
				if usage.IsLimitExceeded() {
					severity = AlertSeverityCritical
				}

				alert := &UsageAlert{
					SubscriptionID: subscriptionID,
					UsageID:        usage.ID,
					Metric:         metric,
					Severity:       severity,
					Status:         AlertStatusPending,
					Message:        fmt.Sprintf("Usage for %s has reached %.1f%% of quota", metric, usage.UsagePercent),
					UsagePercent:   usage.UsagePercent,
				}

				if err := tx.Create(alert).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// CheckUsageLimit checks if action is allowed based on quota
func CheckUsageLimit(
	db *gorm.DB,
	subscriptionID uuid.UUID,
	metric UsageMetric,
	requestedAmount int64,
) (bool, error) {
	var usage PackageUsage
	err := db.Where("subscription_id = ? AND metric = ?", subscriptionID, metric).
		First(&usage).Error

	if err != nil {
		return false, err
	}

	// Check if should reset
	if usage.ShouldReset() {
		usage.Reset()
		db.Save(&usage)
	}

	return usage.CanIncrement(requestedAmount), nil
}

// CalculateUsageSummary calculates usage summary for a subscription
func CalculateUsageSummary(db *gorm.DB, subscriptionID uuid.UUID) (*UsageSummary, error) {
	var subscription Subscription
	if err := db.First(&subscription, subscriptionID).Error; err != nil {
		return nil, err
	}

	var usages []PackageUsage
	if err := db.Where("subscription_id = ?", subscriptionID).Find(&usages).Error; err != nil {
		return nil, err
	}

	summary := &UsageSummary{
		SubscriptionID: subscriptionID,
		CustomerID:     subscription.CustomerID,
		PeriodStart:    subscription.CurrentPeriodStart,
		PeriodEnd:      subscription.CurrentPeriodEnd,
		Metrics:        make([]MetricSummary, 0),
		TotalOverage:   0,
		HasOverage:     false,
	}

	for _, usage := range usages {
		metricSummary := MetricSummary{
			Metric:          usage.Metric,
			Limit:           usage.Limit,
			CurrentUsage:    usage.CurrentUsage,
			PeakUsage:       usage.PeakUsage,
			UsagePercent:    usage.UsagePercent,
			OverageAmount:   usage.OverageAmount,
			OverageCost:     usage.OverageTotalCost,
			IsLimitExceeded: usage.IsLimitExceeded(),
		}

		summary.Metrics = append(summary.Metrics, metricSummary)
		summary.TotalOverage += usage.OverageTotalCost

		if usage.OverageAmount > 0 {
			summary.HasOverage = true
		}
	}

	return summary, nil
}

// ResetAllUsage resets all usage records for subscriptions that should reset
func ResetAllUsage(db *gorm.DB) error {
	var usages []PackageUsage
	if err := db.Where("next_reset_at IS NOT NULL AND next_reset_at < ?", time.Now()).
		Find(&usages).Error; err != nil {
		return err
	}

	for _, usage := range usages {
		usage.Reset()

		if err := db.Save(&usage).Error; err != nil {
			return err
		}

		// Create reset event
		event := &UsageEvent{
			SubscriptionID: usage.SubscriptionID,
			UsageID:        usage.ID,
			EventType:      UsageEventTypeReset,
			Metric:         usage.Metric,
			Amount:         0,
			UsageBefore:    usage.CurrentUsage,
			UsageAfter:     0,
		}

		if err := db.Create(event).Error; err != nil {
			return err
		}
	}

	return nil
}

// SendUsageAlerts sends pending usage alerts
func SendUsageAlerts(db *gorm.DB) error {
	var alerts []UsageAlert
	if err := db.Where("status = ?", AlertStatusPending).
		Preload("Subscription").
		Preload("Usage").
		Find(&alerts).Error; err != nil {
		return err
	}

	for _, alert := range alerts {
		// Send notification (email, SMS, webhook, etc.)
		// This is a placeholder - implement actual notification logic
		sendAlertNotification(&alert)

		alert.MarkAsSent()
		if err := db.Save(&alert).Error; err != nil {
			return err
		}
	}

	return nil
}

// InitializeUsageForSubscription creates usage records for a new subscription
func InitializeUsageForSubscription(
	db *gorm.DB,
	subscription *Subscription,
	pkg *ServicePackage,
) error {
	// Create usage records based on package features
	usageRecords := []PackageUsage{}

	if pkg.Features.MaxUsers != nil {
		usageRecords = append(usageRecords, PackageUsage{
			SubscriptionID: subscription.ID,
			CustomerID:     subscription.CustomerID,
			Metric:         UsageMetricUsers,
			ResetPeriod:    UsageResetNever,
			Unit:           "users",
			Limit:          int64(*pkg.Features.MaxUsers),
			AllowOverage:   false,
			AlertThreshold: intPtr(80), // Alert at 80%
		})
	}

	if pkg.Features.MaxStorage != nil {
		usageRecords = append(usageRecords, PackageUsage{
			SubscriptionID: subscription.ID,
			CustomerID:     subscription.CustomerID,
			Metric:         UsageMetricStorage,
			ResetPeriod:    UsageResetNever,
			Unit:           "GB",
			Limit:          int64(*pkg.Features.MaxStorage),
			AllowOverage:   true,
			OveragePrice:   0.10, // $0.10 per GB
			AlertThreshold: intPtr(90),
		})
	}

	if pkg.Features.MaxAPIRequests != nil {
		usageRecords = append(usageRecords, PackageUsage{
			SubscriptionID: subscription.ID,
			CustomerID:     subscription.CustomerID,
			Metric:         UsageMetricAPIRequests,
			ResetPeriod:    UsageResetMonthly,
			Unit:           "requests",
			Limit:          int64(*pkg.Features.MaxAPIRequests),
			AllowOverage:   true,
			OveragePrice:   0.001, // $0.001 per request
			AlertThreshold: intPtr(85),
		})
	}

	// Initialize all records
	for i := range usageRecords {
		usageRecords[i].CalculateUsagePercent()
		usageRecords[i].NextResetAt = calculateNextResetDate(time.Now(), usageRecords[i].ResetPeriod)
	}

	return db.Create(&usageRecords).Error
}

// Utility functions
func calculateNextResetDate(from time.Time, period UsageResetPeriod) *time.Time {
	var next time.Time

	switch period {
	case UsageResetDaily:
		next = from.AddDate(0, 0, 1)
	case UsageResetWeekly:
		next = from.AddDate(0, 0, 7)
	case UsageResetMonthly:
		next = from.AddDate(0, 1, 0)
	case UsageResetYearly:
		next = from.AddDate(1, 0, 0)
	case UsageResetNever:
		return nil
	default:
		return nil
	}

	return &next
}

func intPtr(i int) *int {
	return &i
}

func sendAlertNotification(alert *UsageAlert) {
	// Placeholder for notification logic
	// Implement email, SMS, webhook, etc.
}
