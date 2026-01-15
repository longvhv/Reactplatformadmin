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
// RATE LIMIT POLICY - Rate Limiting Policies
// ============================================================================
// Purpose: Define rate limiting policies for API protection
// Table: rate_limit_policies
// Primary Key: _id (UUID)
// Features: Multi-algorithm, Flexible limits, Hierarchical rules
// ============================================================================

type LimitAlgorithm string

const (
	LimitAlgorithmFixedWindow   LimitAlgorithm = "FIXED_WINDOW"   // Fixed time window
	LimitAlgorithmSlidingWindow LimitAlgorithm = "SLIDING_WINDOW" // Sliding time window
	LimitAlgorithmTokenBucket   LimitAlgorithm = "TOKEN_BUCKET"   // Token bucket
	LimitAlgorithmLeakyBucket   LimitAlgorithm = "LEAKY_BUCKET"   // Leaky bucket
	LimitAlgorithmConcurrency   LimitAlgorithm = "CONCURRENCY"    // Concurrent requests
)

type PolicyScope string

const (
	PolicyScopeGlobal       PolicyScope = "GLOBAL"        // Global limit
	PolicyScopeTenant       PolicyScope = "TENANT"        // Per tenant
	PolicyScopeUser         PolicyScope = "USER"          // Per user
	PolicyScopeIP           PolicyScope = "IP"            // Per IP address
	PolicyScopeAPIKey       PolicyScope = "API_KEY"       // Per API key
	PolicyScopeEndpoint     PolicyScope = "ENDPOINT"      // Per endpoint
	PolicyScopeUserEndpoint PolicyScope = "USER_ENDPOINT" // Per user per endpoint
)

type PolicyStatus string

const (
	PolicyStatusActive   PolicyStatus = "ACTIVE"
	PolicyStatusInactive PolicyStatus = "INACTIVE"
	PolicyStatusTesting  PolicyStatus = "TESTING"
)

type TimeWindow string

const (
	TimeWindowSecond TimeWindow = "SECOND"
	TimeWindowMinute TimeWindow = "MINUTE"
	TimeWindowHour   TimeWindow = "HOUR"
	TimeWindowDay    TimeWindow = "DAY"
	TimeWindowMonth  TimeWindow = "MONTH"
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
// RateLimitPolicy Model (29 fields)
// ============================================================================

type RateLimitPolicy struct {
	// ========== Identity (2 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// ========== Policy Info (6 fields) ==========
	Code        string       `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string       `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string      `gorm:"column:description;type:text" json:"description,omitempty"`
	Status      PolicyStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Priority    int          `gorm:"column:priority;default:100" json:"priority"` // Lower = higher priority
	IsDefault   bool         `gorm:"column:is_default;default:false" json:"is_default"`

	// ========== Limit Configuration (7 fields) ==========
	Algorithm    LimitAlgorithm `gorm:"column:algorithm;type:varchar(30);not null" json:"algorithm"`
	Scope        PolicyScope    `gorm:"column:scope;type:varchar(30);not null;index" json:"scope"`
	MaxRequests  int            `gorm:"column:max_requests;not null" json:"max_requests"`
	TimeWindow   TimeWindow     `gorm:"column:time_window;type:varchar(20);not null" json:"time_window"`
	WindowSeconds int           `gorm:"column:window_seconds;not null" json:"window_seconds"` // Calculated from TimeWindow
	BurstSize    *int           `gorm:"column:burst_size" json:"burst_size,omitempty"`         // For token bucket
	RefillRate   *float64       `gorm:"column:refill_rate;type:decimal(10,4)" json:"refill_rate,omitempty"` // Tokens per second

	// ========== Scope Filters (4 fields) ==========
	TargetPaths  JSONB  `gorm:"column:target_paths;type:jsonb" json:"target_paths,omitempty"`   // Array of paths
	ExcludePaths JSONB  `gorm:"column:exclude_paths;type:jsonb" json:"exclude_paths,omitempty"` // Array of paths
	TargetMethods JSONB `gorm:"column:target_methods;type:jsonb" json:"target_methods,omitempty"` // GET, POST, etc.
	TargetIPs    JSONB  `gorm:"column:target_ips;type:jsonb" json:"target_ips,omitempty"`       // IP whitelist/blacklist

	// ========== Actions (3 fields) ==========
	BlockDuration *int  `gorm:"column:block_duration" json:"block_duration,omitempty"` // Seconds to block after violation
	SendAlert     bool  `gorm:"column:send_alert;default:false" json:"send_alert"`
	LogViolation  bool  `gorm:"column:log_violation;default:true" json:"log_violation"`

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
	Rules []RateLimitRule `gorm:"foreignKey:PolicyID" json:"rules,omitempty"`
	Quotas []RateLimitQuota `gorm:"foreignKey:PolicyID" json:"quotas,omitempty"`
}

func (RateLimitPolicy) TableName() string {
	return "rate_limit_policies"
}

// Helper Methods
func (p *RateLimitPolicy) IsActive() bool {
	return p.Status == PolicyStatusActive
}

func (p *RateLimitPolicy) GetWindowDuration() time.Duration {
	return time.Duration(p.WindowSeconds) * time.Second
}

func (p *RateLimitPolicy) AppliesTo(path, method, ip string) bool {
	// Check excluded paths
	if p.ExcludePaths != nil {
		if excludePaths, ok := p.ExcludePaths["paths"].([]interface{}); ok {
			for _, ep := range excludePaths {
				if epStr, ok := ep.(string); ok && epStr == path {
					return false
				}
			}
		}
	}

	// Check target paths
	if p.TargetPaths != nil {
		if targetPaths, ok := p.TargetPaths["paths"].([]interface{}); ok {
			found := false
			for _, tp := range targetPaths {
				if tpStr, ok := tp.(string); ok && tpStr == path {
					found = true
					break
				}
			}
			if !found {
				return false
			}
		}
	}

	// Check methods
	if p.TargetMethods != nil {
		if methods, ok := p.TargetMethods["methods"].([]interface{}); ok {
			found := false
			for _, m := range methods {
				if mStr, ok := m.(string); ok && mStr == method {
					found = true
					break
				}
			}
			if !found {
				return false
			}
		}
	}

	return true
}

// ============================================================================
// RATE LIMIT RULE - Fine-grained Rate Limit Rules
// ============================================================================

type RuleType string

const (
	RuleTypeOverride  RuleType = "OVERRIDE"  // Override policy limits
	RuleTypeException RuleType = "EXCEPTION" // Exception for specific users/IPs
	RuleTypeCustom    RuleType = "CUSTOM"    // Custom rule
)

type RateLimitRule struct {
	// Identity (2 fields)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PolicyID uuid.UUID `gorm:"column:policy_id;type:uuid;not null;index" json:"policy_id"`

	// Rule Info (6 fields)
	Name        string    `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string   `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        RuleType  `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Priority    int       `gorm:"column:priority;default:100" json:"priority"`
	IsActive    bool      `gorm:"column:is_active;default:true" json:"is_active"`
	IsWhitelist bool      `gorm:"column:is_whitelist;default:false" json:"is_whitelist"` // If true, bypass limits

	// Target (5 fields)
	TargetUserID  *uuid.UUID `gorm:"column:target_user_id;type:uuid;index" json:"target_user_id,omitempty"`
	TargetTenantID *uuid.UUID `gorm:"column:target_tenant_id;type:uuid;index" json:"target_tenant_id,omitempty"`
	TargetIPAddress *string  `gorm:"column:target_ip_address;type:varchar(50)" json:"target_ip_address,omitempty"`
	TargetAPIKey   *string   `gorm:"column:target_api_key;type:varchar(255)" json:"target_api_key,omitempty"`
	TargetPath     *string   `gorm:"column:target_path;type:varchar(255)" json:"target_path,omitempty"`

	// Custom Limits (3 fields)
	CustomMaxRequests *int       `gorm:"column:custom_max_requests" json:"custom_max_requests,omitempty"`
	CustomTimeWindow  *TimeWindow `gorm:"column:custom_time_window;type:varchar(20)" json:"custom_time_window,omitempty"`
	CustomWindowSeconds *int     `gorm:"column:custom_window_seconds" json:"custom_window_seconds,omitempty"`

	// Validity (2 fields)
	ValidFrom *time.Time `gorm:"column:valid_from" json:"valid_from,omitempty"`
	ValidUntil *time.Time `gorm:"column:valid_until" json:"valid_until,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Policy *RateLimitPolicy `gorm:"foreignKey:PolicyID" json:"policy,omitempty"`
}

func (RateLimitRule) TableName() string {
	return "rate_limit_rules"
}

func (r *RateLimitRule) IsValid() bool {
	if !r.IsActive {
		return false
	}

	now := time.Now()
	if r.ValidFrom != nil && now.Before(*r.ValidFrom) {
		return false
	}
	if r.ValidUntil != nil && now.After(*r.ValidUntil) {
		return false
	}

	return true
}

func (r *RateLimitRule) GetMaxRequests(defaultMax int) int {
	if r.CustomMaxRequests != nil {
		return *r.CustomMaxRequests
	}
	return defaultMax
}

func (r *RateLimitRule) GetWindowSeconds(defaultWindow int) int {
	if r.CustomWindowSeconds != nil {
		return *r.CustomWindowSeconds
	}
	return defaultWindow
}

// ============================================================================
// RATE LIMIT QUOTA - User/Tenant Quotas
// ============================================================================

type QuotaType string

const (
	QuotaTypeRequest  QuotaType = "REQUEST"  // Request count quota
	QuotaTypeBandwidth QuotaType = "BANDWIDTH" // Bandwidth quota
	QuotaTypeCompute  QuotaType = "COMPUTE"  // Compute time quota
	QuotaTypeStorage  QuotaType = "STORAGE"  // Storage quota
	QuotaTypeCustom   QuotaType = "CUSTOM"   // Custom quota
)

type QuotaPeriod string

const (
	QuotaPeriodHourly  QuotaPeriod = "HOURLY"
	QuotaPeriodDaily   QuotaPeriod = "DAILY"
	QuotaPeriodWeekly  QuotaPeriod = "WEEKLY"
	QuotaPeriodMonthly QuotaPeriod = "MONTHLY"
	QuotaPeriodYearly  QuotaPeriod = "YEARLY"
	QuotaPeriodCustom  QuotaPeriod = "CUSTOM"
)

type RateLimitQuota struct {
	// Identity (2 fields)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PolicyID uuid.UUID `gorm:"column:policy_id;type:uuid;not null;index" json:"policy_id"`

	// Quota Info (5 fields)
	Name        string      `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        QuotaType   `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Period      QuotaPeriod `gorm:"column:period;type:varchar(20);not null" json:"period"`
	IsActive    bool        `gorm:"column:is_active;default:true" json:"is_active"`

	// Limits (5 fields)
	MaxAmount     float64  `gorm:"column:max_amount;type:decimal(20,4);not null" json:"max_amount"`
	Unit          string   `gorm:"column:unit;type:varchar(20);not null" json:"unit"` // requests, MB, seconds
	WarnThreshold *float64 `gorm:"column:warn_threshold;type:decimal(5,2)" json:"warn_threshold,omitempty"` // % threshold for warning
	HardLimit     bool     `gorm:"column:hard_limit;default:true" json:"hard_limit"` // Block when exceeded
	ResetOnPeriod bool     `gorm:"column:reset_on_period;default:true" json:"reset_on_period"` // Auto reset each period

	// Scope (3 fields)
	TargetUserID   *uuid.UUID `gorm:"column:target_user_id;type:uuid;index" json:"target_user_id,omitempty"`
	TargetTenantID *uuid.UUID `gorm:"column:target_tenant_id;type:uuid;index" json:"target_tenant_id,omitempty"`
	TargetAPIKey   *string    `gorm:"column:target_api_key;type:varchar(255)" json:"target_api_key,omitempty"`

	// Current Usage (4 fields)
	CurrentUsage     float64    `gorm:"column:current_usage;type:decimal(20,4);default:0" json:"current_usage"`
	LastResetAt      *time.Time `gorm:"column:last_reset_at" json:"last_reset_at,omitempty"`
	NextResetAt      *time.Time `gorm:"column:next_reset_at" json:"next_reset_at,omitempty"`
	LastUsageUpdate  *time.Time `gorm:"column:last_usage_update" json:"last_usage_update,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Policy *RateLimitPolicy `gorm:"foreignKey:PolicyID" json:"policy,omitempty"`
}

func (RateLimitQuota) TableName() string {
	return "rate_limit_quotas"
}

// Helper Methods
func (q *RateLimitQuota) IsExceeded() bool {
	return q.CurrentUsage >= q.MaxAmount
}

func (q *RateLimitQuota) IsNearLimit() bool {
	if q.WarnThreshold == nil {
		return false
	}
	usagePercent := (q.CurrentUsage / q.MaxAmount) * 100
	return usagePercent >= *q.WarnThreshold
}

func (q *RateLimitQuota) GetRemainingAmount() float64 {
	remaining := q.MaxAmount - q.CurrentUsage
	if remaining < 0 {
		return 0
	}
	return remaining
}

func (q *RateLimitQuota) GetUsagePercentage() float64 {
	return (q.CurrentUsage / q.MaxAmount) * 100
}

func (q *RateLimitQuota) AddUsage(amount float64) error {
	if q.HardLimit && q.IsExceeded() {
		return errors.New("quota exceeded")
	}

	q.CurrentUsage += amount
	now := time.Now()
	q.LastUsageUpdate = &now

	return nil
}

func (q *RateLimitQuota) Reset() {
	q.CurrentUsage = 0
	now := time.Now()
	q.LastResetAt = &now
	q.NextResetAt = q.calculateNextReset()
}

func (q *RateLimitQuota) calculateNextReset() *time.Time {
	if !q.ResetOnPeriod {
		return nil
	}

	now := time.Now()
	var next time.Time

	switch q.Period {
	case QuotaPeriodHourly:
		next = now.Add(time.Hour)
	case QuotaPeriodDaily:
		next = now.AddDate(0, 0, 1)
	case QuotaPeriodWeekly:
		next = now.AddDate(0, 0, 7)
	case QuotaPeriodMonthly:
		next = now.AddDate(0, 1, 0)
	case QuotaPeriodYearly:
		next = now.AddDate(1, 0, 0)
	default:
		next = now.AddDate(0, 1, 0)
	}

	return &next
}

// ============================================================================
// IP BLACKLIST - IP Address Blacklist
// ============================================================================

type BlacklistReason string

const (
	BlacklistReasonAbuse      BlacklistReason = "ABUSE"
	BlacklistReasonBotTraffic BlacklistReason = "BOT_TRAFFIC"
	BlacklistReasonSecurity   BlacklistReason = "SECURITY"
	BlacklistReasonViolation  BlacklistReason = "VIOLATION"
	BlacklistReasonManual     BlacklistReason = "MANUAL"
)

type IPBlacklist struct {
	// Identity (1 field)
	ID uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`

	// IP Info (4 fields)
	IPAddress string `gorm:"column:ip_address;type:varchar(50);uniqueIndex;not null" json:"ip_address"`
	IPRange   *string `gorm:"column:ip_range;type:varchar(100)" json:"ip_range,omitempty"` // CIDR notation
	IsActive  bool   `gorm:"column:is_active;default:true" json:"is_active"`
	IsPermanent bool `gorm:"column:is_permanent;default:false" json:"is_permanent"`

	// Reason (3 fields)
	Reason      BlacklistReason `gorm:"column:reason;type:varchar(30);not null" json:"reason"`
	Description *string         `gorm:"column:description;type:text" json:"description,omitempty"`
	ViolationCount int          `gorm:"column:violation_count;default:0" json:"violation_count"`

	// Duration (3 fields)
	BlockedAt   time.Time  `gorm:"column:blocked_at;not null;index" json:"blocked_at"`
	BlockedUntil *time.Time `gorm:"column:blocked_until" json:"blocked_until,omitempty"`
	UnblockedAt *time.Time `gorm:"column:unblocked_at" json:"unblocked_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
}

func (IPBlacklist) TableName() string {
	return "ip_blacklist"
}

func (b *IPBlacklist) IsBlocked() bool {
	if !b.IsActive {
		return false
	}

	if b.IsPermanent {
		return true
	}

	if b.BlockedUntil != nil && time.Now().After(*b.BlockedUntil) {
		return false
	}

	return true
}

func (b *IPBlacklist) Unblock() {
	b.IsActive = false
	now := time.Now()
	b.UnblockedAt = &now
}

// ============================================================================
// IP WHITELIST - IP Address Whitelist
// ============================================================================

type IPWhitelist struct {
	// Identity (1 field)
	ID uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`

	// IP Info (4 fields)
	IPAddress   string  `gorm:"column:ip_address;type:varchar(50);uniqueIndex;not null" json:"ip_address"`
	IPRange     *string `gorm:"column:ip_range;type:varchar(100)" json:"ip_range,omitempty"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	IsActive    bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Scope (2 fields)
	BypassAllLimits bool       `gorm:"column:bypass_all_limits;default:true" json:"bypass_all_limits"`
	AllowedPaths    JSONB      `gorm:"column:allowed_paths;type:jsonb" json:"allowed_paths,omitempty"`

	// Validity (2 fields)
	ValidFrom  *time.Time `gorm:"column:valid_from" json:"valid_from,omitempty"`
	ValidUntil *time.Time `gorm:"column:valid_until" json:"valid_until,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
}

func (IPWhitelist) TableName() string {
	return "ip_whitelist"
}

func (w *IPWhitelist) IsValid() bool {
	if !w.IsActive {
		return false
	}

	now := time.Now()
	if w.ValidFrom != nil && now.Before(*w.ValidFrom) {
		return false
	}
	if w.ValidUntil != nil && now.After(*w.ValidUntil) {
		return false
	}

	return true
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreatePolicy creates a new rate limit policy
func CreatePolicy(
	db *gorm.DB,
	policy *RateLimitPolicy,
	rules []RateLimitRule,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		policy.CreatedBy = userID
		policy.WindowSeconds = getWindowSeconds(policy.TimeWindow)

		if err := tx.Create(policy).Error; err != nil {
			return err
		}

		if len(rules) > 0 {
			for i := range rules {
				rules[i].PolicyID = policy.ID
				rules[i].CreatedBy = userID
			}
			if err := tx.Create(&rules).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// GetApplicablePolicy gets the most applicable policy for a request
func GetApplicablePolicy(
	db *gorm.DB,
	scope PolicyScope,
	path, method, ip string,
	userID, tenantID *uuid.UUID,
) (*RateLimitPolicy, error) {
	var policies []RateLimitPolicy

	query := db.Where("status = ? AND scope = ?", PolicyStatusActive, scope).
		Order("priority ASC")

	if err := query.Find(&policies).Error; err != nil {
		return nil, err
	}

	// Find first matching policy
	for _, policy := range policies {
		if policy.AppliesTo(path, method, ip) {
			return &policy, nil
		}
	}

	// Fallback to default policy
	var defaultPolicy RateLimitPolicy
	err := db.Where("status = ? AND is_default = ?", PolicyStatusActive, true).
		First(&defaultPolicy).Error

	if err != nil {
		return nil, err
	}

	return &defaultPolicy, nil
}

// CheckRateLimit checks if a request is within rate limits
func CheckRateLimit(
	db *gorm.DB,
	identifier string, // user_id, ip, api_key, etc.
	policyID uuid.UUID,
	maxRequests int,
	windowSeconds int,
) (bool, int, error) {
	// This would be implemented with Redis or similar for production
	// Here's a database-based example

	var policy RateLimitPolicy
	if err := db.First(&policy, policyID).Error; err != nil {
		return false, 0, err
	}

	// Count requests in window
	windowStart := time.Now().Add(-time.Duration(windowSeconds) * time.Second)
	
	var count int64
	err := db.Table("rate_limit_requests").
		Where("identifier = ? AND policy_id = ? AND requested_at >= ?",
			identifier, policyID, windowStart).
		Count(&count).Error

	if err != nil {
		return false, 0, err
	}

	remaining := maxRequests - int(count)
	if remaining < 0 {
		remaining = 0
	}

	allowed := int(count) < maxRequests

	return allowed, remaining, nil
}

// AddQuotaUsage adds usage to a quota
func AddQuotaUsage(
	db *gorm.DB,
	quotaID uuid.UUID,
	amount float64,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var quota RateLimitQuota
		if err := tx.First(&quota, quotaID).Error; err != nil {
			return err
		}

		// Check if needs reset
		if quota.NextResetAt != nil && time.Now().After(*quota.NextResetAt) {
			quota.Reset()
		}

		// Add usage
		if err := quota.AddUsage(amount); err != nil {
			return err
		}

		return tx.Save(&quota).Error
	})
}

// BlockIP blocks an IP address
func BlockIP(
	db *gorm.DB,
	ipAddress string,
	reason BlacklistReason,
	durationSeconds int,
	userID *uuid.UUID,
) error {
	blockedUntil := time.Now().Add(time.Duration(durationSeconds) * time.Second)

	blacklist := &IPBlacklist{
		IPAddress:    ipAddress,
		IsActive:     true,
		IsPermanent:  durationSeconds == 0,
		Reason:       reason,
		BlockedAt:    time.Now(),
		BlockedUntil: &blockedUntil,
		CreatedBy:    userID,
	}

	if durationSeconds == 0 {
		blacklist.BlockedUntil = nil
	}

	return db.Create(blacklist).Error
}

// IsIPBlocked checks if an IP is blocked
func IsIPBlocked(db *gorm.DB, ipAddress string) (bool, error) {
	var blacklist IPBlacklist
	err := db.Where("ip_address = ? AND is_active = ?", ipAddress, true).
		First(&blacklist).Error

	if err == gorm.ErrRecordNotFound {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return blacklist.IsBlocked(), nil
}

// IsIPWhitelisted checks if an IP is whitelisted
func IsIPWhitelisted(db *gorm.DB, ipAddress string) (bool, error) {
	var whitelist IPWhitelist
	err := db.Where("ip_address = ? AND is_active = ?", ipAddress, true).
		First(&whitelist).Error

	if err == gorm.ErrRecordNotFound {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return whitelist.IsValid(), nil
}

// ResetExpiredQuotas resets quotas that have passed their reset time
func ResetExpiredQuotas(db *gorm.DB) error {
	var quotas []RateLimitQuota

	err := db.Where("next_reset_at IS NOT NULL AND next_reset_at <= ? AND reset_on_period = ?",
		time.Now(), true).Find(&quotas).Error

	if err != nil {
		return err
	}

	for _, quota := range quotas {
		quota.Reset()
		if err := db.Save(&quota).Error; err != nil {
			return err
		}
	}

	return nil
}

// UnblockExpiredIPs unblocks IPs that have reached their unblock time
func UnblockExpiredIPs(db *gorm.DB) error {
	return db.Model(&IPBlacklist{}).
		Where("is_active = ? AND is_permanent = ? AND blocked_until IS NOT NULL AND blocked_until <= ?",
			true, false, time.Now()).
		Updates(map[string]interface{}{
			"is_active":    false,
			"unblocked_at": time.Now(),
		}).Error
}

func getWindowSeconds(window TimeWindow) int {
	switch window {
	case TimeWindowSecond:
		return 1
	case TimeWindowMinute:
		return 60
	case TimeWindowHour:
		return 3600
	case TimeWindowDay:
		return 86400
	case TimeWindowMonth:
		return 2592000 // 30 days
	default:
		return 60
	}
}

func strPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

func floatPtr(f float64) *float64 {
	return &f
}
