package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// ACCESS ANALYTICS - Usage Analytics
// ============================================================================
// Purpose: Analytics and metrics for access patterns
// Table: access_analytics
// Primary Key: _id (UUID)
// Features: Time-series data, Aggregations, Trends
// ============================================================================

type AnalyticsInterval string

const (
	AnalyticsIntervalMinute AnalyticsInterval = "MINUTE"
	AnalyticsIntervalHour   AnalyticsInterval = "HOUR"
	AnalyticsIntervalDay    AnalyticsInterval = "DAY"
	AnalyticsIntervalWeek   AnalyticsInterval = "WEEK"
	AnalyticsIntervalMonth  AnalyticsInterval = "MONTH"
)

type AccessAnalytics struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Time Bucket (3 fields)
	Interval    AnalyticsInterval `gorm:"column:interval;type:varchar(20);not null;index" json:"interval"`
	BucketStart time.Time         `gorm:"column:bucket_start;not null;index" json:"bucket_start"`
	BucketEnd   time.Time         `gorm:"column:bucket_end;not null" json:"bucket_end"`

	// Access Metrics (8 fields)
	TotalAccess      int64 `gorm:"column:total_access;default:0" json:"total_access"`
	SuccessfulAccess int64 `gorm:"column:successful_access;default:0" json:"successful_access"`
	FailedAccess     int64 `gorm:"column:failed_access;default:0" json:"failed_access"`
	BlockedAccess    int64 `gorm:"column:blocked_access;default:0" json:"blocked_access"`
	UniqueUsers      int64 `gorm:"column:unique_users;default:0" json:"unique_users"`
	UniqueIPs        int64 `gorm:"column:unique_ips;default:0" json:"unique_ips"`
	PageViews        int64 `gorm:"column:page_views;default:0" json:"page_views"`
	APICallCount     int64 `gorm:"column:api_call_count;default:0" json:"api_call_count"`

	// Login Metrics (5 fields)
	TotalLogins      int64 `gorm:"column:total_logins;default:0" json:"total_logins"`
	SuccessfulLogins int64 `gorm:"column:successful_logins;default:0" json:"successful_logins"`
	FailedLogins     int64 `gorm:"column:failed_logins;default:0" json:"failed_logins"`
	UniqueLogins     int64 `gorm:"column:unique_logins;default:0" json:"unique_logins"`
	NewUsers         int64 `gorm:"column:new_users;default:0" json:"new_users"`

	// Session Metrics (4 fields)
	ActiveSessions  int64   `gorm:"column:active_sessions;default:0" json:"active_sessions"`
	NewSessions     int64   `gorm:"column:new_sessions;default:0" json:"new_sessions"`
	EndedSessions   int64   `gorm:"column:ended_sessions;default:0" json:"ended_sessions"`
	AvgSessionTime  float64 `gorm:"column:avg_session_time;type:decimal(10,2)" json:"avg_session_time"` // Seconds

	// Security Metrics (5 fields)
	SecurityEvents      int64 `gorm:"column:security_events;default:0" json:"security_events"`
	SuspiciousActivities int64 `gorm:"column:suspicious_activities;default:0" json:"suspicious_activities"`
	BlockedIPs          int64 `gorm:"column:blocked_ips;default:0" json:"blocked_ips"`
	TrustedDevices      int64 `gorm:"column:trusted_devices;default:0" json:"trusted_devices"`
	UnknownDevices      int64 `gorm:"column:unknown_devices;default:0" json:"unknown_devices"`

	// Performance Metrics (3 fields)
	AvgResponseTime float64 `gorm:"column:avg_response_time;type:decimal(10,2)" json:"avg_response_time"` // Milliseconds
	AvgLoadTime     float64 `gorm:"column:avg_load_time;type:decimal(10,2)" json:"avg_load_time"`
	ErrorRate       float64 `gorm:"column:error_rate;type:decimal(5,2)" json:"error_rate"` // Percentage

	// Top Resources (3 fields)
	TopPages     JSONB `gorm:"column:top_pages;type:jsonb" json:"top_pages,omitempty"`
	TopCountries JSONB `gorm:"column:top_countries;type:jsonb" json:"top_countries,omitempty"`
	TopDevices   JSONB `gorm:"column:top_devices;type:jsonb" json:"top_devices,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (AccessAnalytics) TableName() string {
	return "access_analytics"
}

func (a *AccessAnalytics) GetSuccessRate() float64 {
	if a.TotalAccess == 0 {
		return 0
	}
	return (float64(a.SuccessfulAccess) / float64(a.TotalAccess)) * 100
}

func (a *AccessAnalytics) GetLoginSuccessRate() float64 {
	if a.TotalLogins == 0 {
		return 0
	}
	return (float64(a.SuccessfulLogins) / float64(a.TotalLogins)) * 100
}

// ============================================================================
// USER BEHAVIOR - User Behavior Patterns
// ============================================================================

type BehaviorPattern string

const (
	BehaviorPatternNormal      BehaviorPattern = "NORMAL"
	BehaviorPatternAnomaly     BehaviorPattern = "ANOMALY"
	BehaviorPatternSuspicious  BehaviorPattern = "SUSPICIOUS"
	BehaviorPatternPowerUser   BehaviorPattern = "POWER_USER"
	BehaviorPatternInactive    BehaviorPattern = "INACTIVE"
)

type UserBehavior struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;uniqueIndex:idx_user_date" json:"user_id"`

	// Period (2 fields)
	Date        time.Time       `gorm:"column:date;type:date;not null;uniqueIndex:idx_user_date" json:"date"`
	DayOfWeek   int             `gorm:"column:day_of_week;not null" json:"day_of_week"` // 0=Sunday

	// Access Pattern (6 fields)
	Pattern         BehaviorPattern `gorm:"column:pattern;type:varchar(20);not null;index" json:"pattern"`
	AccessCount     int64           `gorm:"column:access_count;default:0" json:"access_count"`
	LoginCount      int64           `gorm:"column:login_count;default:0" json:"login_count"`
	SessionCount    int64           `gorm:"column:session_count;default:0" json:"session_count"`
	UniquePages     int64           `gorm:"column:unique_pages;default:0" json:"unique_pages"`
	TotalTimeActive int64           `gorm:"column:total_time_active;default:0" json:"total_time_active"` // Seconds

	// Activity Hours (3 fields)
	FirstAccessAt time.Time `gorm:"column:first_access_at;not null" json:"first_access_at"`
	LastAccessAt  time.Time `gorm:"column:last_access_at;not null" json:"last_access_at"`
	PeakHour      int       `gorm:"column:peak_hour" json:"peak_hour"` // 0-23

	// Locations (3 fields)
	UniqueIPs       int64  `gorm:"column:unique_ips;default:0" json:"unique_ips"`
	UniqueCountries int64  `gorm:"column:unique_countries;default:0" json:"unique_countries"`
	Locations       JSONB  `gorm:"column:locations;type:jsonb" json:"locations,omitempty"`

	// Devices (3 fields)
	UniqueDevices  int64 `gorm:"column:unique_devices;default:0" json:"unique_devices"`
	DeviceTypes    JSONB `gorm:"column:device_types;type:jsonb" json:"device_types,omitempty"`
	NewDevice      bool  `gorm:"column:new_device;default:false" json:"new_device"`

	// Actions (3 fields)
	CreateActions  int64 `gorm:"column:create_actions;default:0" json:"create_actions"`
	ReadActions    int64 `gorm:"column:read_actions;default:0" json:"read_actions"`
	UpdateActions  int64 `gorm:"column:update_actions;default:0" json:"update_actions"`

	// Anomaly Detection (3 fields)
	AnomalyScore    float64 `gorm:"column:anomaly_score;type:decimal(5,2)" json:"anomaly_score"`
	IsAnomaly       bool    `gorm:"column:is_anomaly;default:false" json:"is_anomaly"`
	AnomalyReasons  JSONB   `gorm:"column:anomaly_reasons;type:jsonb" json:"anomaly_reasons,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (UserBehavior) TableName() string {
	return "user_behaviors"
}

func (u *UserBehavior) IsPowerUser() bool {
	return u.Pattern == BehaviorPatternPowerUser || u.AccessCount > 100
}

func (u *UserBehavior) IsAnomalous() bool {
	return u.IsAnomaly || u.AnomalyScore >= 70
}

// ============================================================================
// ACCESS REPORT - Access Reports
// ============================================================================

type ReportType string

const (
	ReportTypeAccess    ReportType = "ACCESS"
	ReportTypeSecurity  ReportType = "SECURITY"
	ReportTypeBehavior  ReportType = "BEHAVIOR"
	ReportTypeCompliance ReportType = "COMPLIANCE"
	ReportTypePerformance ReportType = "PERFORMANCE"
)

type ReportStatus string

const (
	ReportStatusPending    ReportStatus = "PENDING"
	ReportStatusGenerating ReportStatus = "GENERATING"
	ReportStatusCompleted  ReportStatus = "COMPLETED"
	ReportStatusFailed     ReportStatus = "FAILED"
)

type AccessReport struct {
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

	// Summary (15 fields)
	TotalAccess       int64   `gorm:"column:total_access;default:0" json:"total_access"`
	SuccessfulAccess  int64   `gorm:"column:successful_access;default:0" json:"successful_access"`
	FailedAccess      int64   `gorm:"column:failed_access;default:0" json:"failed_access"`
	TotalLogins       int64   `gorm:"column:total_logins;default:0" json:"total_logins"`
	SuccessfulLogins  int64   `gorm:"column:successful_logins;default:0" json:"successful_logins"`
	FailedLogins      int64   `gorm:"column:failed_logins;default:0" json:"failed_logins"`
	UniqueUsers       int64   `gorm:"column:unique_users;default:0" json:"unique_users"`
	ActiveUsers       int64   `gorm:"column:active_users;default:0" json:"active_users"`
	NewUsers          int64   `gorm:"column:new_users;default:0" json:"new_users"`
	SecurityEvents    int64   `gorm:"column:security_events;default:0" json:"security_events"`
	BlockedIPs        int64   `gorm:"column:blocked_ips;default:0" json:"blocked_ips"`
	AnomalousUsers    int64   `gorm:"column:anomalous_users;default:0" json:"anomalous_users"`
	AvgSessionTime    float64 `gorm:"column:avg_session_time;type:decimal(10,2)" json:"avg_session_time"`
	SuccessRate       float64 `gorm:"column:success_rate;type:decimal(5,2)" json:"success_rate"`
	LoginSuccessRate  float64 `gorm:"column:login_success_rate;type:decimal(5,2)" json:"login_success_rate"`

	// Analysis (5 fields)
	TopPages        JSONB `gorm:"column:top_pages;type:jsonb" json:"top_pages,omitempty"`
	TopCountries    JSONB `gorm:"column:top_countries;type:jsonb" json:"top_countries,omitempty"`
	TopDevices      JSONB `gorm:"column:top_devices;type:jsonb" json:"top_devices,omitempty"`
	TopUsers        JSONB `gorm:"column:top_users;type:jsonb" json:"top_users,omitempty"`
	Findings        JSONB `gorm:"column:findings;type:jsonb" json:"findings,omitempty"`

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

func (AccessReport) TableName() string {
	return "access_reports"
}

func (r *AccessReport) GetSuccessRate() float64 {
	if r.TotalAccess == 0 {
		return 0
	}
	return (float64(r.SuccessfulAccess) / float64(r.TotalAccess)) * 100
}

// ============================================================================
// ACCESS METRICS - Real-time Metrics
// ============================================================================

type MetricType string

const (
	MetricTypeCounter   MetricType = "COUNTER"
	MetricTypeGauge     MetricType = "GAUGE"
	MetricTypeHistogram MetricType = "HISTOGRAM"
)

type AccessMetrics struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	Name     string     `gorm:"column:name;type:varchar(255);not null;index" json:"name"`

	// Metric Info (4 fields)
	Type        MetricType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Value       float64    `gorm:"column:value;type:decimal(20,2);not null" json:"value"`
	Unit        *string    `gorm:"column:unit;type:varchar(50)" json:"unit,omitempty"`
	Description *string    `gorm:"column:description;type:text" json:"description,omitempty"`

	// Dimensions (2 fields)
	Dimensions JSONB `gorm:"column:dimensions;type:jsonb" json:"dimensions,omitempty"` // user_id, country, etc
	Tags       JSONB `gorm:"column:tags;type:jsonb" json:"tags,omitempty"`

	// Statistics (5 fields)
	Count   int64   `gorm:"column:count;default:0" json:"count"`
	Sum     float64 `gorm:"column:sum;type:decimal(20,2)" json:"sum"`
	Min     float64 `gorm:"column:min;type:decimal(20,2)" json:"min"`
	Max     float64 `gorm:"column:max;type:decimal(20,2)" json:"max"`
	Average float64 `gorm:"column:average;type:decimal(20,2)" json:"average"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (AccessMetrics) TableName() string {
	return "access_metrics"
}

// ============================================================================
// Helper Functions
// ============================================================================

// AggregateAnalytics aggregates analytics for a time period
func AggregateAnalytics(
	db *gorm.DB,
	interval AnalyticsInterval,
	bucketStart, bucketEnd time.Time,
	tenantID *uuid.UUID,
) error {
	analytics := &AccessAnalytics{
		TenantID:    tenantID,
		Interval:    interval,
		BucketStart: bucketStart,
		BucketEnd:   bucketEnd,
	}

	// Count total access
	query := db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd)

	if tenantID != nil {
		query = query.Where("tenant_id = ?", tenantID)
	}

	query.Count(&analytics.TotalAccess)

	// Count successful access
	db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", 
			bucketStart, bucketEnd, AccessStatusSuccess).
		Count(&analytics.SuccessfulAccess)

	// Count failed access
	db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", 
			bucketStart, bucketEnd, AccessStatusFailed).
		Count(&analytics.FailedAccess)

	// Count unique users
	db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Distinct("user_id").
		Count(&analytics.UniqueUsers)

	// Count logins
	db.Model(&LoginHistory{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Count(&analytics.TotalLogins)

	db.Model(&LoginHistory{}).
		Where("created_at BETWEEN ? AND ? AND is_successful = ?", 
			bucketStart, bucketEnd, true).
		Count(&analytics.SuccessfulLogins)

	// Count security events
	db.Model(&SecurityEvent{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Count(&analytics.SecurityEvents)

	return db.Create(analytics).Error
}

// TrackUserBehavior tracks daily user behavior
func TrackUserBehavior(
	db *gorm.DB,
	userID uuid.UUID,
	date time.Time,
) error {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	behavior := &UserBehavior{
		UserID:    userID,
		Date:      startOfDay,
		DayOfWeek: int(date.Weekday()),
		Pattern:   BehaviorPatternNormal,
	}

	// Count access
	db.Model(&AccessHistory{}).
		Where("user_id = ? AND created_at BETWEEN ? AND ?", 
			userID, startOfDay, endOfDay).
		Count(&behavior.AccessCount)

	// Count logins
	db.Model(&LoginHistory{}).
		Where("user_id = ? AND created_at BETWEEN ? AND ?", 
			userID, startOfDay, endOfDay).
		Count(&behavior.LoginCount)

	// Get first and last access
	var firstAccess, lastAccess AccessHistory
	db.Where("user_id = ? AND created_at BETWEEN ? AND ?", 
		userID, startOfDay, endOfDay).
		Order("created_at ASC").
		First(&firstAccess)
	
	db.Where("user_id = ? AND created_at BETWEEN ? AND ?", 
		userID, startOfDay, endOfDay).
		Order("created_at DESC").
		First(&lastAccess)

	if firstAccess.ID != uuid.Nil {
		behavior.FirstAccessAt = firstAccess.CreatedAt
		behavior.LastAccessAt = lastAccess.CreatedAt
	}

	// Count unique IPs
	db.Model(&AccessHistory{}).
		Where("user_id = ? AND created_at BETWEEN ? AND ?", 
			userID, startOfDay, endOfDay).
		Distinct("ip_address").
		Count(&behavior.UniqueIPs)

	// Determine pattern
	if behavior.AccessCount == 0 {
		behavior.Pattern = BehaviorPatternInactive
	} else if behavior.AccessCount > 100 {
		behavior.Pattern = BehaviorPatternPowerUser
	}

	return db.Create(behavior).Error
}

// GenerateAccessReport generates an access report
func GenerateAccessReport(
	db *gorm.DB,
	reportType ReportType,
	startDate, endDate time.Time,
	userID *uuid.UUID,
) (*AccessReport, error) {
	startTime := time.Now()

	report := &AccessReport{
		ReportNumber: generateReportNumber(),
		Type:         reportType,
		Status:       ReportStatusGenerating,
		Title:        fmt.Sprintf("%s Report", reportType),
		PeriodStart:  startDate,
		PeriodEnd:    endDate,
		GeneratedBy:  userID,
	}

	if err := db.Create(report).Error; err != nil {
		return nil, err
	}

	// Calculate statistics
	if err := calculateAccessStats(db, report, startDate, endDate); err != nil {
		report.Status = ReportStatusFailed
		report.ErrorMessage = strPtr(err.Error())
		db.Save(report)
		return report, err
	}

	// Complete report
	now := time.Now()
	generationTime := int(now.Sub(startTime).Seconds())
	report.Status = ReportStatusCompleted
	report.GeneratedAt = &now
	report.GenerationTime = &generationTime
	report.SuccessRate = report.GetSuccessRate()

	db.Save(report)

	return report, nil
}

func calculateAccessStats(
	db *gorm.DB,
	report *AccessReport,
	startDate, endDate time.Time,
) error {
	// Total access
	db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.TotalAccess)

	// Successful access
	db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", 
			startDate, endDate, AccessStatusSuccess).
		Count(&report.SuccessfulAccess)

	// Failed access
	db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", 
			startDate, endDate, AccessStatusFailed).
		Count(&report.FailedAccess)

	// Unique users
	db.Model(&AccessHistory{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Distinct("user_id").
		Count(&report.UniqueUsers)

	// Logins
	db.Model(&LoginHistory{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.TotalLogins)

	db.Model(&LoginHistory{}).
		Where("created_at BETWEEN ? AND ? AND is_successful = ?", 
			startDate, endDate, true).
		Count(&report.SuccessfulLogins)

	report.FailedLogins = report.TotalLogins - report.SuccessfulLogins

	// Security events
	db.Model(&SecurityEvent{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.SecurityEvents)

	// Calculate success rate
	if report.TotalAccess > 0 {
		report.SuccessRate = (float64(report.SuccessfulAccess) / 
			float64(report.TotalAccess)) * 100
	}

	if report.TotalLogins > 0 {
		report.LoginSuccessRate = (float64(report.SuccessfulLogins) / 
			float64(report.TotalLogins)) * 100
	}

	return nil
}

// RecordMetric records a metric value
func RecordMetric(
	db *gorm.DB,
	name string,
	metricType MetricType,
	value float64,
	dimensions map[string]interface{},
) error {
	metric := &AccessMetrics{
		Name:       name,
		Type:       metricType,
		Value:      value,
		Dimensions: dimensions,
		Count:      1,
		Sum:        value,
		Min:        value,
		Max:        value,
		Average:    value,
	}

	return db.Create(metric).Error
}

// GetAnalytics gets analytics for a time period
func GetAnalytics(
	db *gorm.DB,
	interval AnalyticsInterval,
	startDate, endDate time.Time,
) ([]AccessAnalytics, error) {
	var analytics []AccessAnalytics

	err := db.Where("interval = ? AND bucket_start BETWEEN ? AND ?", 
		interval, startDate, endDate).
		Order("bucket_start ASC").
		Find(&analytics).Error

	return analytics, err
}

// GetUserBehaviors gets user behaviors for a period
func GetUserBehaviors(
	db *gorm.DB,
	userID uuid.UUID,
	startDate, endDate time.Time,
) ([]UserBehavior, error) {
	var behaviors []UserBehavior

	err := db.Where("user_id = ? AND date BETWEEN ? AND ?", 
		userID, startDate, endDate).
		Order("date ASC").
		Find(&behaviors).Error

	return behaviors, err
}

// GetTopUsers gets most active users
func GetTopUsers(
	db *gorm.DB,
	startDate, endDate time.Time,
	limit int,
) ([]map[string]interface{}, error) {
	type UserAccess struct {
		UserID      uuid.UUID
		AccessCount int64
	}

	var users []UserAccess
	err := db.Model(&AccessHistory{}).
		Select("user_id, count(*) as access_count").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("user_id").
		Order("access_count DESC").
		Limit(limit).
		Scan(&users).Error

	result := make([]map[string]interface{}, len(users))
	for i, u := range users {
		result[i] = map[string]interface{}{
			"user_id": u.UserID,
			"count":   u.AccessCount,
		}
	}

	return result, err
}

func generateReportNumber() string {
	now := time.Now()
	return fmt.Sprintf("ACC-%s-%05d", 
		now.Format("20060102"), 
		now.Unix()%100000)
}
