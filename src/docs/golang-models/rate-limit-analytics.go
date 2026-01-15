package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// RATE LIMIT REPORT - Periodic Reports
// ============================================================================
// Purpose: Generate periodic rate limit reports
// Table: rate_limit_reports
// Primary Key: _id (UUID)
// Features: Automated reporting, Trends, Insights
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

type RateLimitReport struct {
	// ========== Identity (2 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// ========== Report Info (5 fields) ==========
	ReportNumber string       `gorm:"column:report_number;type:varchar(50);uniqueIndex;not null" json:"report_number"`
	Type         ReportType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status       ReportStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title        string       `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Description  *string      `gorm:"column:description;type:text" json:"description,omitempty"`

	// ========== Period (2 fields) ==========
	PeriodStart time.Time `gorm:"column:period_start;not null;index" json:"period_start"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null;index" json:"period_end"`

	// ========== Statistics (10 fields) ==========
	TotalRequests      int64 `gorm:"column:total_requests;default:0" json:"total_requests"`
	AllowedRequests    int64 `gorm:"column:allowed_requests;default:0" json:"allowed_requests"`
	BlockedRequests    int64 `gorm:"column:blocked_requests;default:0" json:"blocked_requests"`
	ThrottledRequests  int64 `gorm:"column:throttled_requests;default:0" json:"throttled_requests"`
	TotalViolations    int64 `gorm:"column:total_violations;default:0" json:"total_violations"`
	UniqueIdentifiers  int64 `gorm:"column:unique_identifiers;default:0" json:"unique_identifiers"`
	UniqueIPs          int64 `gorm:"column:unique_ips;default:0" json:"unique_ips"`
	AutoBlockedIPs     int64 `gorm:"column:auto_blocked_ips;default:0" json:"auto_blocked_ips"`
	AverageResponseTime float64 `gorm:"column:average_response_time;type:decimal(10,2)" json:"average_response_time"`
	TotalBandwidth     int64 `gorm:"column:total_bandwidth;default:0" json:"total_bandwidth"` // Bytes

	// ========== Top Lists (3 fields) ==========
	TopPolicies   JSONB `gorm:"column:top_policies;type:jsonb" json:"top_policies,omitempty"`
	TopEndpoints  JSONB `gorm:"column:top_endpoints;type:jsonb" json:"top_endpoints,omitempty"`
	TopViolators  JSONB `gorm:"column:top_violators;type:jsonb" json:"top_violators,omitempty"`

	// ========== Insights (2 fields) ==========
	Insights     JSONB   `gorm:"column:insights;type:jsonb" json:"insights,omitempty"`
	Recommendations JSONB `gorm:"column:recommendations;type:jsonb" json:"recommendations,omitempty"`

	// ========== Generation (4 fields) ==========
	GeneratedAt  *time.Time `gorm:"column:generated_at" json:"generated_at,omitempty"`
	GeneratedBy  *uuid.UUID `gorm:"column:generated_by;type:uuid" json:"generated_by,omitempty"`
	GenerationTime *int     `gorm:"column:generation_time" json:"generation_time,omitempty"` // Seconds
	ErrorMessage *string    `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// ========== Export (2 fields) ==========
	FileURL  *string `gorm:"column:file_url;type:text" json:"file_url,omitempty"`
	FileSize *int64  `gorm:"column:file_size" json:"file_size,omitempty"` // Bytes

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (2 fields) ==========
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (RateLimitReport) TableName() string {
	return "rate_limit_reports"
}

func (r *RateLimitReport) GetBlockedPercentage() float64 {
	if r.TotalRequests == 0 {
		return 0
	}
	return (float64(r.BlockedRequests) / float64(r.TotalRequests)) * 100
}

func (r *RateLimitReport) GetAllowedPercentage() float64 {
	if r.TotalRequests == 0 {
		return 0
	}
	return (float64(r.AllowedRequests) / float64(r.TotalRequests)) * 100
}

// ============================================================================
// RATE LIMIT ANALYTICS - Real-time Analytics
// ============================================================================
// Purpose: Real-time rate limiting analytics and metrics
// Table: rate_limit_analytics
// Primary Key: _id (UUID)
// Features: Time-series data, Aggregations, Trends
// ============================================================================

type AnalyticsInterval string

const (
	AnalyticsIntervalMinute AnalyticsInterval = "MINUTE"
	AnalyticsIntervalHour   AnalyticsInterval = "HOUR"
	AnalyticsIntervalDay    AnalyticsInterval = "DAY"
)

type RateLimitAnalytics struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PolicyID *uuid.UUID `gorm:"column:policy_id;type:uuid;index" json:"policy_id,omitempty"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Time Bucket (3 fields)
	Interval    AnalyticsInterval `gorm:"column:interval;type:varchar(20);not null;index" json:"interval"`
	BucketStart time.Time         `gorm:"column:bucket_start;not null;index" json:"bucket_start"`
	BucketEnd   time.Time         `gorm:"column:bucket_end;not null" json:"bucket_end"`

	// Request Metrics (6 fields)
	TotalRequests     int64 `gorm:"column:total_requests;default:0" json:"total_requests"`
	AllowedRequests   int64 `gorm:"column:allowed_requests;default:0" json:"allowed_requests"`
	BlockedRequests   int64 `gorm:"column:blocked_requests;default:0" json:"blocked_requests"`
	ThrottledRequests int64 `gorm:"column:throttled_requests;default:0" json:"throttled_requests"`
	UniqueIdentifiers int64 `gorm:"column:unique_identifiers;default:0" json:"unique_identifiers"`
	UniqueIPs         int64 `gorm:"column:unique_ips;default:0" json:"unique_ips"`

	// Performance Metrics (4 fields)
	AvgResponseTime float64 `gorm:"column:avg_response_time;type:decimal(10,2)" json:"avg_response_time"`
	MinResponseTime int     `gorm:"column:min_response_time" json:"min_response_time"`
	MaxResponseTime int     `gorm:"column:max_response_time" json:"max_response_time"`
	P95ResponseTime int     `gorm:"column:p95_response_time" json:"p95_response_time"`

	// Bandwidth (2 fields)
	TotalBytesSent     int64 `gorm:"column:total_bytes_sent;default:0" json:"total_bytes_sent"`
	TotalBytesReceived int64 `gorm:"column:total_bytes_received;default:0" json:"total_bytes_received"`

	// Violations (2 fields)
	ViolationCount int64 `gorm:"column:violation_count;default:0" json:"violation_count"`
	BlockedIPCount int64 `gorm:"column:blocked_ip_count;default:0" json:"blocked_ip_count"`

	// Top Items (3 fields)
	TopPaths     JSONB `gorm:"column:top_paths;type:jsonb" json:"top_paths,omitempty"`
	TopMethods   JSONB `gorm:"column:top_methods;type:jsonb" json:"top_methods,omitempty"`
	TopUserAgents JSONB `gorm:"column:top_user_agents;type:jsonb" json:"top_user_agents,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Policy *RateLimitPolicy `gorm:"foreignKey:PolicyID" json:"policy,omitempty"`
}

func (RateLimitAnalytics) TableName() string {
	return "rate_limit_analytics"
}

func (a *RateLimitAnalytics) GetBlockRate() float64 {
	if a.TotalRequests == 0 {
		return 0
	}
	return (float64(a.BlockedRequests) / float64(a.TotalRequests)) * 100
}

// ============================================================================
// RATE LIMIT TREND - Trend Analysis
// ============================================================================
// Purpose: Track trends and patterns over time
// Table: rate_limit_trends
// Primary Key: _id (UUID)
// Features: Anomaly detection, Forecasting, Pattern recognition
// ============================================================================

type TrendType string

const (
	TrendTypeTraffic     TrendType = "TRAFFIC"
	TrendTypeViolations  TrendType = "VIOLATIONS"
	TrendTypePerformance TrendType = "PERFORMANCE"
	TrendTypeAnomalies   TrendType = "ANOMALIES"
)

type TrendDirection string

const (
	TrendDirectionUp       TrendDirection = "UP"
	TrendDirectionDown     TrendDirection = "DOWN"
	TrendDirectionStable   TrendDirection = "STABLE"
	TrendDirectionVolatile TrendDirection = "VOLATILE"
)

type RateLimitTrend struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Trend Info (5 fields)
	Type        TrendType      `gorm:"column:type;type:varchar(30);not null;index" json:"type"`
	Direction   TrendDirection `gorm:"column:direction;type:varchar(20);not null" json:"direction"`
	Metric      string         `gorm:"column:metric;type:varchar(100);not null" json:"metric"`
	Description string         `gorm:"column:description;type:text;not null" json:"description"`
	Confidence  float64        `gorm:"column:confidence;type:decimal(5,2)" json:"confidence"` // 0-100%

	// Time Period (2 fields)
	PeriodStart time.Time `gorm:"column:period_start;not null;index" json:"period_start"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null;index" json:"period_end"`

	// Values (4 fields)
	StartValue   float64 `gorm:"column:start_value;type:decimal(20,4);not null" json:"start_value"`
	EndValue     float64 `gorm:"column:end_value;type:decimal(20,4);not null" json:"end_value"`
	ChangeAmount float64 `gorm:"column:change_amount;type:decimal(20,4)" json:"change_amount"`
	ChangePercent float64 `gorm:"column:change_percent;type:decimal(10,2)" json:"change_percent"`

	// Statistics (3 fields)
	AverageValue float64 `gorm:"column:average_value;type:decimal(20,4)" json:"average_value"`
	MinValue     float64 `gorm:"column:min_value;type:decimal(20,4)" json:"min_value"`
	MaxValue     float64 `gorm:"column:max_value;type:decimal(20,4)" json:"max_value"`

	// Anomalies (2 fields)
	HasAnomalies   bool  `gorm:"column:has_anomalies;default:false" json:"has_anomalies"`
	AnomalyDetails JSONB `gorm:"column:anomaly_details;type:jsonb" json:"anomaly_details,omitempty"`

	// Forecast (2 fields)
	ForecastValue *float64 `gorm:"column:forecast_value;type:decimal(20,4)" json:"forecast_value,omitempty"`
	ForecastPeriod *string `gorm:"column:forecast_period;type:varchar(50)" json:"forecast_period,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (RateLimitTrend) TableName() string {
	return "rate_limit_trends"
}

func (t *RateLimitTrend) IsSignificant() bool {
	return t.Confidence >= 80 && (t.ChangePercent >= 20 || t.ChangePercent <= -20)
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateReportNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("RPT-%s-%s", dateStr, randomStr)
}

// GenerateReport generates a rate limit report
func GenerateReport(
	db *gorm.DB,
	reportType ReportType,
	startDate, endDate time.Time,
	tenantID *uuid.UUID,
	userID *uuid.UUID,
) (*RateLimitReport, error) {
	startTime := time.Now()

	report := &RateLimitReport{
		TenantID:     tenantID,
		ReportNumber: generateReportNumber(),
		Type:         reportType,
		Status:       ReportStatusGenerating,
		Title:        fmt.Sprintf("%s Rate Limit Report", reportType),
		PeriodStart:  startDate,
		PeriodEnd:    endDate,
		GeneratedBy:  userID,
	}

	if err := db.Create(report).Error; err != nil {
		return nil, err
	}

	// Calculate statistics
	if err := calculateReportStats(db, report, startDate, endDate); err != nil {
		report.Status = ReportStatusFailed
		report.ErrorMessage = strPtr(err.Error())
		db.Save(report)
		return report, err
	}

	// Calculate top lists
	if err := calculateTopLists(db, report, startDate, endDate); err != nil {
		report.Status = ReportStatusFailed
		report.ErrorMessage = strPtr(err.Error())
		db.Save(report)
		return report, err
	}

	// Generate insights
	if err := generateInsights(db, report); err != nil {
		// Non-fatal error
		fmt.Printf("Warning: Failed to generate insights: %v\n", err)
	}

	// Complete report
	now := time.Now()
	generationTime := int(now.Sub(startTime).Seconds())
	report.Status = ReportStatusCompleted
	report.GeneratedAt = &now
	report.GenerationTime = &generationTime

	db.Save(report)

	return report, nil
}

func calculateReportStats(db *gorm.DB, report *RateLimitReport, startDate, endDate time.Time) error {
	// Total requests
	var totalRequests int64
	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ?", startDate, endDate).
		Count(&totalRequests)
	report.TotalRequests = totalRequests

	// Allowed requests
	var allowedRequests int64
	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ? AND allowed = ?", startDate, endDate, true).
		Count(&allowedRequests)
	report.AllowedRequests = allowedRequests

	// Blocked requests
	var blockedRequests int64
	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ? AND allowed = ?", startDate, endDate, false).
		Count(&blockedRequests)
	report.BlockedRequests = blockedRequests

	// Total violations
	var totalViolations int64
	db.Model(&RateLimitViolation{}).
		Where("violated_at BETWEEN ? AND ?", startDate, endDate).
		Count(&totalViolations)
	report.TotalViolations = totalViolations

	// Unique identifiers
	var uniqueIdentifiers int64
	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ?", startDate, endDate).
		Distinct("identifier").
		Count(&uniqueIdentifiers)
	report.UniqueIdentifiers = uniqueIdentifiers

	// Unique IPs
	var uniqueIPs int64
	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ?", startDate, endDate).
		Distinct("ip_address").
		Count(&uniqueIPs)
	report.UniqueIPs = uniqueIPs

	// Auto-blocked IPs
	var autoBlockedIPs int64
	db.Model(&RateLimitViolation{}).
		Where("violated_at BETWEEN ? AND ? AND is_auto_blocked = ?",
			startDate, endDate, true).
		Distinct("ip_address").
		Count(&autoBlockedIPs)
	report.AutoBlockedIPs = autoBlockedIPs

	// Average response time
	var avgResponseTime float64
	db.Model(&RateLimitRequest{}).
		Select("AVG(response_time)").
		Where("requested_at BETWEEN ? AND ? AND response_time IS NOT NULL",
			startDate, endDate).
		Scan(&avgResponseTime)
	report.AverageResponseTime = avgResponseTime

	return nil
}

func calculateTopLists(db *gorm.DB, report *RateLimitReport, startDate, endDate time.Time) error {
	// Top policies
	var topPolicies []struct {
		PolicyID uuid.UUID
		Count    int64
	}
	db.Model(&RateLimitRequest{}).
		Select("policy_id, count(*) as count").
		Where("requested_at BETWEEN ? AND ?", startDate, endDate).
		Group("policy_id").
		Order("count DESC").
		Limit(10).
		Scan(&topPolicies)

	topPoliciesJSON := make([]map[string]interface{}, len(topPolicies))
	for i, tp := range topPolicies {
		topPoliciesJSON[i] = map[string]interface{}{
			"policy_id": tp.PolicyID,
			"count":     tp.Count,
		}
	}
	report.TopPolicies = JSONB{"policies": topPoliciesJSON}

	// Top endpoints
	var topEndpoints []struct {
		Path  string
		Count int64
	}
	db.Model(&RateLimitRequest{}).
		Select("path, count(*) as count").
		Where("requested_at BETWEEN ? AND ?", startDate, endDate).
		Group("path").
		Order("count DESC").
		Limit(10).
		Scan(&topEndpoints)

	topEndpointsJSON := make([]map[string]interface{}, len(topEndpoints))
	for i, te := range topEndpoints {
		topEndpointsJSON[i] = map[string]interface{}{
			"path":  te.Path,
			"count": te.Count,
		}
	}
	report.TopEndpoints = JSONB{"endpoints": topEndpointsJSON}

	// Top violators
	violators, err := GetTopViolators(db, 10, startDate, endDate)
	if err != nil {
		return err
	}
	report.TopViolators = JSONB{"violators": violators}

	return nil
}

func generateInsights(db *gorm.DB, report *RateLimitReport) error {
	insights := make([]map[string]interface{}, 0)

	// Block rate insight
	blockRate := report.GetBlockedPercentage()
	if blockRate > 10 {
		insights = append(insights, map[string]interface{}{
			"type":        "warning",
			"title":       "High Block Rate",
			"description": fmt.Sprintf("%.1f%% of requests were blocked", blockRate),
			"recommendation": "Review rate limit policies or investigate potential abuse",
		})
	}

	// Violation insight
	if report.TotalViolations > 100 {
		insights = append(insights, map[string]interface{}{
			"type":        "alert",
			"title":       "High Violation Count",
			"description": fmt.Sprintf("%d violations detected", report.TotalViolations),
			"recommendation": "Consider tightening rate limits or investigating suspicious activity",
		})
	}

	// Auto-block insight
	if report.AutoBlockedIPs > 10 {
		insights = append(insights, map[string]interface{}{
			"type":        "info",
			"title":       "Multiple Auto-blocks",
			"description": fmt.Sprintf("%d IPs were automatically blocked", report.AutoBlockedIPs),
			"recommendation": "Review blocked IPs to ensure no false positives",
		})
	}

	report.Insights = JSONB{"insights": insights}

	return nil
}

// AggregateAnalytics aggregates analytics data
func AggregateAnalytics(
	db *gorm.DB,
	interval AnalyticsInterval,
	bucketStart, bucketEnd time.Time,
	policyID, tenantID *uuid.UUID,
) error {
	analytics := &RateLimitAnalytics{
		PolicyID:    policyID,
		TenantID:    tenantID,
		Interval:    interval,
		BucketStart: bucketStart,
		BucketEnd:   bucketEnd,
	}

	// Query requests in bucket
	query := db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ?", bucketStart, bucketEnd)

	if policyID != nil {
		query = query.Where("policy_id = ?", policyID)
	}

	// Total requests
	query.Count(&analytics.TotalRequests)

	// Allowed/Blocked
	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ? AND allowed = ?",
			bucketStart, bucketEnd, true).
		Count(&analytics.AllowedRequests)

	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ? AND allowed = ?",
			bucketStart, bucketEnd, false).
		Count(&analytics.BlockedRequests)

	// Unique counts
	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Distinct("identifier").
		Count(&analytics.UniqueIdentifiers)

	db.Model(&RateLimitRequest{}).
		Where("requested_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Distinct("ip_address").
		Count(&analytics.UniqueIPs)

	// Response times
	var responseStats struct {
		Avg float64
		Min int
		Max int
	}
	db.Model(&RateLimitRequest{}).
		Select("AVG(response_time) as avg, MIN(response_time) as min, MAX(response_time) as max").
		Where("requested_at BETWEEN ? AND ? AND response_time IS NOT NULL",
			bucketStart, bucketEnd).
		Scan(&responseStats)

	analytics.AvgResponseTime = responseStats.Avg
	analytics.MinResponseTime = responseStats.Min
	analytics.MaxResponseTime = responseStats.Max

	// Violations
	db.Model(&RateLimitViolation{}).
		Where("violated_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Count(&analytics.ViolationCount)

	return db.Create(analytics).Error
}

// DetectTrends detects trends in rate limiting data
func DetectTrends(
	db *gorm.DB,
	trendType TrendType,
	metric string,
	startDate, endDate time.Time,
) (*RateLimitTrend, error) {
	var startValue, endValue float64

	// Get start value
	switch trendType {
	case TrendTypeTraffic:
		db.Model(&RateLimitRequest{}).
			Where("requested_at >= ? AND requested_at < ?",
				startDate, startDate.Add(24*time.Hour)).
			Count(&startValue)

		db.Model(&RateLimitRequest{}).
			Where("requested_at >= ? AND requested_at < ?",
				endDate.Add(-24*time.Hour), endDate).
			Count(&endValue)

	case TrendTypeViolations:
		db.Model(&RateLimitViolation{}).
			Where("violated_at >= ? AND violated_at < ?",
				startDate, startDate.Add(24*time.Hour)).
			Count(&startValue)

		db.Model(&RateLimitViolation{}).
			Where("violated_at >= ? AND violated_at < ?",
				endDate.Add(-24*time.Hour), endDate).
			Count(&endValue)
	}

	// Calculate change
	changeAmount := endValue - startValue
	var changePercent float64
	if startValue > 0 {
		changePercent = (changeAmount / startValue) * 100
	}

	// Determine direction
	var direction TrendDirection
	if changePercent > 10 {
		direction = TrendDirectionUp
	} else if changePercent < -10 {
		direction = TrendDirectionDown
	} else {
		direction = TrendDirectionStable
	}

	// Calculate confidence
	confidence := calculateConfidence(startValue, endValue, changePercent)

	trend := &RateLimitTrend{
		Type:          trendType,
		Direction:     direction,
		Metric:        metric,
		Description:   fmt.Sprintf("%s trend: %.1f%% change", metric, changePercent),
		Confidence:    confidence,
		PeriodStart:   startDate,
		PeriodEnd:     endDate,
		StartValue:    startValue,
		EndValue:      endValue,
		ChangeAmount:  changeAmount,
		ChangePercent: changePercent,
	}

	return trend, db.Create(trend).Error
}

func calculateConfidence(startValue, endValue, changePercent float64) float64 {
	// Simple confidence calculation based on sample size and change magnitude
	sampleSize := (startValue + endValue) / 2
	
	if sampleSize < 100 {
		return 50.0
	}
	
	changeMagnitude := changePercent
	if changeMagnitude < 0 {
		changeMagnitude = -changeMagnitude
	}

	confidence := 60.0 + (changeMagnitude / 2)
	if confidence > 95 {
		confidence = 95
	}

	return confidence
}

// GetDashboardMetrics gets real-time dashboard metrics
func GetDashboardMetrics(db *gorm.DB, hours int) (map[string]interface{}, error) {
	since := time.Now().Add(-time.Duration(hours) * time.Hour)
	metrics := make(map[string]interface{})

	// Current hour requests
	var currentHourRequests int64
	db.Model(&RateLimitRequest{}).
		Where("requested_at >= ?", time.Now().Truncate(time.Hour)).
		Count(&currentHourRequests)
	metrics["current_hour_requests"] = currentHourRequests

	// Recent violations
	var recentViolations int64
	db.Model(&RateLimitViolation{}).
		Where("violated_at >= ?", since).
		Count(&recentViolations)
	metrics["recent_violations"] = recentViolations

	// Active blocks
	var activeBlocks int64
	db.Model(&IPBlacklist{}).
		Where("is_active = ?", true).
		Count(&activeBlocks)
	metrics["active_blocks"] = activeBlocks

	// Block rate
	var totalRequests, blockedRequests int64
	db.Model(&RateLimitRequest{}).
		Where("requested_at >= ?", since).
		Count(&totalRequests)
	db.Model(&RateLimitRequest{}).
		Where("requested_at >= ? AND allowed = ?", since, false).
		Count(&blockedRequests)

	blockRate := 0.0
	if totalRequests > 0 {
		blockRate = (float64(blockedRequests) / float64(totalRequests)) * 100
	}
	metrics["block_rate"] = blockRate

	// Top policies
	var topPolicies []struct {
		PolicyID uuid.UUID
		Count    int64
	}
	db.Model(&RateLimitRequest{}).
		Select("policy_id, count(*) as count").
		Where("requested_at >= ?", since).
		Group("policy_id").
		Order("count DESC").
		Limit(5).
		Scan(&topPolicies)
	metrics["top_policies"] = topPolicies

	return metrics, nil
}

// CleanupOldReports removes old reports
func CleanupOldReports(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("created_at < ?", cutoff).
		Delete(&RateLimitReport{}).Error
}

// CleanupOldAnalytics removes old analytics data
func CleanupOldAnalytics(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("bucket_start < ?", cutoff).
		Delete(&RateLimitAnalytics{}).Error
}
