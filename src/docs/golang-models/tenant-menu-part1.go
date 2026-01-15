package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ==================== APP ROUTES ====================

// RouteStatus represents the operational status of a route
type RouteStatus string

const (
	RouteStatusActive      RouteStatus = "ACTIVE"
	RouteStatusInactive    RouteStatus = "INACTIVE"
	RouteStatusMaintenance RouteStatus = "MAINTENANCE"
	RouteStatusPendingDNS  RouteStatus = "PENDING_DNS"
)

// IsValid validates route status
func (s RouteStatus) IsValid() bool {
	switch s {
	case RouteStatusActive, RouteStatusInactive, RouteStatusMaintenance, RouteStatusPendingDNS:
		return true
	}
	return false
}

// SSLStatus represents the SSL certificate status
type SSLStatus string

const (
	SSLStatusNone    SSLStatus = "NONE"
	SSLStatusPending SSLStatus = "PENDING"
	SSLStatusActive  SSLStatus = "ACTIVE"
	SSLStatusFailed  SSLStatus = "FAILED"
)

// IsValid validates SSL status
func (s SSLStatus) IsValid() bool {
	switch s {
	case SSLStatusNone, SSLStatusPending, SSLStatusActive, SSLStatusFailed:
		return true
	}
	return false
}

// RouteScope defines the scope of route application
type RouteScope string

const (
	RouteScopeSpecificDomain RouteScope = "SPECIFIC_DOMAIN"
	RouteScopeAllMyDomains   RouteScope = "ALL_MY_DOMAINS"
	RouteScopeInherited      RouteScope = "INHERITED"
)

// IsValid validates route scope
func (s RouteScope) IsValid() bool {
	switch s {
	case RouteScopeSpecificDomain, RouteScopeAllMyDomains, RouteScopeInherited:
		return true
	}
	return false
}

// TenantAppRoute represents domain-based routing configuration for tenants
// Table: tenant_app_routes
type TenantAppRoute struct {
	ID             uuid.UUID   `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID       uuid.UUID   `gorm:"column:tenant_id;type:uuid;not null;index:idx_tenant_app_routes_tenant" json:"tenant_id"`
	AppCode        string      `gorm:"column:app_code;type:varchar(100);not null;index:idx_tenant_app_routes_app" json:"app_code"`
	Domain         *string     `gorm:"column:domain;type:varchar(255);index:idx_tenant_app_routes_domain" json:"domain"`
	PathPrefix     string      `gorm:"column:path_prefix;type:varchar(255);not null;default:'/'" json:"path_prefix"`
	IsPrimary      bool        `gorm:"column:is_primary;type:boolean;not null;default:false" json:"is_primary"`
	IsCustomDomain bool        `gorm:"column:is_custom_domain;type:boolean;not null;default:false" json:"is_custom_domain"`
	SSLStatus      SSLStatus   `gorm:"column:ssl_status;type:varchar(20);not null;default:'NONE'" json:"ssl_status"`
	Status         RouteStatus `gorm:"column:status;type:varchar(20);not null;default:'ACTIVE';index:idx_tenant_app_routes_status" json:"status"`
	RouteScope     RouteScope  `gorm:"column:route_scope;type:varchar(50);not null;default:'SPECIFIC_DOMAIN'" json:"route_scope"`
	CreatedAt      time.Time   `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt      time.Time   `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	Version        int64       `gorm:"column:version;type:bigint;not null;default:1" json:"version"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (TenantAppRoute) TableName() string {
	return "tenant_app_routes"
}

// BeforeCreate hook
func (tar *TenantAppRoute) BeforeCreate(tx *gorm.DB) error {
	if tar.ID == uuid.Nil {
		tar.ID = uuid.New()
	}

	// Set defaults
	if tar.PathPrefix == "" {
		tar.PathPrefix = "/"
	}
	if tar.SSLStatus == "" {
		tar.SSLStatus = SSLStatusNone
	}
	if tar.Status == "" {
		tar.Status = RouteStatusActive
	}
	if tar.RouteScope == "" {
		tar.RouteScope = RouteScopeSpecificDomain
	}

	return tar.Validate()
}

// BeforeUpdate hook
func (tar *TenantAppRoute) BeforeUpdate(tx *gorm.DB) error {
	tar.UpdatedAt = time.Now()
	tar.Version++
	return tar.Validate()
}

// Validate validates the app route
func (tar *TenantAppRoute) Validate() error {
	if tar.AppCode == "" {
		return errors.New("app_code is required")
	}

	if !tar.Status.IsValid() {
		return errors.New("invalid route status")
	}
	if !tar.SSLStatus.IsValid() {
		return errors.New("invalid SSL status")
	}
	if !tar.RouteScope.IsValid() {
		return errors.New("invalid route scope")
	}

	// Validate path prefix starts with /
	if !strings.HasPrefix(tar.PathPrefix, "/") {
		return errors.New("path_prefix must start with /")
	}

	return nil
}

// IsActive checks if route is active
func (tar *TenantAppRoute) IsActive() bool {
	return tar.Status == RouteStatusActive
}

// HasSSL checks if SSL is active
func (tar *TenantAppRoute) HasSSL() bool {
	return tar.SSLStatus == SSLStatusActive
}

// GetFullURL returns the full URL for the route
func (tar *TenantAppRoute) GetFullURL() string {
	if tar.Domain == nil || *tar.Domain == "" {
		return tar.PathPrefix
	}

	protocol := "http"
	if tar.HasSSL() {
		protocol = "https"
	}

	return fmt.Sprintf("%s://%s%s", protocol, *tar.Domain, tar.PathPrefix)
}

// CreateTenantAppRouteRequest represents the request to create an app route
type CreateTenantAppRouteRequest struct {
	TenantID       uuid.UUID  `json:"tenant_id" binding:"required"`
	AppCode        string     `json:"app_code" binding:"required"`
	Domain         *string    `json:"domain,omitempty"`
	PathPrefix     string     `json:"path_prefix,omitempty"`
	IsPrimary      bool       `json:"is_primary,omitempty"`
	IsCustomDomain bool       `json:"is_custom_domain,omitempty"`
	SSLStatus      SSLStatus  `json:"ssl_status,omitempty"`
	Status         RouteStatus `json:"status,omitempty"`
	RouteScope     RouteScope `json:"route_scope,omitempty"`
}

// UpdateTenantAppRouteRequest represents the request to update an app route
type UpdateTenantAppRouteRequest struct {
	AppCode        *string     `json:"app_code,omitempty"`
	Domain         *string     `json:"domain,omitempty"`
	PathPrefix     *string     `json:"path_prefix,omitempty"`
	IsPrimary      *bool       `json:"is_primary,omitempty"`
	IsCustomDomain *bool       `json:"is_custom_domain,omitempty"`
	SSLStatus      *SSLStatus  `json:"ssl_status,omitempty"`
	Status         *RouteStatus `json:"status,omitempty"`
	RouteScope     *RouteScope `json:"route_scope,omitempty"`
	Version        int64       `json:"version" binding:"required"`
}

// TenantAppRouteResponse represents the API response
type TenantAppRouteResponse struct {
	ID             uuid.UUID   `json:"_id"`
	TenantID       uuid.UUID   `json:"tenant_id"`
	AppCode        string      `json:"app_code"`
	Domain         *string     `json:"domain"`
	PathPrefix     string      `json:"path_prefix"`
	IsPrimary      bool        `json:"is_primary"`
	IsCustomDomain bool        `json:"is_custom_domain"`
	SSLStatus      SSLStatus   `json:"ssl_status"`
	Status         RouteStatus `json:"status"`
	RouteScope     RouteScope  `json:"route_scope"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
	Version        int64       `json:"version"`
}

// ToResponse converts to response
func (tar *TenantAppRoute) ToResponse() *TenantAppRouteResponse {
	return &TenantAppRouteResponse{
		ID:             tar.ID,
		TenantID:       tar.TenantID,
		AppCode:        tar.AppCode,
		Domain:         tar.Domain,
		PathPrefix:     tar.PathPrefix,
		IsPrimary:      tar.IsPrimary,
		IsCustomDomain: tar.IsCustomDomain,
		SSLStatus:      tar.SSLStatus,
		Status:         tar.Status,
		RouteScope:     tar.RouteScope,
		CreatedAt:      tar.CreatedAt,
		UpdatedAt:      tar.UpdatedAt,
		Version:        tar.Version,
	}
}

// RouteStats provides statistics for app routes
type RouteStats struct {
	Total         int                        `json:"total"`
	Primary       int                        `json:"primary"`
	CustomDomains int                        `json:"custom_domains"`
	SSLActive     int                        `json:"ssl_active"`
	SSLPending    int                        `json:"ssl_pending"`
	SSLFailed     int                        `json:"ssl_failed"`
	ByAppCode     map[string]int             `json:"by_app_code"`
	ByStatus      map[RouteStatus]int        `json:"by_status"`
	ByRouteScope  map[RouteScope]int         `json:"by_route_scope"`
}

// Query Scopes
func ScopeRoutesByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeActiveRoutes(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", RouteStatusActive)
}

func ScopePrimaryRoutes(db *gorm.DB) *gorm.DB {
	return db.Where("is_primary = ?", true)
}

func ScopeCustomDomainRoutes(db *gorm.DB) *gorm.DB {
	return db.Where("is_custom_domain = ?", true)
}

// ==================== RATE LIMITS ====================

// ResourceType represents the type of resource being rate limited
type ResourceType string

const (
	ResourceTypeAPI      ResourceType = "api"
	ResourceTypeStorage  ResourceType = "storage"
	ResourceTypeDatabase ResourceType = "database"
	ResourceTypeCompute  ResourceType = "compute"
	ResourceTypeNetwork  ResourceType = "network"
	ResourceTypeEmail    ResourceType = "email"
	ResourceTypeSMS      ResourceType = "sms"
)

// IsValid validates resource type
func (r ResourceType) IsValid() bool {
	switch r {
	case ResourceTypeAPI, ResourceTypeStorage, ResourceTypeDatabase, ResourceTypeCompute,
		ResourceTypeNetwork, ResourceTypeEmail, ResourceTypeSMS:
		return true
	}
	return false
}

// LimitType represents the rate limiting algorithm
type LimitType string

const (
	LimitTypeSlidingWindow LimitType = "sliding_window"
	LimitTypeFixedWindow   LimitType = "fixed_window"
	LimitTypeTokenBucket   LimitType = "token_bucket"
	LimitTypeLeakyBucket   LimitType = "leaky_bucket"
)

// IsValid validates limit type
func (l LimitType) IsValid() bool {
	switch l {
	case LimitTypeSlidingWindow, LimitTypeFixedWindow, LimitTypeTokenBucket, LimitTypeLeakyBucket:
		return true
	}
	return false
}

// LimitScope represents the scope of rate limiting
type LimitScope string

const (
	LimitScopeTenant LimitScope = "tenant"
	LimitScopeUser   LimitScope = "user"
	LimitScopeIP     LimitScope = "ip"
	LimitScopeAPIKey LimitScope = "api_key"
	LimitScopeGlobal LimitScope = "global"
)

// IsValid validates limit scope
func (l LimitScope) IsValid() bool {
	switch l {
	case LimitScopeTenant, LimitScopeUser, LimitScopeIP, LimitScopeAPIKey, LimitScopeGlobal:
		return true
	}
	return false
}

// WindowUnit represents the time window unit
type WindowUnit string

const (
	WindowUnitSecond WindowUnit = "second"
	WindowUnitMinute WindowUnit = "minute"
	WindowUnitHour   WindowUnit = "hour"
	WindowUnitDay    WindowUnit = "day"
	WindowUnitMonth  WindowUnit = "month"
)

// IsValid validates window unit
func (w WindowUnit) IsValid() bool {
	switch w {
	case WindowUnitSecond, WindowUnitMinute, WindowUnitHour, WindowUnitDay, WindowUnitMonth:
		return true
	}
	return false
}

// GetSeconds returns the number of seconds for the window unit
func (w WindowUnit) GetSeconds() int {
	switch w {
	case WindowUnitSecond:
		return 1
	case WindowUnitMinute:
		return 60
	case WindowUnitHour:
		return 3600
	case WindowUnitDay:
		return 86400
	case WindowUnitMonth:
		return 2592000 // 30 days
	}
	return 0
}

// TenantRateLimit represents rate limiting configuration for tenants
// Table: tenant_rate_limits
type TenantRateLimit struct {
	ID                 uuid.UUID     `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID           uuid.UUID     `gorm:"column:tenant_id;type:uuid;not null;index:idx_tenant_rate_limits_tenant" json:"tenant_id"`
	ServicePackageID   *uuid.UUID    `gorm:"column:service_package_id;type:uuid" json:"service_package_id"`
	LimitName          string        `gorm:"column:limit_name;type:varchar(255);not null" json:"limit_name"`
	LimitKey           string        `gorm:"column:limit_key;type:varchar(255);not null;uniqueIndex:idx_tenant_rate_limits_key" json:"limit_key"`
	ResourceType       *ResourceType `gorm:"column:resource_type;type:varchar(50)" json:"resource_type"`
	EndpointPattern    *string       `gorm:"column:endpoint_pattern;type:varchar(500)" json:"endpoint_pattern"`
	MaxRequests        int           `gorm:"column:max_requests;type:int;not null" json:"max_requests"`
	TimeWindow         int           `gorm:"column:time_window;type:int;not null" json:"time_window"`
	WindowUnit         WindowUnit    `gorm:"column:window_unit;type:varchar(20);not null;default:'second'" json:"window_unit"`
	BurstLimit         *int          `gorm:"column:burst_limit;type:int" json:"burst_limit"`
	ConcurrentLimit    *int          `gorm:"column:concurrent_limit;type:int" json:"concurrent_limit"`
	LimitType          LimitType     `gorm:"column:limit_type;type:varchar(50);not null;default:'sliding_window'" json:"limit_type"`
	LimitScope         LimitScope    `gorm:"column:limit_scope;type:varchar(50);not null;default:'tenant'" json:"limit_scope"`
	IsEnabled          bool          `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"is_enabled"`
	IsStrict           bool          `gorm:"column:is_strict;type:boolean;not null;default:true" json:"is_strict"`
	BlockDuration      *int          `gorm:"column:block_duration;type:int" json:"block_duration"`
	RetryAfter         *int          `gorm:"column:retry_after;type:int" json:"retry_after"`
	CustomErrorMessage *string       `gorm:"column:custom_error_message;type:text" json:"custom_error_message"`
	CustomErrorCode    *string       `gorm:"column:custom_error_code;type:varchar(100)" json:"custom_error_code"`
	CurrentUsage       int           `gorm:"column:current_usage;type:int;not null;default:0" json:"current_usage"`
	PeakUsage          int           `gorm:"column:peak_usage;type:int;not null;default:0" json:"peak_usage"`
	LastExceededAt     *time.Time    `gorm:"column:last_exceeded_at;type:timestamptz" json:"last_exceeded_at"`
	ExceededCount      int           `gorm:"column:exceeded_count;type:int;not null;default:0" json:"exceeded_count"`
	AlertThreshold     *int          `gorm:"column:alert_threshold;type:int" json:"alert_threshold"`
	AlertEnabled       bool          `gorm:"column:alert_enabled;type:boolean;not null;default:false" json:"alert_enabled"`
	Priority           int           `gorm:"column:priority;type:int;not null;default:0" json:"priority"`
	CanOverride        bool          `gorm:"column:can_override;type:boolean;not null;default:false" json:"can_override"`
	OverrideUntil      *time.Time    `gorm:"column:override_until;type:timestamptz" json:"override_until"`
	Description        *string       `gorm:"column:description;type:text" json:"description"`
	Tags               StringArray   `gorm:"column:tags;type:text[]" json:"tags"`
	Metadata           JSONB         `gorm:"column:metadata;type:jsonb;not null;default:'{}'" json:"metadata"`
	CreatedAt          time.Time     `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt          time.Time     `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	CreatedBy          *uuid.UUID    `gorm:"column:created_by;type:uuid" json:"created_by"`
	UpdatedBy          *uuid.UUID    `gorm:"column:updated_by;type:uuid" json:"updated_by"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (TenantRateLimit) TableName() string {
	return "tenant_rate_limits"
}

// StringArray custom type for PostgreSQL text[]
type StringArray []string

// Value implements driver.Valuer
func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	// PostgreSQL array format: {val1,val2,val3}
	return fmt.Sprintf("{%s}", strings.Join(s, ",")), nil
}

// Scan implements sql.Scanner
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal StringArray value")
	}

	str := string(bytes)
	// Remove { and }
	str = strings.Trim(str, "{}")
	if str == "" {
		*s = []string{}
		return nil
	}

	*s = strings.Split(str, ",")
	return nil
}

// JSONB custom type for PostgreSQL jsonb
type JSONB map[string]interface{}

// Value implements driver.Valuer
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(j)
}

// Scan implements sql.Scanner
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = make(map[string]interface{})
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal JSONB value")
	}

	return json.Unmarshal(bytes, j)
}

// BeforeCreate hook
func (trl *TenantRateLimit) BeforeCreate(tx *gorm.DB) error {
	if trl.ID == uuid.Nil {
		trl.ID = uuid.New()
	}

	// Set defaults
	if trl.WindowUnit == "" {
		trl.WindowUnit = WindowUnitSecond
	}
	if trl.LimitType == "" {
		trl.LimitType = LimitTypeSlidingWindow
	}
	if trl.LimitScope == "" {
		trl.LimitScope = LimitScopeTenant
	}
	if trl.Tags == nil {
		trl.Tags = []string{}
	}
	if trl.Metadata == nil {
		trl.Metadata = make(map[string]interface{})
	}

	return trl.Validate()
}

// BeforeUpdate hook
func (trl *TenantRateLimit) BeforeUpdate(tx *gorm.DB) error {
	trl.UpdatedAt = time.Now()
	return trl.Validate()
}

// Validate validates the rate limit
func (trl *TenantRateLimit) Validate() error {
	if trl.LimitName == "" {
		return errors.New("limit_name is required")
	}
	if trl.LimitKey == "" {
		return errors.New("limit_key is required")
	}
	if trl.MaxRequests <= 0 {
		return errors.New("max_requests must be positive")
	}
	if trl.TimeWindow <= 0 {
		return errors.New("time_window must be positive")
	}

	if trl.ResourceType != nil && !trl.ResourceType.IsValid() {
		return errors.New("invalid resource_type")
	}
	if !trl.LimitType.IsValid() {
		return errors.New("invalid limit_type")
	}
	if !trl.LimitScope.IsValid() {
		return errors.New("invalid limit_scope")
	}
	if !trl.WindowUnit.IsValid() {
		return errors.New("invalid window_unit")
	}

	return nil
}

// IsLimitExceeded checks if current usage exceeds the limit
func (trl *TenantRateLimit) IsLimitExceeded() bool {
	return trl.CurrentUsage >= trl.MaxRequests
}

// ShouldAlert checks if alert threshold is reached
func (trl *TenantRateLimit) ShouldAlert() bool {
	if !trl.AlertEnabled || trl.AlertThreshold == nil {
		return false
	}
	return trl.CurrentUsage >= *trl.AlertThreshold
}

// GetUsagePercent returns usage percentage
func (trl *TenantRateLimit) GetUsagePercent() float64 {
	if trl.MaxRequests == 0 {
		return 0
	}
	return float64(trl.CurrentUsage) / float64(trl.MaxRequests) * 100
}

// GetTimeWindowSeconds returns time window in seconds
func (trl *TenantRateLimit) GetTimeWindowSeconds() int {
	return trl.TimeWindow * trl.WindowUnit.GetSeconds()
}

// IncrementUsage increments current usage
func (trl *TenantRateLimit) IncrementUsage(count int) {
	trl.CurrentUsage += count
	if trl.CurrentUsage > trl.PeakUsage {
		trl.PeakUsage = trl.CurrentUsage
	}

	if trl.IsLimitExceeded() {
		now := time.Now()
		trl.LastExceededAt = &now
		trl.ExceededCount++
	}
}

// ResetUsage resets current usage
func (trl *TenantRateLimit) ResetUsage() {
	trl.CurrentUsage = 0
}

// CreateTenantRateLimitRequest represents the request to create a rate limit
type CreateTenantRateLimitRequest struct {
	TenantID           uuid.UUID     `json:"tenant_id" binding:"required"`
	ServicePackageID   *uuid.UUID    `json:"service_package_id,omitempty"`
	LimitName          string        `json:"limit_name" binding:"required"`
	LimitKey           string        `json:"limit_key" binding:"required"`
	ResourceType       *ResourceType `json:"resource_type,omitempty"`
	EndpointPattern    *string       `json:"endpoint_pattern,omitempty"`
	MaxRequests        int           `json:"max_requests" binding:"required,gt=0"`
	TimeWindow         int           `json:"time_window" binding:"required,gt=0"`
	WindowUnit         WindowUnit    `json:"window_unit,omitempty"`
	BurstLimit         *int          `json:"burst_limit,omitempty"`
	ConcurrentLimit    *int          `json:"concurrent_limit,omitempty"`
	LimitType          LimitType     `json:"limit_type,omitempty"`
	LimitScope         LimitScope    `json:"limit_scope,omitempty"`
	IsEnabled          bool          `json:"is_enabled,omitempty"`
	IsStrict           bool          `json:"is_strict,omitempty"`
	BlockDuration      *int          `json:"block_duration,omitempty"`
	RetryAfter         *int          `json:"retry_after,omitempty"`
	CustomErrorMessage *string       `json:"custom_error_message,omitempty"`
	CustomErrorCode    *string       `json:"custom_error_code,omitempty"`
	AlertThreshold     *int          `json:"alert_threshold,omitempty"`
	AlertEnabled       bool          `json:"alert_enabled,omitempty"`
	Priority           int           `json:"priority,omitempty"`
	CanOverride        bool          `json:"can_override,omitempty"`
	OverrideUntil      *time.Time    `json:"override_until,omitempty"`
	Description        *string       `json:"description,omitempty"`
	Tags               []string      `json:"tags,omitempty"`
	Metadata           JSONB         `json:"metadata,omitempty"`
	CreatedBy          *uuid.UUID    `json:"created_by,omitempty"`
}

// UpdateTenantRateLimitRequest represents the request to update a rate limit
type UpdateTenantRateLimitRequest struct {
	ServicePackageID   *uuid.UUID    `json:"service_package_id,omitempty"`
	LimitName          *string       `json:"limit_name,omitempty"`
	LimitKey           *string       `json:"limit_key,omitempty"`
	ResourceType       *ResourceType `json:"resource_type,omitempty"`
	EndpointPattern    *string       `json:"endpoint_pattern,omitempty"`
	MaxRequests        *int          `json:"max_requests,omitempty"`
	TimeWindow         *int          `json:"time_window,omitempty"`
	WindowUnit         *WindowUnit   `json:"window_unit,omitempty"`
	BurstLimit         *int          `json:"burst_limit,omitempty"`
	ConcurrentLimit    *int          `json:"concurrent_limit,omitempty"`
	LimitType          *LimitType    `json:"limit_type,omitempty"`
	LimitScope         *LimitScope   `json:"limit_scope,omitempty"`
	IsEnabled          *bool         `json:"is_enabled,omitempty"`
	IsStrict           *bool         `json:"is_strict,omitempty"`
	BlockDuration      *int          `json:"block_duration,omitempty"`
	RetryAfter         *int          `json:"retry_after,omitempty"`
	CustomErrorMessage *string       `json:"custom_error_message,omitempty"`
	CustomErrorCode    *string       `json:"custom_error_code,omitempty"`
	AlertThreshold     *int          `json:"alert_threshold,omitempty"`
	AlertEnabled       *bool         `json:"alert_enabled,omitempty"`
	Priority           *int          `json:"priority,omitempty"`
	CanOverride        *bool         `json:"can_override,omitempty"`
	OverrideUntil      *time.Time    `json:"override_until,omitempty"`
	Description        *string       `json:"description,omitempty"`
	Tags               []string      `json:"tags,omitempty"`
	Metadata           JSONB         `json:"metadata,omitempty"`
	UpdatedBy          *uuid.UUID    `json:"updated_by,omitempty"`
}

// TenantRateLimitResponse represents the API response
type TenantRateLimitResponse struct {
	ID                 uuid.UUID     `json:"_id"`
	TenantID           uuid.UUID     `json:"tenant_id"`
	ServicePackageID   *uuid.UUID    `json:"service_package_id"`
	LimitName          string        `json:"limit_name"`
	LimitKey           string        `json:"limit_key"`
	ResourceType       *ResourceType `json:"resource_type"`
	EndpointPattern    *string       `json:"endpoint_pattern"`
	MaxRequests        int           `json:"max_requests"`
	TimeWindow         int           `json:"time_window"`
	WindowUnit         WindowUnit    `json:"window_unit"`
	BurstLimit         *int          `json:"burst_limit"`
	ConcurrentLimit    *int          `json:"concurrent_limit"`
	LimitType          LimitType     `json:"limit_type"`
	LimitScope         LimitScope    `json:"limit_scope"`
	IsEnabled          bool          `json:"is_enabled"`
	IsStrict           bool          `json:"is_strict"`
	BlockDuration      *int          `json:"block_duration"`
	RetryAfter         *int          `json:"retry_after"`
	CustomErrorMessage *string       `json:"custom_error_message"`
	CustomErrorCode    *string       `json:"custom_error_code"`
	CurrentUsage       int           `json:"current_usage"`
	PeakUsage          int           `json:"peak_usage"`
	LastExceededAt     *time.Time    `json:"last_exceeded_at"`
	ExceededCount      int           `json:"exceeded_count"`
	AlertThreshold     *int          `json:"alert_threshold"`
	AlertEnabled       bool          `json:"alert_enabled"`
	Priority           int           `json:"priority"`
	CanOverride        bool          `json:"can_override"`
	OverrideUntil      *time.Time    `json:"override_until"`
	Description        *string       `json:"description"`
	Tags               []string      `json:"tags"`
	Metadata           JSONB         `json:"metadata"`
	CreatedAt          time.Time     `json:"created_at"`
	UpdatedAt          time.Time     `json:"updated_at"`
	CreatedBy          *uuid.UUID    `json:"created_by"`
	UpdatedBy          *uuid.UUID    `json:"updated_by"`
}

// ToResponse converts to response
func (trl *TenantRateLimit) ToResponse() *TenantRateLimitResponse {
	return &TenantRateLimitResponse{
		ID:                 trl.ID,
		TenantID:           trl.TenantID,
		ServicePackageID:   trl.ServicePackageID,
		LimitName:          trl.LimitName,
		LimitKey:           trl.LimitKey,
		ResourceType:       trl.ResourceType,
		EndpointPattern:    trl.EndpointPattern,
		MaxRequests:        trl.MaxRequests,
		TimeWindow:         trl.TimeWindow,
		WindowUnit:         trl.WindowUnit,
		BurstLimit:         trl.BurstLimit,
		ConcurrentLimit:    trl.ConcurrentLimit,
		LimitType:          trl.LimitType,
		LimitScope:         trl.LimitScope,
		IsEnabled:          trl.IsEnabled,
		IsStrict:           trl.IsStrict,
		BlockDuration:      trl.BlockDuration,
		RetryAfter:         trl.RetryAfter,
		CustomErrorMessage: trl.CustomErrorMessage,
		CustomErrorCode:    trl.CustomErrorCode,
		CurrentUsage:       trl.CurrentUsage,
		PeakUsage:          trl.PeakUsage,
		LastExceededAt:     trl.LastExceededAt,
		ExceededCount:      trl.ExceededCount,
		AlertThreshold:     trl.AlertThreshold,
		AlertEnabled:       trl.AlertEnabled,
		Priority:           trl.Priority,
		CanOverride:        trl.CanOverride,
		OverrideUntil:      trl.OverrideUntil,
		Description:        trl.Description,
		Tags:               trl.Tags,
		Metadata:           trl.Metadata,
		CreatedAt:          trl.CreatedAt,
		UpdatedAt:          trl.UpdatedAt,
		CreatedBy:          trl.CreatedBy,
		UpdatedBy:          trl.UpdatedBy,
	}
}

// RateLimitStats provides statistics for rate limits
type RateLimitStats struct {
	Total          int                      `json:"total"`
	Enabled        int                      `json:"enabled"`
	Exceeded       int                      `json:"exceeded"`
	NearLimit      int                      `json:"near_limit"`
	ByResourceType map[ResourceType]int     `json:"by_resource_type"`
	ByLimitType    map[LimitType]int        `json:"by_limit_type"`
	ByLimitScope   map[LimitScope]int       `json:"by_limit_scope"`
	ByWindowUnit   map[WindowUnit]int       `json:"by_window_unit"`
}

// Query Scopes
func ScopeRateLimitsByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeEnabledRateLimits(db *gorm.DB) *gorm.DB {
	return db.Where("is_enabled = ?", true)
}

func ScopeRateLimitsByScope(scope LimitScope) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("limit_scope = ?", scope)
	}
}

func ScopeRateLimitsByResourceType(resourceType ResourceType) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("resource_type = ?", resourceType)
	}
}
