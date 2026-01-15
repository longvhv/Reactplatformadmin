package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// RATE LIMIT REQUEST - Request Tracking
// ============================================================================
// Purpose: Track individual requests for rate limiting
// Table: rate_limit_requests
// Primary Key: _id (UUID)
// Features: Request logging, Pattern detection, Forensics
// ============================================================================

type RequestStatus string

const (
	RequestStatusAllowed  RequestStatus = "ALLOWED"
	RequestStatusBlocked  RequestStatus = "BLOCKED"
	RequestStatusThrottled RequestStatus = "THROTTLED"
	RequestStatusWarning  RequestStatus = "WARNING"
)

type RateLimitRequest struct {
	// ========== Identity (3 fields) ==========
	ID        uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PolicyID  uuid.UUID  `gorm:"column:policy_id;type:uuid;not null;index" json:"policy_id"`
	TenantID  *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// ========== Request Info (10 fields) ==========
	Identifier    string        `gorm:"column:identifier;type:varchar(255);not null;index" json:"identifier"` // user_id, ip, api_key
	IPAddress     string        `gorm:"column:ip_address;type:varchar(50);not null;index" json:"ip_address"`
	UserAgent     *string       `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	Method        string        `gorm:"column:method;type:varchar(10);not null" json:"method"`
	Path          string        `gorm:"column:path;type:varchar(500);not null;index" json:"path"`
	QueryParams   *string       `gorm:"column:query_params;type:text" json:"query_params,omitempty"`
	RequestID     *string       `gorm:"column:request_id;type:varchar(100)" json:"request_id,omitempty"`
	SessionID     *string       `gorm:"column:session_id;type:varchar(100)" json:"session_id,omitempty"`
	UserID        *uuid.UUID    `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`
	APIKey        *string       `gorm:"column:api_key;type:varchar(255)" json:"api_key,omitempty"`

	// ========== Status (4 fields) ==========
	Status        RequestStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Allowed       bool          `gorm:"column:allowed;not null;index" json:"allowed"`
	BlockedReason *string       `gorm:"column:blocked_reason;type:text" json:"blocked_reason,omitempty"`
	RetryAfter    *int          `gorm:"column:retry_after" json:"retry_after,omitempty"` // Seconds

	// ========== Rate Limit Info (5 fields) ==========
	CurrentCount  int `gorm:"column:current_count;not null" json:"current_count"`
	LimitMax      int `gorm:"column:limit_max;not null" json:"limit_max"`
	Remaining     int `gorm:"column:remaining;not null" json:"remaining"`
	WindowSeconds int `gorm:"column:window_seconds;not null" json:"window_seconds"`
	ResetAt       time.Time `gorm:"column:reset_at;not null" json:"reset_at"`

	// ========== Performance (3 fields) ==========
	ResponseTime   *int     `gorm:"column:response_time" json:"response_time,omitempty"` // Milliseconds
	BytesSent      *int64   `gorm:"column:bytes_sent" json:"bytes_sent,omitempty"`
	BytesReceived  *int64   `gorm:"column:bytes_received" json:"bytes_received,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Timestamp (1 field) ==========
	RequestedAt time.Time `gorm:"column:requested_at;not null;index" json:"requested_at"`

	// Relationships
	Policy *RateLimitPolicy `gorm:"foreignKey:PolicyID" json:"policy,omitempty"`
}

func (RateLimitRequest) TableName() string {
	return "rate_limit_requests"
}

// ============================================================================
// RATE LIMIT COUNTER - Request Counters (Redis-style)
// ============================================================================
// Purpose: Fast in-memory style counters for rate limiting
// Table: rate_limit_counters
// Primary Key: _id (UUID)
// Features: High-performance counting, Auto-expiry
// ============================================================================

type RateLimitCounter struct {
	// Identity (2 fields)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PolicyID uuid.UUID `gorm:"column:policy_id;type:uuid;not null;index" json:"policy_id"`

	// Counter Key (3 fields)
	Identifier string     `gorm:"column:identifier;type:varchar(255);not null;index" json:"identifier"`
	WindowKey  string     `gorm:"column:window_key;type:varchar(100);not null;index" json:"window_key"` // e.g., "2026-01-14-15"
	Scope      PolicyScope `gorm:"column:scope;type:varchar(30);not null" json:"scope"`

	// Counter Values (4 fields)
	RequestCount  int       `gorm:"column:request_count;default:0;not null" json:"request_count"`
	BlockedCount  int       `gorm:"column:blocked_count;default:0" json:"blocked_count"`
	LastRequestAt time.Time `gorm:"column:last_request_at;not null" json:"last_request_at"`
	FirstRequestAt time.Time `gorm:"column:first_request_at;not null" json:"first_request_at"`

	// Window (3 fields)
	WindowStart  time.Time `gorm:"column:window_start;not null;index" json:"window_start"`
	WindowEnd    time.Time `gorm:"column:window_end;not null;index" json:"window_end"`
	WindowSeconds int      `gorm:"column:window_seconds;not null" json:"window_seconds"`

	// Expiry (1 field)
	ExpiresAt time.Time `gorm:"column:expires_at;not null;index" json:"expires_at"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Policy *RateLimitPolicy `gorm:"foreignKey:PolicyID" json:"policy,omitempty"`
}

func (RateLimitCounter) TableName() string {
	return "rate_limit_counters"
}

func (c *RateLimitCounter) Increment() {
	c.RequestCount++
	c.LastRequestAt = time.Now()
}

func (c *RateLimitCounter) IncrementBlocked() {
	c.BlockedCount++
}

func (c *RateLimitCounter) IsExpired() bool {
	return time.Now().After(c.ExpiresAt)
}

// ============================================================================
// RATE LIMIT VIOLATION - Violations & Abuse
// ============================================================================
// Purpose: Track rate limit violations and abuse patterns
// Table: rate_limit_violations
// Primary Key: _id (UUID)
// Features: Abuse detection, Auto-blocking, Alerts
// ============================================================================

type ViolationType string

const (
	ViolationTypeExceeded   ViolationType = "EXCEEDED"    // Rate limit exceeded
	ViolationTypeBurst      ViolationType = "BURST"       // Burst detected
	ViolationTypePatternAbuse ViolationType = "PATTERN_ABUSE" // Abuse pattern
	ViolationTypeSuspicious ViolationType = "SUSPICIOUS"  // Suspicious activity
	ViolationTypeBot        ViolationType = "BOT"         // Bot traffic
)

type ViolationSeverity string

const (
	ViolationSeverityLow      ViolationSeverity = "LOW"
	ViolationSeverityMedium   ViolationSeverity = "MEDIUM"
	ViolationSeverityHigh     ViolationSeverity = "HIGH"
	ViolationSeverityCritical ViolationSeverity = "CRITICAL"
)

type ViolationStatus string

const (
	ViolationStatusOpen      ViolationStatus = "OPEN"
	ViolationStatusReviewing ViolationStatus = "REVIEWING"
	ViolationStatusResolved  ViolationStatus = "RESOLVED"
	ViolationStatusFalsePositive ViolationStatus = "FALSE_POSITIVE"
)

type RateLimitViolation struct {
	// ========== Identity (3 fields) ==========
	ID        uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PolicyID  uuid.UUID  `gorm:"column:policy_id;type:uuid;not null;index" json:"policy_id"`
	TenantID  *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// ========== Violation Info (7 fields) ==========
	ViolationNumber string            `gorm:"column:violation_number;type:varchar(50);uniqueIndex;not null" json:"violation_number"`
	Type            ViolationType     `gorm:"column:type;type:varchar(30);not null;index" json:"type"`
	Severity        ViolationSeverity `gorm:"column:severity;type:varchar(20);not null;index" json:"severity"`
	Status          ViolationStatus   `gorm:"column:status;type:varchar(30);not null;index" json:"status"`
	Description     string            `gorm:"column:description;type:text;not null" json:"description"`
	IsAutoBlocked   bool              `gorm:"column:is_auto_blocked;default:false" json:"is_auto_blocked"`
	BlockDuration   *int              `gorm:"column:block_duration" json:"block_duration,omitempty"` // Seconds

	// ========== Source Info (6 fields) ==========
	Identifier  string     `gorm:"column:identifier;type:varchar(255);not null;index" json:"identifier"`
	IPAddress   string     `gorm:"column:ip_address;type:varchar(50);not null;index" json:"ip_address"`
	UserAgent   *string    `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	UserID      *uuid.UUID `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`
	APIKey      *string    `gorm:"column:api_key;type:varchar(255)" json:"api_key,omitempty"`
	Path        *string    `gorm:"column:path;type:varchar(500)" json:"path,omitempty"`

	// ========== Violation Details (5 fields) ==========
	RequestCount    int       `gorm:"column:request_count;not null" json:"request_count"`
	LimitMax        int       `gorm:"column:limit_max;not null" json:"limit_max"`
	ExceededBy      int       `gorm:"column:exceeded_by;not null" json:"exceeded_by"`
	WindowSeconds   int       `gorm:"column:window_seconds;not null" json:"window_seconds"`
	ViolatedAt      time.Time `gorm:"column:violated_at;not null;index" json:"violated_at"`

	// ========== Resolution (4 fields) ==========
	ResolvedAt     *time.Time `gorm:"column:resolved_at" json:"resolved_at,omitempty"`
	ResolvedBy     *uuid.UUID `gorm:"column:resolved_by;type:uuid" json:"resolved_by,omitempty"`
	Resolution     *string    `gorm:"column:resolution;type:text" json:"resolution,omitempty"`
	Notes          *string    `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// ========== Impact (3 fields) ==========
	AffectedRequests int  `gorm:"column:affected_requests;default:0" json:"affected_requests"`
	IsRecurring      bool `gorm:"column:is_recurring;default:false" json:"is_recurring"`
	RecurrenceCount  int  `gorm:"column:recurrence_count;default:1" json:"recurrence_count"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Policy *RateLimitPolicy `gorm:"foreignKey:PolicyID" json:"policy,omitempty"`
}

func (RateLimitViolation) TableName() string {
	return "rate_limit_violations"
}

func (v *RateLimitViolation) Resolve(resolution string, userID uuid.UUID) {
	now := time.Now()
	v.Status = ViolationStatusResolved
	v.ResolvedAt = &now
	v.ResolvedBy = &userID
	v.Resolution = &resolution
}

func (v *RateLimitViolation) MarkFalsePositive(reason string, userID uuid.UUID) {
	now := time.Now()
	v.Status = ViolationStatusFalsePositive
	v.ResolvedAt = &now
	v.ResolvedBy = &userID
	v.Resolution = &reason
}

// ============================================================================
// RATE LIMIT ALERT - Alerts & Notifications
// ============================================================================
// Purpose: Alert system for rate limit events
// Table: rate_limit_alerts
// Primary Key: _id (UUID)
// Features: Multi-channel alerts, Escalation, Throttling
// ============================================================================

type AlertType string

const (
	AlertTypeViolation   AlertType = "VIOLATION"
	AlertTypeQuotaNear   AlertType = "QUOTA_NEAR"
	AlertTypeQuotaExceed AlertType = "QUOTA_EXCEED"
	AlertTypeAbusePattern AlertType = "ABUSE_PATTERN"
	AlertTypeSystemHealth AlertType = "SYSTEM_HEALTH"
)

type AlertPriority string

const (
	AlertPriorityLow      AlertPriority = "LOW"
	AlertPriorityMedium   AlertPriority = "MEDIUM"
	AlertPriorityHigh     AlertPriority = "HIGH"
	AlertPriorityCritical AlertPriority = "CRITICAL"
)

type AlertStatus string

const (
	AlertStatusPending     AlertStatus = "PENDING"
	AlertStatusSent        AlertStatus = "SENT"
	AlertStatusFailed      AlertStatus = "FAILED"
	AlertStatusAcknowledged AlertStatus = "ACKNOWLEDGED"
)

type RateLimitAlert struct {
	// Identity (1 field)
	ID uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`

	// Alert Info (6 fields)
	AlertNumber string        `gorm:"column:alert_number;type:varchar(50);uniqueIndex;not null" json:"alert_number"`
	Type        AlertType     `gorm:"column:type;type:varchar(30);not null;index" json:"type"`
	Priority    AlertPriority `gorm:"column:priority;type:varchar(20);not null;index" json:"priority"`
	Status      AlertStatus   `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title       string        `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Message     string        `gorm:"column:message;type:text;not null" json:"message"`

	// Related Records (3 fields)
	PolicyID    *uuid.UUID `gorm:"column:policy_id;type:uuid;index" json:"policy_id,omitempty"`
	ViolationID *uuid.UUID `gorm:"column:violation_id;type:uuid;index" json:"violation_id,omitempty"`
	QuotaID     *uuid.UUID `gorm:"column:quota_id;type:uuid;index" json:"quota_id,omitempty"`

	// Recipients (2 fields)
	Recipients  JSONB  `gorm:"column:recipients;type:jsonb" json:"recipients,omitempty"` // Array of emails/users
	Channels    JSONB  `gorm:"column:channels;type:jsonb" json:"channels,omitempty"`    // email, slack, webhook

	// Delivery (4 fields)
	SentAt          *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`
	AcknowledgedAt  *time.Time `gorm:"column:acknowledged_at" json:"acknowledged_at,omitempty"`
	AcknowledgedBy  *uuid.UUID `gorm:"column:acknowledged_by;type:uuid" json:"acknowledged_by,omitempty"`
	DeliveryAttempts int       `gorm:"column:delivery_attempts;default:0" json:"delivery_attempts"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Policy    *RateLimitPolicy    `gorm:"foreignKey:PolicyID" json:"policy,omitempty"`
	Violation *RateLimitViolation `gorm:"foreignKey:ViolationID" json:"violation,omitempty"`
	Quota     *RateLimitQuota     `gorm:"foreignKey:QuotaID" json:"quota,omitempty"`
}

func (RateLimitAlert) TableName() string {
	return "rate_limit_alerts"
}

func (a *RateLimitAlert) MarkSent() {
	now := time.Now()
	a.Status = AlertStatusSent
	a.SentAt = &now
}

func (a *RateLimitAlert) Acknowledge(userID uuid.UUID) {
	now := time.Now()
	a.Status = AlertStatusAcknowledged
	a.AcknowledgedAt = &now
	a.AcknowledgedBy = &userID
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateViolationNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("VIO-%s-%s", dateStr, randomStr)
}

func generateAlertNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("ALT-%s-%s", dateStr, randomStr)
}

// TrackRequest logs a rate limit request
func TrackRequest(
	db *gorm.DB,
	req *RateLimitRequest,
) error {
	req.RequestedAt = time.Now()
	return db.Create(req).Error
}

// GetOrCreateCounter gets or creates a counter for a window
func GetOrCreateCounter(
	db *gorm.DB,
	policyID uuid.UUID,
	identifier string,
	scope PolicyScope,
	windowSeconds int,
) (*RateLimitCounter, error) {
	now := time.Now()
	windowStart := now.Truncate(time.Duration(windowSeconds) * time.Second)
	windowEnd := windowStart.Add(time.Duration(windowSeconds) * time.Second)
	windowKey := windowStart.Format("2006-01-02-15-04")

	var counter RateLimitCounter
	err := db.Where(
		"policy_id = ? AND identifier = ? AND window_key = ?",
		policyID, identifier, windowKey,
	).First(&counter).Error

	if err == gorm.ErrRecordNotFound {
		// Create new counter
		counter = RateLimitCounter{
			PolicyID:      policyID,
			Identifier:    identifier,
			WindowKey:     windowKey,
			Scope:         scope,
			RequestCount:  0,
			BlockedCount:  0,
			FirstRequestAt: now,
			LastRequestAt: now,
			WindowStart:   windowStart,
			WindowEnd:     windowEnd,
			WindowSeconds: windowSeconds,
			ExpiresAt:     windowEnd.Add(24 * time.Hour), // Keep for 24h after window
		}
		err = db.Create(&counter).Error
		return &counter, err
	}

	return &counter, err
}

// IncrementCounter increments a counter and checks limits
func IncrementCounter(
	db *gorm.DB,
	counter *RateLimitCounter,
	maxRequests int,
) (bool, int, error) {
	counter.Increment()

	if err := db.Save(counter).Error; err != nil {
		return false, 0, err
	}

	allowed := counter.RequestCount <= maxRequests
	remaining := maxRequests - counter.RequestCount
	if remaining < 0 {
		remaining = 0
	}

	if !allowed {
		counter.IncrementBlocked()
		db.Save(counter)
	}

	return allowed, remaining, nil
}

// RecordViolation records a rate limit violation
func RecordViolation(
	db *gorm.DB,
	policyID uuid.UUID,
	identifier, ipAddress string,
	requestCount, limitMax, windowSeconds int,
	violationType ViolationType,
	severity ViolationSeverity,
) (*RateLimitViolation, error) {
	violation := &RateLimitViolation{
		PolicyID:        policyID,
		ViolationNumber: generateViolationNumber(),
		Type:            violationType,
		Severity:        severity,
		Status:          ViolationStatusOpen,
		Description:     fmt.Sprintf("Rate limit exceeded: %d requests (limit: %d)", requestCount, limitMax),
		Identifier:      identifier,
		IPAddress:       ipAddress,
		RequestCount:    requestCount,
		LimitMax:        limitMax,
		ExceededBy:      requestCount - limitMax,
		WindowSeconds:   windowSeconds,
		ViolatedAt:      time.Now(),
		RecurrenceCount: 1,
	}

	// Check for previous violations
	var prevViolation RateLimitViolation
	err := db.Where(
		"identifier = ? AND policy_id = ? AND status = ? AND violated_at >= ?",
		identifier, policyID, ViolationStatusOpen,
		time.Now().Add(-24*time.Hour),
	).First(&prevViolation).Error

	if err == nil {
		// Recurring violation
		violation.IsRecurring = true
		violation.RecurrenceCount = prevViolation.RecurrenceCount + 1
		
		// Escalate severity
		if violation.RecurrenceCount >= 5 {
			violation.Severity = ViolationSeverityCritical
		} else if violation.RecurrenceCount >= 3 {
			violation.Severity = ViolationSeverityHigh
		}
	}

	if err := db.Create(violation).Error; err != nil {
		return nil, err
	}

	// Auto-block if critical
	if violation.Severity == ViolationSeverityCritical {
		blockDuration := 3600 // 1 hour
		violation.IsAutoBlocked = true
		violation.BlockDuration = &blockDuration
		
		BlockIP(db, ipAddress, BlacklistReasonViolation, blockDuration, nil)
		db.Save(violation)
	}

	return violation, nil
}

// CreateAlert creates a rate limit alert
func CreateAlert(
	db *gorm.DB,
	alertType AlertType,
	priority AlertPriority,
	title, message string,
	policyID, violationID, quotaID *uuid.UUID,
	recipients []string,
) error {
	recipientsJSON := JSONB{"emails": recipients}
	channelsJSON := JSONB{"channels": []string{"email", "webhook"}}

	alert := &RateLimitAlert{
		AlertNumber:  generateAlertNumber(),
		Type:         alertType,
		Priority:     priority,
		Status:       AlertStatusPending,
		Title:        title,
		Message:      message,
		PolicyID:     policyID,
		ViolationID:  violationID,
		QuotaID:      quotaID,
		Recipients:   recipientsJSON,
		Channels:     channelsJSON,
	}

	return db.Create(alert).Error
}

// CheckAbusePatterns checks for abuse patterns
func CheckAbusePatterns(
	db *gorm.DB,
	identifier string,
	windowMinutes int,
) (bool, string, error) {
	windowStart := time.Now().Add(-time.Duration(windowMinutes) * time.Minute)

	// Check request frequency
	var requestCount int64
	err := db.Table("rate_limit_requests").
		Where("identifier = ? AND requested_at >= ?", identifier, windowStart).
		Count(&requestCount).Error

	if err != nil {
		return false, "", err
	}

	// Check for burst patterns (many requests in short time)
	if requestCount > 1000 {
		return true, "High request frequency detected", nil
	}

	// Check for blocked requests ratio
	var blockedCount int64
	err = db.Table("rate_limit_requests").
		Where("identifier = ? AND requested_at >= ? AND allowed = ?",
			identifier, windowStart, false).
		Count(&blockedCount).Error

	if err != nil {
		return false, "", err
	}

	blockedRatio := float64(blockedCount) / float64(requestCount)
	if blockedRatio > 0.5 && requestCount > 100 {
		return true, fmt.Sprintf("High blocked ratio: %.1f%%", blockedRatio*100), nil
	}

	// Check for recent violations
	var violationCount int64
	err = db.Table("rate_limit_violations").
		Where("identifier = ? AND violated_at >= ?", identifier, windowStart).
		Count(&violationCount).Error

	if err != nil {
		return false, "", err
	}

	if violationCount >= 5 {
		return true, fmt.Sprintf("Multiple violations: %d", violationCount), nil
	}

	return false, "", nil
}

// CleanupExpiredCounters removes expired counters
func CleanupExpiredCounters(db *gorm.DB) error {
	return db.Where("expires_at < ?", time.Now()).
		Delete(&RateLimitCounter{}).Error
}

// CleanupOldRequests removes old request logs
func CleanupOldRequests(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("requested_at < ?", cutoff).
		Delete(&RateLimitRequest{}).Error
}

// GetViolationStats gets violation statistics
func GetViolationStats(
	db *gorm.DB,
	startDate, endDate time.Time,
) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total violations
	var totalCount int64
	db.Model(&RateLimitViolation{}).
		Where("violated_at BETWEEN ? AND ?", startDate, endDate).
		Count(&totalCount)
	stats["total_violations"] = totalCount

	// By severity
	var severityStats []struct {
		Severity ViolationSeverity
		Count    int64
	}
	db.Model(&RateLimitViolation{}).
		Select("severity, count(*) as count").
		Where("violated_at BETWEEN ? AND ?", startDate, endDate).
		Group("severity").
		Scan(&severityStats)
	stats["by_severity"] = severityStats

	// By type
	var typeStats []struct {
		Type  ViolationType
		Count int64
	}
	db.Model(&RateLimitViolation{}).
		Select("type, count(*) as count").
		Where("violated_at BETWEEN ? AND ?", startDate, endDate).
		Group("type").
		Scan(&typeStats)
	stats["by_type"] = typeStats

	// Auto-blocked count
	var autoBlockedCount int64
	db.Model(&RateLimitViolation{}).
		Where("violated_at BETWEEN ? AND ? AND is_auto_blocked = ?",
			startDate, endDate, true).
		Count(&autoBlockedCount)
	stats["auto_blocked"] = autoBlockedCount

	return stats, nil
}

// GetTopViolators gets top violators
func GetTopViolators(
	db *gorm.DB,
	limit int,
	startDate, endDate time.Time,
) ([]map[string]interface{}, error) {
	var results []struct {
		Identifier string
		IPAddress  string
		Count      int64
	}

	err := db.Model(&RateLimitViolation{}).
		Select("identifier, ip_address, count(*) as count").
		Where("violated_at BETWEEN ? AND ?", startDate, endDate).
		Group("identifier, ip_address").
		Order("count DESC").
		Limit(limit).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	violators := make([]map[string]interface{}, len(results))
	for i, r := range results {
		violators[i] = map[string]interface{}{
			"identifier":  r.Identifier,
			"ip_address":  r.IPAddress,
			"violations": r.Count,
		}
	}

	return violators, nil
}
