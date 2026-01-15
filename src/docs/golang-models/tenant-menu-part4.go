package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ==================== USER DELEGATIONS ====================

// DelegationScope represents the scope of delegation authority
type DelegationScope string

const (
	DelegationScopeAdmin    DelegationScope = "admin"
	DelegationScopeManager  DelegationScope = "manager"
	DelegationScopeEditor   DelegationScope = "editor"
	DelegationScopeViewer   DelegationScope = "viewer"
	DelegationScopeApprover DelegationScope = "approver"
	DelegationScopeReviewer DelegationScope = "reviewer"
	DelegationScopeAuditor  DelegationScope = "auditor"
	DelegationScopeCustom   DelegationScope = "custom"
)

// IsValid validates delegation scope
func (s DelegationScope) IsValid() bool {
	switch s {
	case DelegationScopeAdmin, DelegationScopeManager, DelegationScopeEditor,
		DelegationScopeViewer, DelegationScopeApprover, DelegationScopeReviewer,
		DelegationScopeAuditor, DelegationScopeCustom:
		return true
	}
	return false
}

// DelegationStatus represents the status of a delegation
type DelegationStatus string

const (
	DelegationStatusPending   DelegationStatus = "pending"
	DelegationStatusActive    DelegationStatus = "active"
	DelegationStatusExpired   DelegationStatus = "expired"
	DelegationStatusRevoked   DelegationStatus = "revoked"
	DelegationStatusSuspended DelegationStatus = "suspended"
)

// IsValid validates delegation status
func (s DelegationStatus) IsValid() bool {
	switch s {
	case DelegationStatusPending, DelegationStatusActive, DelegationStatusExpired,
		DelegationStatusRevoked, DelegationStatusSuspended:
		return true
	}
	return false
}

// PermissionArray custom type for PostgreSQL jsonb array of permissions
type PermissionArray []string

// Value implements driver.Valuer
func (p PermissionArray) Value() (driver.Value, error) {
	if p == nil {
		return []byte("[]"), nil
	}
	return json.Marshal(p)
}

// Scan implements sql.Scanner
func (p *PermissionArray) Scan(value interface{}) error {
	if value == nil {
		*p = []string{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal PermissionArray value")
	}

	return json.Unmarshal(bytes, p)
}

// UserDelegation represents a delegation of permissions from one user to another
// Table: user_delegations
type UserDelegation struct {
	// Identity (1)
	ID uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`

	// Relationships (3)
	DelegatorID uuid.UUID  `gorm:"column:delegator_id;type:uuid;not null;index:idx_user_delegations_delegator" json:"delegator_id"`
	DelegateID  uuid.UUID  `gorm:"column:delegate_id;type:uuid;not null;index:idx_user_delegations_delegate" json:"delegate_id"`
	TenantID    *uuid.UUID `gorm:"column:tenant_id;type:uuid;index:idx_user_delegations_tenant" json:"tenant_id"` // Optional tenant context

	// Delegation Details (4)
	Scope       *DelegationScope `gorm:"column:scope;type:varchar(100)" json:"scope"`                                    // Single value
	Permissions PermissionArray  `gorm:"column:permissions;type:jsonb;not null;default:'[]'" json:"permissions"`         // Array of permission strings
	Reason      *string          `gorm:"column:reason;type:text" json:"reason"`                                          // Why delegation created
	Notes       *string          `gorm:"column:notes;type:text" json:"notes"`                                            // Additional notes

	// Time Period (2)
	StartDate time.Time  `gorm:"column:start_date;type:timestamptz;not null;default:now()" json:"start_date"`
	EndDate   *time.Time `gorm:"column:end_date;type:timestamptz" json:"end_date"` // Nullable - no expiration if null

	// Status & Lifecycle (5)
	Status         DelegationStatus `gorm:"column:status;type:varchar(20);not null;default:'active';index:idx_user_delegations_status" json:"status"`
	ActivatedAt    *time.Time       `gorm:"column:activated_at;type:timestamptz" json:"activated_at"`       // When activated
	RevokedAt      *time.Time       `gorm:"column:revoked_at;type:timestamptz" json:"revoked_at"`           // When revoked
	RevokedBy      *uuid.UUID       `gorm:"column:revoked_by;type:uuid" json:"revoked_by"`                  // Who revoked
	RevokedReason  *string          `gorm:"column:revoked_reason;type:text" json:"revoked_reason"`          // Why revoked

	// Configuration (2)
	AutoExpire             bool `gorm:"column:auto_expire;type:boolean;not null;default:true" json:"auto_expire"`                         // Auto expire at end_date
	NotifiedBeforeExpiry   bool `gorm:"column:notified_before_expiry;type:boolean;not null;default:false" json:"notified_before_expiry"` // Email notification sent

	// Metadata & Audit (4)
	Metadata  JSONB     `gorm:"column:metadata;type:jsonb;not null;default:'{}'" json:"metadata"`
	CreatedAt time.Time `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	Version   int64     `gorm:"column:version;type:bigint;not null;default:1" json:"version"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (UserDelegation) TableName() string {
	return "user_delegations"
}

// BeforeCreate hook
func (ud *UserDelegation) BeforeCreate(tx *gorm.DB) error {
	if ud.ID == uuid.Nil {
		ud.ID = uuid.New()
	}

	// Set defaults
	if ud.Status == "" {
		ud.Status = DelegationStatusActive
	}
	if ud.StartDate.IsZero() {
		ud.StartDate = time.Now()
	}
	if ud.Permissions == nil {
		ud.Permissions = []string{}
	}
	if ud.Metadata == nil {
		ud.Metadata = make(map[string]interface{})
	}

	// Auto-activate if status is active and no activated_at
	if ud.Status == DelegationStatusActive && ud.ActivatedAt == nil {
		now := time.Now()
		ud.ActivatedAt = &now
	}

	return ud.Validate()
}

// BeforeUpdate hook
func (ud *UserDelegation) BeforeUpdate(tx *gorm.DB) error {
	ud.UpdatedAt = time.Now()
	ud.Version++

	// Auto-expire if past end_date and auto_expire is enabled
	if ud.AutoExpire && ud.EndDate != nil && time.Now().After(*ud.EndDate) {
		if ud.Status == DelegationStatusActive {
			ud.Status = DelegationStatusExpired
		}
	}

	return ud.Validate()
}

// Validate validates the user delegation
func (ud *UserDelegation) Validate() error {
	if ud.DelegatorID == uuid.Nil {
		return errors.New("delegator_id is required")
	}
	if ud.DelegateID == uuid.Nil {
		return errors.New("delegate_id is required")
	}

	// Prevent self-delegation
	if ud.DelegatorID == ud.DelegateID {
		return errors.New("cannot delegate to yourself")
	}

	if ud.Scope != nil && !ud.Scope.IsValid() {
		return errors.New("invalid delegation scope")
	}

	if !ud.Status.IsValid() {
		return errors.New("invalid delegation status")
	}

	// Validate date range
	if ud.EndDate != nil && ud.EndDate.Before(ud.StartDate) {
		return errors.New("end_date must be after start_date")
	}

	return nil
}

// IsActive checks if delegation is currently active
func (ud *UserDelegation) IsActive() bool {
	now := time.Now()

	if ud.Status != DelegationStatusActive {
		return false
	}

	// Check start date
	if now.Before(ud.StartDate) {
		return false
	}

	// Check end date if set
	if ud.EndDate != nil && now.After(*ud.EndDate) {
		return false
	}

	return true
}

// IsPending checks if delegation is pending activation
func (ud *UserDelegation) IsPending() bool {
	return ud.Status == DelegationStatusPending
}

// IsExpired checks if delegation is expired
func (ud *UserDelegation) IsExpired() bool {
	if ud.Status == DelegationStatusExpired {
		return true
	}

	// Check if it should be expired
	if ud.EndDate != nil && time.Now().After(*ud.EndDate) {
		return true
	}

	return false
}

// IsRevoked checks if delegation is revoked
func (ud *UserDelegation) IsRevoked() bool {
	return ud.Status == DelegationStatusRevoked
}

// IsSuspended checks if delegation is suspended
func (ud *UserDelegation) IsSuspended() bool {
	return ud.Status == DelegationStatusSuspended
}

// Activate activates a pending delegation
func (ud *UserDelegation) Activate() error {
	if ud.Status != DelegationStatusPending {
		return errors.New("can only activate pending delegations")
	}

	now := time.Now()
	ud.Status = DelegationStatusActive
	ud.ActivatedAt = &now

	return nil
}

// Revoke revokes an active delegation
func (ud *UserDelegation) Revoke(revokedBy uuid.UUID, reason string) error {
	if ud.Status != DelegationStatusActive && ud.Status != DelegationStatusSuspended {
		return errors.New("can only revoke active or suspended delegations")
	}

	now := time.Now()
	ud.Status = DelegationStatusRevoked
	ud.RevokedAt = &now
	ud.RevokedBy = &revokedBy
	ud.RevokedReason = &reason

	return nil
}

// Suspend suspends an active delegation
func (ud *UserDelegation) Suspend() error {
	if ud.Status != DelegationStatusActive {
		return errors.New("can only suspend active delegations")
	}

	ud.Status = DelegationStatusSuspended
	return nil
}

// Resume resumes a suspended delegation
func (ud *UserDelegation) Resume() error {
	if ud.Status != DelegationStatusSuspended {
		return errors.New("can only resume suspended delegations")
	}

	// Check if it should be expired
	if ud.IsExpired() {
		return errors.New("cannot resume expired delegation")
	}

	ud.Status = DelegationStatusActive
	return nil
}

// HasPermission checks if delegation grants a specific permission
func (ud *UserDelegation) HasPermission(permission string) bool {
	for _, p := range ud.Permissions {
		if p == permission {
			return true
		}
	}
	return false
}

// GetDaysRemaining returns the number of days remaining until expiration
func (ud *UserDelegation) GetDaysRemaining() int {
	if ud.EndDate == nil {
		return -1 // No expiration
	}

	remaining := time.Until(*ud.EndDate)
	return int(remaining.Hours() / 24)
}

// IsNearExpiry checks if delegation is within N days of expiration
func (ud *UserDelegation) IsNearExpiry(days int) bool {
	if ud.EndDate == nil {
		return false
	}

	daysRemaining := ud.GetDaysRemaining()
	return daysRemaining >= 0 && daysRemaining <= days
}

// Extend extends the delegation end date
func (ud *UserDelegation) Extend(duration time.Duration) error {
	if ud.Status != DelegationStatusActive {
		return errors.New("can only extend active delegations")
	}

	if ud.EndDate == nil {
		// No expiration set, set it from now
		newEndDate := time.Now().Add(duration)
		ud.EndDate = &newEndDate
	} else {
		// Extend from current end date
		newEndDate := ud.EndDate.Add(duration)
		ud.EndDate = &newEndDate
	}

	return nil
}

// CreateUserDelegationRequest represents the request to create a delegation
type CreateUserDelegationRequest struct {
	DelegatorID  uuid.UUID        `json:"delegator_id" binding:"required"`
	DelegateID   uuid.UUID        `json:"delegate_id" binding:"required"`
	TenantID     *uuid.UUID       `json:"tenant_id,omitempty"`
	Scope        *DelegationScope `json:"scope,omitempty"`
	Permissions  []string         `json:"permissions,omitempty"`
	Reason       *string          `json:"reason,omitempty"`
	Notes        *string          `json:"notes,omitempty"`
	StartDate    *time.Time       `json:"start_date,omitempty"`
	EndDate      *time.Time       `json:"end_date,omitempty"`
	Status       *DelegationStatus `json:"status,omitempty"`
	AutoExpire   bool             `json:"auto_expire,omitempty"`
	Metadata     JSONB            `json:"metadata,omitempty"`
}

// UpdateUserDelegationRequest represents the request to update a delegation
type UpdateUserDelegationRequest struct {
	Scope                  *DelegationScope `json:"scope,omitempty"`
	Permissions            []string         `json:"permissions,omitempty"`
	Reason                 *string          `json:"reason,omitempty"`
	Notes                  *string          `json:"notes,omitempty"`
	EndDate                *time.Time       `json:"end_date,omitempty"`
	Status                 *DelegationStatus `json:"status,omitempty"`
	ActivatedAt            *time.Time       `json:"activated_at,omitempty"`
	RevokedAt              *time.Time       `json:"revoked_at,omitempty"`
	RevokedBy              *uuid.UUID       `json:"revoked_by,omitempty"`
	RevokedReason          *string          `json:"revoked_reason,omitempty"`
	AutoExpire             *bool            `json:"auto_expire,omitempty"`
	NotifiedBeforeExpiry   *bool            `json:"notified_before_expiry,omitempty"`
	Metadata               JSONB            `json:"metadata,omitempty"`
	Version                int64            `json:"version" binding:"required"`
}

// UserDelegationResponse represents the API response
type UserDelegationResponse struct {
	ID                     uuid.UUID        `json:"_id"`
	DelegatorID            uuid.UUID        `json:"delegator_id"`
	DelegateID             uuid.UUID        `json:"delegate_id"`
	TenantID               *uuid.UUID       `json:"tenant_id"`
	Scope                  *DelegationScope `json:"scope"`
	Permissions            []string         `json:"permissions"`
	Reason                 *string          `json:"reason"`
	Notes                  *string          `json:"notes"`
	StartDate              time.Time        `json:"start_date"`
	EndDate                *time.Time       `json:"end_date"`
	Status                 DelegationStatus `json:"status"`
	ActivatedAt            *time.Time       `json:"activated_at"`
	RevokedAt              *time.Time       `json:"revoked_at"`
	RevokedBy              *uuid.UUID       `json:"revoked_by"`
	RevokedReason          *string          `json:"revoked_reason"`
	AutoExpire             bool             `json:"auto_expire"`
	NotifiedBeforeExpiry   bool             `json:"notified_before_expiry"`
	Metadata               JSONB            `json:"metadata"`
	CreatedAt              time.Time        `json:"created_at"`
	UpdatedAt              time.Time        `json:"updated_at"`
	Version                int64            `json:"version"`
}

// ToResponse converts to response
func (ud *UserDelegation) ToResponse() *UserDelegationResponse {
	return &UserDelegationResponse{
		ID:                   ud.ID,
		DelegatorID:          ud.DelegatorID,
		DelegateID:           ud.DelegateID,
		TenantID:             ud.TenantID,
		Scope:                ud.Scope,
		Permissions:          ud.Permissions,
		Reason:               ud.Reason,
		Notes:                ud.Notes,
		StartDate:            ud.StartDate,
		EndDate:              ud.EndDate,
		Status:               ud.Status,
		ActivatedAt:          ud.ActivatedAt,
		RevokedAt:            ud.RevokedAt,
		RevokedBy:            ud.RevokedBy,
		RevokedReason:        ud.RevokedReason,
		AutoExpire:           ud.AutoExpire,
		NotifiedBeforeExpiry: ud.NotifiedBeforeExpiry,
		Metadata:             ud.Metadata,
		CreatedAt:            ud.CreatedAt,
		UpdatedAt:            ud.UpdatedAt,
		Version:              ud.Version,
	}
}

// UserDelegationWithDetails represents a delegation with user details
type UserDelegationWithDetails struct {
	UserDelegationResponse
	DelegatorName string     `json:"delegator_name"`
	DelegatorEmail string    `json:"delegator_email"`
	DelegateName  string     `json:"delegate_name"`
	DelegateEmail string     `json:"delegate_email"`
	DaysRemaining int        `json:"days_remaining"` // -1 if no expiration
	IsCurrentlyActive bool   `json:"is_currently_active"`
}

// DelegationStats provides statistics for delegations
type DelegationStats struct {
	Total            int                          `json:"total"`
	Active           int                          `json:"active"`
	Pending          int                          `json:"pending"`
	Expired          int                          `json:"expired"`
	Revoked          int                          `json:"revoked"`
	Suspended        int                          `json:"suspended"`
	ExpiringIn7Days  int                          `json:"expiring_in_7_days"`
	ExpiringIn30Days int                          `json:"expiring_in_30_days"`
	ByScope          map[DelegationScope]int      `json:"by_scope"`
	ByStatus         map[DelegationStatus]int     `json:"by_status"`
}

// Query Scopes
func ScopeDelegationsByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeActiveDelegations(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", DelegationStatusActive)
}

func ScopeDelegationsByDelegator(delegatorID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("delegator_id = ?", delegatorID)
	}
}

func ScopeDelegationsByDelegate(delegateID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("delegate_id = ?", delegateID)
	}
}

func ScopeDelegationsByStatus(status DelegationStatus) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("status = ?", status)
	}
}

func ScopeDelegationsByScope(scope DelegationScope) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("scope = ?", scope)
	}
}

func ScopeExpiringDelegations(days int) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		expiryDate := time.Now().Add(time.Duration(days) * 24 * time.Hour)
		return db.Where("status = ? AND end_date IS NOT NULL AND end_date <= ? AND end_date >= ?",
			DelegationStatusActive, expiryDate, time.Now())
	}
}

func ScopeCurrentlyActiveDelegations(db *gorm.DB) *gorm.DB {
	now := time.Now()
	return db.Where("status = ? AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)",
		DelegationStatusActive, now, now)
}

// ==================== HELPER FUNCTIONS ====================

// BuildDelegationTree builds a tree of delegations (who delegated to whom)
func BuildDelegationTree(delegations []UserDelegation) map[uuid.UUID][]UserDelegation {
	tree := make(map[uuid.UUID][]UserDelegation)

	for _, delegation := range delegations {
		tree[delegation.DelegatorID] = append(tree[delegation.DelegatorID], delegation)
	}

	return tree
}

// GetDelegationChain returns the chain of delegations (A → B → C)
func GetDelegationChain(db *gorm.DB, userID uuid.UUID, maxDepth int) ([]UserDelegation, error) {
	var chain []UserDelegation
	currentUserID := userID
	depth := 0

	for depth < maxDepth {
		var delegation UserDelegation
		err := db.Scopes(ScopeCurrentlyActiveDelegations).
			Where("delegator_id = ?", currentUserID).
			First(&delegation).Error

		if err != nil {
			break // No more delegations in chain
		}

		chain = append(chain, delegation)
		currentUserID = delegation.DelegateID
		depth++
	}

	return chain, nil
}

// CheckDelegationConflict checks if a delegation would create a conflict
func CheckDelegationConflict(db *gorm.DB, delegatorID, delegateID uuid.UUID, startDate, endDate time.Time) (bool, error) {
	var count int64

	query := db.Model(&UserDelegation{}).
		Where("delegator_id = ? AND delegate_id = ?", delegatorID, delegateID).
		Where("status IN (?)", []DelegationStatus{DelegationStatusActive, DelegationStatusPending}).
		Where("start_date <= ?", endDate)

	if endDate.IsZero() {
		query = query.Where("end_date IS NULL OR end_date >= ?", startDate)
	} else {
		query = query.Where("end_date IS NULL OR end_date >= ?", startDate)
	}

	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// NotifyExpiringDelegations finds delegations expiring soon and marks them as notified
func NotifyExpiringDelegations(db *gorm.DB, daysBeforeExpiry int) ([]UserDelegation, error) {
	var delegations []UserDelegation

	err := db.Scopes(ScopeExpiringDelegations(daysBeforeExpiry)).
		Where("notified_before_expiry = ?", false).
		Find(&delegations).Error

	if err != nil {
		return nil, err
	}

	// Mark as notified
	for i := range delegations {
		delegations[i].NotifiedBeforeExpiry = true
		db.Save(&delegations[i])
	}

	return delegations, nil
}

// ExpireOldDelegations finds and expires delegations that are past their end_date
func ExpireOldDelegations(db *gorm.DB) (int64, error) {
	result := db.Model(&UserDelegation{}).
		Where("status = ? AND auto_expire = ? AND end_date IS NOT NULL AND end_date < ?",
			DelegationStatusActive, true, time.Now()).
		Update("status", DelegationStatusExpired)

	return result.RowsAffected, result.Error
}
