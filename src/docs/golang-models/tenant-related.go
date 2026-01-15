package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ==================== TENANT STATS ====================

// TenantStats provides aggregated statistics for a tenant
// This is a VIEW or computed aggregation, not a physical table
type TenantStats struct {
	// Tenant Identity
	TenantID   uuid.UUID `json:"tenant_id"`
	TenantName string    `json:"tenant_name"`
	TenantCode string    `json:"tenant_code"`
	Tier       string    `json:"tier"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`

	// User & Organization Metrics
	MembersCount     int `json:"members_count"`
	ActiveMembers    int `json:"active_members"`
	DepartmentsCount int `json:"departments_count"`
	UserGroupsCount  int `json:"user_groups_count"`
	LocationsCount   int `json:"locations_count"`
	RolesCount       int `json:"roles_count"`

	// Business Metrics
	ActiveSubscriptions int     `json:"active_subscriptions"`
	MonthlyRevenue      float64 `json:"monthly_revenue"`
	TotalOrders         int     `json:"total_orders"`
	UnpaidInvoices      int     `json:"unpaid_invoices"`

	// Technical Metrics
	AppRoutesCount  int     `json:"app_routes_count"`
	WebhooksCount   int     `json:"webhooks_count"`
	RateLimitsCount int     `json:"rate_limits_count"`
	SSOConfigsCount int     `json:"sso_configs_count"`
	StorageUsedGB   float64 `json:"storage_used_gb"`
	APICallsMonth   int64   `json:"api_calls_month"`

	// Activity
	LastActivityAt *time.Time `json:"last_activity_at,omitempty"`
}

// ==================== TENANT ACTIVITY ====================

// ActivityAction represents types of actions in activity log
type ActivityAction string

const (
	ActivityActionCreate   ActivityAction = "CREATE"
	ActivityActionUpdate   ActivityAction = "UPDATE"
	ActivityActionDelete   ActivityAction = "DELETE"
	ActivityActionView     ActivityAction = "VIEW"
	ActivityActionExport   ActivityAction = "EXPORT"
	ActivityActionImport   ActivityAction = "IMPORT"
	ActivityActionLogin    ActivityAction = "LOGIN"
	ActivityActionLogout   ActivityAction = "LOGOUT"
	ActivityActionInvite   ActivityAction = "INVITE"
	ActivityActionActivate ActivityAction = "ACTIVATE"
	ActivityActionSuspend  ActivityAction = "SUSPEND"
)

// ActivityResource represents resource types being acted upon
type ActivityResource string

const (
	ActivityResourceTenant      ActivityResource = "TENANT"
	ActivityResourceUser        ActivityResource = "USER"
	ActivityResourceRole        ActivityResource = "ROLE"
	ActivityResourcePermission  ActivityResource = "PERMISSION"
	ActivityResourceDepartment  ActivityResource = "DEPARTMENT"
	ActivityResourceUserGroup   ActivityResource = "USER_GROUP"
	ActivityResourceLocation    ActivityResource = "LOCATION"
	ActivityResourceAppRoute    ActivityResource = "APP_ROUTE"
	ActivityResourceRateLimit   ActivityResource = "RATE_LIMIT"
	ActivityResourceWebhook     ActivityResource = "WEBHOOK"
	ActivityResourceSSOConfig   ActivityResource = "SSO_CONFIG"
	ActivityResourceDelegation  ActivityResource = "DELEGATION"
	ActivityResourceUserSession ActivityResource = "USER_SESSION"
	ActivityResourceUserDevice  ActivityResource = "USER_DEVICE"
)

// TenantActivity represents an activity log entry for a tenant
// Table: tenant_activities
type TenantActivity struct {
	ID        uuid.UUID        `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID  uuid.UUID        `gorm:"column:tenant_id;type:uuid;not null;index:idx_tenant_activities_tenant" json:"tenant_id"`
	UserID    uuid.UUID        `gorm:"column:user_id;type:uuid;not null;index:idx_tenant_activities_user" json:"user_id"`
	UserName  string           `gorm:"column:user_name;type:varchar(255);not null" json:"user_name"`
	UserEmail string           `gorm:"column:user_email;type:varchar(255);not null" json:"user_email"`
	Action    ActivityAction   `gorm:"column:action;type:varchar(50);not null;index:idx_tenant_activities_action" json:"action"`
	Resource  ActivityResource `gorm:"column:resource;type:varchar(50);not null;index:idx_tenant_activities_resource" json:"resource"`
	Details   string           `gorm:"column:details;type:text" json:"details"`
	IPAddress string           `gorm:"column:ip_address;type:varchar(45)" json:"ip_address"` // IPv4/IPv6
	UserAgent string           `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	CreatedAt time.Time        `gorm:"column:created_at;type:timestamptz;not null;default:now();index:idx_tenant_activities_created" json:"created_at"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (TenantActivity) TableName() string {
	return "tenant_activities"
}

// BeforeCreate hook
func (ta *TenantActivity) BeforeCreate(tx *gorm.DB) error {
	if ta.ID == uuid.Nil {
		ta.ID = uuid.New()
	}
	return nil
}

// ==================== TENANT MEMBER ====================

// MemberStatus represents the status of a tenant member
type MemberStatus string

const (
	MemberStatusActive    MemberStatus = "ACTIVE"
	MemberStatusInvited   MemberStatus = "INVITED"
	MemberStatusSuspended MemberStatus = "SUSPENDED"
	MemberStatusResigned  MemberStatus = "RESIGNED"
)

// IsValid validates member status
func (s MemberStatus) IsValid() bool {
	switch s {
	case MemberStatusActive, MemberStatusInvited, MemberStatusSuspended, MemberStatusResigned:
		return true
	}
	return false
}

// TenantMember represents a user's membership in a tenant
// This is typically a JOIN result from user_tenants table with user details
// Table: user_tenants (with user join)
type TenantMember struct {
	ID          uuid.UUID    `json:"_id"`
	UserID      uuid.UUID    `json:"user_id"`
	Email       string       `json:"email"`
	FullName    string       `json:"full_name"`
	AvatarURL   *string      `json:"avatar_url,omitempty"`
	DisplayName *string      `json:"display_name,omitempty"`
	Status      MemberStatus `json:"status"`
	JoinedAt    time.Time    `json:"joined_at"`
	Roles       []string     `json:"roles"`       // Array of role codes
	Departments []string     `json:"departments"` // Array of department codes
	LastLoginAt *time.Time   `json:"last_login_at,omitempty"`
}

// ==================== TENANT HIERARCHY ====================

// TenantHierarchy represents a tenant in a hierarchical tree structure
// This is a recursive structure for displaying tenant hierarchy
type TenantHierarchy struct {
	ID       uuid.UUID          `json:"_id"`
	Code     string             `json:"code"`
	Name     string             `json:"name"`
	Tier     string             `json:"tier"`
	Status   string             `json:"status"`
	Parent   *TenantHierarchy   `json:"parent,omitempty"`
	Children []TenantHierarchy  `json:"children"`
	Depth    int                `json:"depth,omitempty"` // Computed field for UI
}

// AddChild adds a child tenant to the hierarchy
func (th *TenantHierarchy) AddChild(child TenantHierarchy) {
	if th.Children == nil {
		th.Children = []TenantHierarchy{}
	}
	th.Children = append(th.Children, child)
}

// GetChildCount returns the number of direct children
func (th *TenantHierarchy) GetChildCount() int {
	return len(th.Children)
}

// GetTotalDescendants returns total count of all descendants (recursive)
func (th *TenantHierarchy) GetTotalDescendants() int {
	count := len(th.Children)
	for _, child := range th.Children {
		count += child.GetTotalDescendants()
	}
	return count
}

// ==================== TENANT OVERVIEW ====================

// TenantOverview provides a comprehensive view of tenant data
// Used for dashboard/detail pages
type TenantOverview struct {
	Tenant            *TenantResponse  `json:"tenant"`
	Stats             *TenantStats     `json:"stats"`
	RecentActivities  []TenantActivity `json:"recent_activities"`
	TopMembers        []TenantMember   `json:"top_members,omitempty"`
	UsageMetrics      *UsageMetrics    `json:"usage_metrics,omitempty"`
	BillingInfo       *BillingInfo     `json:"billing_info,omitempty"`
}

// UsageMetrics provides detailed usage information
type UsageMetrics struct {
	// User Metrics
	CurrentUsers      int     `json:"current_users"`
	MaxUsers          int     `json:"max_users"`
	UserUsagePercent  float64 `json:"user_usage_percent"`
	
	// Storage Metrics
	StorageUsedGB     float64 `json:"storage_used_gb"`
	MaxStorageGB      int     `json:"max_storage_gb"`
	StoragePercent    float64 `json:"storage_percent"`
	
	// API Metrics
	APICallsToday     int64   `json:"api_calls_today"`
	APICallsThisMonth int64   `json:"api_calls_this_month"`
	APILimit          int64   `json:"api_limit"`
	APIUsagePercent   float64 `json:"api_usage_percent"`
	
	// Bandwidth
	BandwidthUsedGB   float64 `json:"bandwidth_used_gb"`
	BandwidthLimitGB  int     `json:"bandwidth_limit_gb"`
}

// BillingInfo provides billing-related information
type BillingInfo struct {
	CurrentPlan          string     `json:"current_plan"`
	BillingCycle         string     `json:"billing_cycle"` // MONTHLY, ANNUAL
	NextBillingDate      *time.Time `json:"next_billing_date,omitempty"`
	SubscriptionEndDate  *time.Time `json:"subscription_end_date,omitempty"`
	MonthlyRevenue       float64    `json:"monthly_revenue"`
	AnnualRevenue        float64    `json:"annual_revenue"`
	OutstandingBalance   float64    `json:"outstanding_balance"`
	PaymentMethod        string     `json:"payment_method,omitempty"`
	AutoRenewal          bool       `json:"auto_renewal"`
	TrialEndsAt          *time.Time `json:"trial_ends_at,omitempty"`
	GracePeriodEndsAt    *time.Time `json:"grace_period_ends_at,omitempty"`
}

// ==================== TENANT QUOTA ====================

// TenantQuota represents resource quotas and usage for a tenant
// Table: tenant_quotas
type TenantQuota struct {
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID  uuid.UUID `gorm:"column:tenant_id;type:uuid;not null;uniqueIndex:idx_tenant_quotas_tenant" json:"tenant_id"`
	
	// User Quotas
	MaxUsers     int `gorm:"column:max_users;type:int;not null;default:10" json:"max_users"`
	CurrentUsers int `gorm:"column:current_users;type:int;not null;default:0" json:"current_users"`
	
	// Storage Quotas (in GB)
	MaxStorage     int     `gorm:"column:max_storage;type:int;not null;default:50" json:"max_storage"`
	CurrentStorage float64 `gorm:"column:current_storage;type:decimal(10,2);not null;default:0" json:"current_storage"`
	
	// API Quotas
	MaxAPICallsPerMonth int64 `gorm:"column:max_api_calls_per_month;type:bigint;not null;default:10000" json:"max_api_calls_per_month"`
	CurrentAPICallsMonth int64 `gorm:"column:current_api_calls_month;type:bigint;not null;default:0" json:"current_api_calls_month"`
	
	// Bandwidth Quotas (in GB)
	MaxBandwidth     int     `gorm:"column:max_bandwidth;type:int;not null;default:100" json:"max_bandwidth"`
	CurrentBandwidth float64 `gorm:"column:current_bandwidth;type:decimal(10,2);not null;default:0" json:"current_bandwidth"`
	
	// Other Limits
	MaxDepartments  int `gorm:"column:max_departments;type:int;default:10" json:"max_departments"`
	MaxLocations    int `gorm:"column:max_locations;type:int;default:5" json:"max_locations"`
	MaxWebhooks     int `gorm:"column:max_webhooks;type:int;default:10" json:"max_webhooks"`
	MaxAppRoutes    int `gorm:"column:max_app_routes;type:int;default:50" json:"max_app_routes"`
	MaxRateLimits   int `gorm:"column:max_rate_limits;type:int;default:20" json:"max_rate_limits"`
	
	// Timestamps
	CreatedAt time.Time `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	
	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (TenantQuota) TableName() string {
	return "tenant_quotas"
}

// BeforeCreate hook
func (tq *TenantQuota) BeforeCreate(tx *gorm.DB) error {
	if tq.ID == uuid.Nil {
		tq.ID = uuid.New()
	}
	return nil
}

// BeforeUpdate hook
func (tq *TenantQuota) BeforeUpdate(tx *gorm.DB) error {
	tq.UpdatedAt = time.Now()
	return nil
}

// GetUserUsagePercent returns user quota usage percentage
func (tq *TenantQuota) GetUserUsagePercent() float64 {
	if tq.MaxUsers == 0 {
		return 0
	}
	return float64(tq.CurrentUsers) / float64(tq.MaxUsers) * 100
}

// GetStorageUsagePercent returns storage quota usage percentage
func (tq *TenantQuota) GetStorageUsagePercent() float64 {
	if tq.MaxStorage == 0 {
		return 0
	}
	return tq.CurrentStorage / float64(tq.MaxStorage) * 100
}

// GetAPIUsagePercent returns API quota usage percentage
func (tq *TenantQuota) GetAPIUsagePercent() float64 {
	if tq.MaxAPICallsPerMonth == 0 {
		return 0
	}
	return float64(tq.CurrentAPICallsMonth) / float64(tq.MaxAPICallsPerMonth) * 100
}

// GetBandwidthUsagePercent returns bandwidth quota usage percentage
func (tq *TenantQuota) GetBandwidthUsagePercent() float64 {
	if tq.MaxBandwidth == 0 {
		return 0
	}
	return tq.CurrentBandwidth / float64(tq.MaxBandwidth) * 100
}

// IsUserLimitReached checks if user limit is reached
func (tq *TenantQuota) IsUserLimitReached() bool {
	return tq.CurrentUsers >= tq.MaxUsers
}

// IsStorageLimitReached checks if storage limit is reached
func (tq *TenantQuota) IsStorageLimitReached() bool {
	return tq.CurrentStorage >= float64(tq.MaxStorage)
}

// IsAPILimitReached checks if API limit is reached
func (tq *TenantQuota) IsAPILimitReached() bool {
	return tq.CurrentAPICallsMonth >= tq.MaxAPICallsPerMonth
}

// IsBandwidthLimitReached checks if bandwidth limit is reached
func (tq *TenantQuota) IsBandwidthLimitReached() bool {
	return tq.CurrentBandwidth >= float64(tq.MaxBandwidth)
}

// IncrementUsers increments current users count
func (tq *TenantQuota) IncrementUsers(count int) error {
	if tq.CurrentUsers+count > tq.MaxUsers {
		return ErrQuotaExceeded{Resource: "users", Current: tq.CurrentUsers, Max: tq.MaxUsers}
	}
	tq.CurrentUsers += count
	return nil
}

// DecrementUsers decrements current users count
func (tq *TenantQuota) DecrementUsers(count int) {
	tq.CurrentUsers -= count
	if tq.CurrentUsers < 0 {
		tq.CurrentUsers = 0
	}
}

// IncrementStorage increments storage usage
func (tq *TenantQuota) IncrementStorage(gb float64) error {
	if tq.CurrentStorage+gb > float64(tq.MaxStorage) {
		return ErrQuotaExceeded{Resource: "storage", Current: int(tq.CurrentStorage), Max: tq.MaxStorage}
	}
	tq.CurrentStorage += gb
	return nil
}

// DecrementStorage decrements storage usage
func (tq *TenantQuota) DecrementStorage(gb float64) {
	tq.CurrentStorage -= gb
	if tq.CurrentStorage < 0 {
		tq.CurrentStorage = 0
	}
}

// IncrementAPICall increments API call count
func (tq *TenantQuota) IncrementAPICall(count int64) error {
	if tq.CurrentAPICallsMonth+count > tq.MaxAPICallsPerMonth {
		return ErrQuotaExceeded{Resource: "api_calls", Current: int(tq.CurrentAPICallsMonth), Max: int(tq.MaxAPICallsPerMonth)}
	}
	tq.CurrentAPICallsMonth += count
	return nil
}

// ResetMonthlyCounters resets monthly counters (should be called on billing cycle)
func (tq *TenantQuota) ResetMonthlyCounters() {
	tq.CurrentAPICallsMonth = 0
	tq.CurrentBandwidth = 0
}

// ==================== ERRORS ====================

// ErrQuotaExceeded represents a quota exceeded error
type ErrQuotaExceeded struct {
	Resource string
	Current  int
	Max      int
}

func (e ErrQuotaExceeded) Error() string {
	return fmt.Sprintf("quota exceeded for %s: current=%d, max=%d", e.Resource, e.Current, e.Max)
}

// ==================== TENANT INVITATION ====================

// InvitationStatus represents the status of a tenant invitation
type InvitationStatus string

const (
	InvitationStatusPending  InvitationStatus = "PENDING"
	InvitationStatusAccepted InvitationStatus = "ACCEPTED"
	InvitationStatusDeclined InvitationStatus = "DECLINED"
	InvitationStatusExpired  InvitationStatus = "EXPIRED"
	InvitationStatusCancelled InvitationStatus = "CANCELLED"
)

// TenantInvitation represents an invitation to join a tenant
// Table: tenant_invitations
type TenantInvitation struct {
	ID        uuid.UUID        `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID  uuid.UUID        `gorm:"column:tenant_id;type:uuid;not null;index:idx_tenant_invitations_tenant" json:"tenant_id"`
	Email     string           `gorm:"column:email;type:varchar(255);not null;index:idx_tenant_invitations_email" json:"email"`
	Token     string           `gorm:"column:token;type:varchar(255);not null;uniqueIndex:idx_tenant_invitations_token" json:"token"`
	Role      string           `gorm:"column:role;type:varchar(50);not null" json:"role"`
	Status    InvitationStatus `gorm:"column:status;type:varchar(20);not null;default:'PENDING'" json:"status"`
	InvitedBy uuid.UUID        `gorm:"column:invited_by;type:uuid;not null" json:"invited_by"`
	ExpiresAt time.Time        `gorm:"column:expires_at;type:timestamptz;not null" json:"expires_at"`
	AcceptedAt *time.Time      `gorm:"column:accepted_at;type:timestamptz" json:"accepted_at,omitempty"`
	DeclinedAt *time.Time      `gorm:"column:declined_at;type:timestamptz" json:"declined_at,omitempty"`
	CreatedAt time.Time        `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time        `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	
	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (TenantInvitation) TableName() string {
	return "tenant_invitations"
}

// BeforeCreate hook
func (ti *TenantInvitation) BeforeCreate(tx *gorm.DB) error {
	if ti.ID == uuid.Nil {
		ti.ID = uuid.New()
	}
	
	// Generate token if not provided
	if ti.Token == "" {
		ti.Token = uuid.New().String()
	}
	
	// Set expiration if not provided (default 7 days)
	if ti.ExpiresAt.IsZero() {
		ti.ExpiresAt = time.Now().Add(7 * 24 * time.Hour)
	}
	
	return nil
}

// BeforeUpdate hook
func (ti *TenantInvitation) BeforeUpdate(tx *gorm.DB) error {
	ti.UpdatedAt = time.Now()
	return nil
}

// IsExpired checks if invitation is expired
func (ti *TenantInvitation) IsExpired() bool {
	return time.Now().After(ti.ExpiresAt)
}

// IsPending checks if invitation is pending
func (ti *TenantInvitation) IsPending() bool {
	return ti.Status == InvitationStatusPending && !ti.IsExpired()
}

// Accept marks the invitation as accepted
func (ti *TenantInvitation) Accept() error {
	if !ti.IsPending() {
		return fmt.Errorf("invitation is not pending")
	}
	
	now := time.Now()
	ti.Status = InvitationStatusAccepted
	ti.AcceptedAt = &now
	return nil
}

// Decline marks the invitation as declined
func (ti *TenantInvitation) Decline() error {
	if !ti.IsPending() {
		return fmt.Errorf("invitation is not pending")
	}
	
	now := time.Now()
	ti.Status = InvitationStatusDeclined
	ti.DeclinedAt = &now
	return nil
}

// Cancel marks the invitation as cancelled
func (ti *TenantInvitation) Cancel() error {
	if ti.Status != InvitationStatusPending {
		return fmt.Errorf("can only cancel pending invitations")
	}
	
	ti.Status = InvitationStatusCancelled
	return nil
}

// ==================== QUERY FILTERS ====================

// TenantStatsFilter for filtering tenant stats queries
type TenantStatsFilter struct {
	TenantIDs     []uuid.UUID   `json:"tenant_ids,omitempty"`
	Tiers         []string      `json:"tiers,omitempty"`
	Statuses      []string      `json:"statuses,omitempty"`
	DataRegions   []string      `json:"data_regions,omitempty"`
	MinMembers    *int          `json:"min_members,omitempty"`
	MaxMembers    *int          `json:"max_members,omitempty"`
	MinRevenue    *float64      `json:"min_revenue,omitempty"`
	MaxRevenue    *float64      `json:"max_revenue,omitempty"`
	SortBy        string        `json:"sort_by,omitempty"` // members_count, monthly_revenue, etc.
	SortDirection string        `json:"sort_direction,omitempty"` // ASC, DESC
	Limit         int           `json:"limit,omitempty"`
	Offset        int           `json:"offset,omitempty"`
}

// TenantActivityFilter for filtering tenant activities
type TenantActivityFilter struct {
	TenantID      *uuid.UUID         `json:"tenant_id,omitempty"`
	UserID        *uuid.UUID         `json:"user_id,omitempty"`
	Actions       []ActivityAction   `json:"actions,omitempty"`
	Resources     []ActivityResource `json:"resources,omitempty"`
	FromDate      *time.Time         `json:"from_date,omitempty"`
	ToDate        *time.Time         `json:"to_date,omitempty"`
	IPAddress     *string            `json:"ip_address,omitempty"`
	Limit         int                `json:"limit,omitempty"`
	Offset        int                `json:"offset,omitempty"`
}

// TenantMemberFilter for filtering tenant members
type TenantMemberFilter struct {
	TenantID      uuid.UUID      `json:"tenant_id"`
	Statuses      []MemberStatus `json:"statuses,omitempty"`
	Roles         []string       `json:"roles,omitempty"`
	Departments   []string       `json:"departments,omitempty"`
	SearchQuery   string         `json:"search_query,omitempty"` // Search in name/email
	JoinedAfter   *time.Time     `json:"joined_after,omitempty"`
	JoinedBefore  *time.Time     `json:"joined_before,omitempty"`
	Limit         int            `json:"limit,omitempty"`
	Offset        int            `json:"offset,omitempty"`
}

// ==================== DTO STRUCTS ====================

// CreateTenantActivityRequest represents the request to log an activity
type CreateTenantActivityRequest struct {
	TenantID  uuid.UUID        `json:"tenant_id" binding:"required"`
	UserID    uuid.UUID        `json:"user_id" binding:"required"`
	UserName  string           `json:"user_name" binding:"required"`
	UserEmail string           `json:"user_email" binding:"required"`
	Action    ActivityAction   `json:"action" binding:"required"`
	Resource  ActivityResource `json:"resource" binding:"required"`
	Details   string           `json:"details,omitempty"`
	IPAddress string           `json:"ip_address,omitempty"`
	UserAgent string           `json:"user_agent,omitempty"`
}

// TenantActivityResponse represents the API response for an activity
type TenantActivityResponse struct {
	ID        uuid.UUID        `json:"_id"`
	TenantID  uuid.UUID        `json:"tenant_id"`
	UserID    uuid.UUID        `json:"user_id"`
	UserName  string           `json:"user_name"`
	UserEmail string           `json:"user_email"`
	Action    ActivityAction   `json:"action"`
	Resource  ActivityResource `json:"resource"`
	Details   string           `json:"details"`
	IPAddress string           `json:"ip_address"`
	CreatedAt time.Time        `json:"created_at"`
}

// ToResponse converts TenantActivity to TenantActivityResponse
func (ta *TenantActivity) ToResponse() *TenantActivityResponse {
	return &TenantActivityResponse{
		ID:        ta.ID,
		TenantID:  ta.TenantID,
		UserID:    ta.UserID,
		UserName:  ta.UserName,
		UserEmail: ta.UserEmail,
		Action:    ta.Action,
		Resource:  ta.Resource,
		Details:   ta.Details,
		IPAddress: ta.IPAddress,
		CreatedAt: ta.CreatedAt,
	}
}

// CreateTenantInvitationRequest represents the request to create an invitation
type CreateTenantInvitationRequest struct {
	TenantID  uuid.UUID `json:"tenant_id" binding:"required"`
	Email     string    `json:"email" binding:"required,email"`
	Role      string    `json:"role" binding:"required"`
	InvitedBy uuid.UUID `json:"invited_by" binding:"required"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
}

// TenantInvitationResponse represents the API response for an invitation
type TenantInvitationResponse struct {
	ID         uuid.UUID        `json:"_id"`
	TenantID   uuid.UUID        `json:"tenant_id"`
	Email      string           `json:"email"`
	Role       string           `json:"role"`
	Status     InvitationStatus `json:"status"`
	InvitedBy  uuid.UUID        `json:"invited_by"`
	ExpiresAt  time.Time        `json:"expires_at"`
	AcceptedAt *time.Time       `json:"accepted_at,omitempty"`
	DeclinedAt *time.Time       `json:"declined_at,omitempty"`
	CreatedAt  time.Time        `json:"created_at"`
}

// ToResponse converts TenantInvitation to TenantInvitationResponse
func (ti *TenantInvitation) ToResponse() *TenantInvitationResponse {
	return &TenantInvitationResponse{
		ID:         ti.ID,
		TenantID:   ti.TenantID,
		Email:      ti.Email,
		Role:       ti.Role,
		Status:     ti.Status,
		InvitedBy:  ti.InvitedBy,
		ExpiresAt:  ti.ExpiresAt,
		AcceptedAt: ti.AcceptedAt,
		DeclinedAt: ti.DeclinedAt,
		CreatedAt:  ti.CreatedAt,
	}
}

// ==================== HELPER FUNCTIONS ====================

import "fmt"

// BuildTenantHierarchy builds a hierarchical tree from flat tenant list
func BuildTenantHierarchy(tenants []Tenant) []TenantHierarchy {
	// Map to store all nodes
	nodeMap := make(map[uuid.UUID]*TenantHierarchy)
	var roots []TenantHierarchy
	
	// First pass: create all nodes
	for _, t := range tenants {
		node := TenantHierarchy{
			ID:       t.ID,
			Code:     t.Code,
			Name:     t.Name,
			Tier:     string(t.Tier),
			Status:   string(t.Status),
			Children: []TenantHierarchy{},
			Depth:    t.GetDepth(),
		}
		nodeMap[t.ID] = &node
	}
	
	// Second pass: build parent-child relationships
	for _, t := range tenants {
		node := nodeMap[t.ID]
		
		if t.ParentTenantID == nil {
			// Root tenant
			roots = append(roots, *node)
		} else {
			// Child tenant
			if parent, exists := nodeMap[*t.ParentTenantID]; exists {
				parent.AddChild(*node)
			}
		}
	}
	
	return roots
}

// CalculateTenantStats calculates statistics for a tenant
// This should be called as a background job or cached
func CalculateTenantStats(db *gorm.DB, tenantID uuid.UUID) (*TenantStats, error) {
	var stats TenantStats
	
	// Get tenant info
	var tenant Tenant
	if err := db.First(&tenant, tenantID).Error; err != nil {
		return nil, err
	}
	
	stats.TenantID = tenant.ID
	stats.TenantName = tenant.Name
	stats.TenantCode = tenant.Code
	stats.Tier = string(tenant.Tier)
	stats.Status = string(tenant.Status)
	stats.CreatedAt = tenant.CreatedAt
	
	// Count members
	db.Model(&UserTenant{}).Where("tenant_id = ? AND is_active = ?", tenantID, true).Count(&stats.MembersCount)
	db.Model(&UserTenant{}).Where("tenant_id = ? AND is_active = ? AND last_login_at > ?", tenantID, true, time.Now().Add(-30*24*time.Hour)).Count(&stats.ActiveMembers)
	
	// Count departments, groups, locations, roles
	db.Model(&Department{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.DepartmentsCount)
	db.Model(&UserGroup{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.UserGroupsCount)
	db.Model(&Location{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.LocationsCount)
	db.Model(&Role{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.RolesCount)
	
	// Count app routes, webhooks, rate limits, sso configs
	db.Model(&AppRoute{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.AppRoutesCount)
	db.Model(&Webhook{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.WebhooksCount)
	db.Model(&RateLimit{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.RateLimitsCount)
	db.Model(&SSOConfig{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.SSOConfigsCount)
	
	// Get storage usage from quota
	var quota TenantQuota
	if err := db.Where("tenant_id = ?", tenantID).First(&quota).Error; err == nil {
		stats.StorageUsedGB = quota.CurrentStorage
		stats.APICallsMonth = quota.CurrentAPICallsMonth
	}
	
	// Get last activity
	var lastActivity TenantActivity
	if err := db.Where("tenant_id = ?", tenantID).Order("created_at DESC").First(&lastActivity).Error; err == nil {
		stats.LastActivityAt = &lastActivity.CreatedAt
	}
	
	return &stats, nil
}
