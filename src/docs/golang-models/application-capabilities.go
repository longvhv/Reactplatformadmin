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
// APP CAPABILITY - Application Features & Limits
// ============================================================================
// Purpose: Define features and limits for applications
// Table: app_capabilities
// Primary Key: _id (UUID)
// Features: Feature flags, Resource limits, Validation rules
// Examples: 
//   - FEATURE: "file_upload", "api_access", "custom_domain"
//   - LIMIT: "max_users", "max_storage_gb", "max_api_calls"
// ============================================================================

// CapabilityType represents the type of capability
type CapabilityType string

const (
	CapabilityTypeFeature CapabilityType = "FEATURE" // Boolean feature flag
	CapabilityTypeLimit   CapabilityType = "LIMIT"   // Numeric limit
)

// CapabilityStatus represents the status of a capability
type CapabilityStatus string

const (
	CapabilityStatusActive   CapabilityStatus = "active"
	CapabilityStatusInactive CapabilityStatus = "inactive"
	CapabilityStatusArchived CapabilityStatus = "archived"
)

// DefaultValue represents the default value for a capability (JSONB)
type DefaultValue struct {
	Enabled *bool   `json:"enabled,omitempty"` // For FEATURE type
	Value   *int    `json:"value,omitempty"`   // For LIMIT type
	Unit    *string `json:"unit,omitempty"`    // e.g., "users", "GB", "requests/month"
}

// Scan implements sql.Scanner for DefaultValue
func (dv *DefaultValue) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan DefaultValue")
	}
	return json.Unmarshal(bytes, dv)
}

// Value implements driver.Valuer for DefaultValue
func (dv DefaultValue) Value() (driver.Value, error) {
	return json.Marshal(dv)
}

// ValidationRules stores validation rules for capabilities (JSONB)
type ValidationRules map[string]interface{}

// Scan implements sql.Scanner for ValidationRules
func (vr *ValidationRules) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan ValidationRules")
	}
	return json.Unmarshal(bytes, vr)
}

// Value implements driver.Valuer for ValidationRules
func (vr ValidationRules) Value() (driver.Value, error) {
	return json.Marshal(vr)
}

// ============================================================================
// AppCapability - Main Model (19 fields)
// ============================================================================

type AppCapability struct {
	// ========== Identity & Relationships (3 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID uuid.UUID  `gorm:"column:tenant_id;type:uuid;not null;index" json:"tenant_id"`
	AppID    uuid.UUID  `gorm:"column:app_id;type:uuid;not null;index" json:"app_id"` // FK to applications

	// ========== Capability Information (5 fields) ==========
	Code         string           `gorm:"column:code;type:varchar(100);not null;uniqueIndex:idx_app_capability" json:"code"`
	Name         string           `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description  *string          `gorm:"column:description;type:text" json:"description,omitempty"`
	Type         CapabilityType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	DefaultValue DefaultValue     `gorm:"column:default_value;type:jsonb;not null" json:"default_value"`

	// ========== Configuration (3 fields) ==========
	DisplayOrder    int             `gorm:"column:display_order;type:int;default:0" json:"display_order"`
	IsRequired      bool            `gorm:"column:is_required;default:false" json:"is_required"`
	ValidationRules ValidationRules `gorm:"column:validation_rules;type:jsonb" json:"validation_rules"`

	// ========== Status (2 fields) ==========
	Status   CapabilityStatus `gorm:"column:status;type:varchar(20);default:'active';index" json:"status"`
	Metadata JSONB            `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete & Versioning (2 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`
}

// TableName specifies the table name for AppCapability
func (AppCapability) TableName() string {
	return "app_capabilities"
}

// ============================================================================
// GORM Hooks
// ============================================================================

// BeforeCreate hook
func (ac *AppCapability) BeforeCreate(tx *gorm.DB) error {
	if ac.ID == uuid.Nil {
		ac.ID = uuid.New()
	}

	if err := ac.Validate(); err != nil {
		return err
	}

	return nil
}

// BeforeUpdate hook
func (ac *AppCapability) BeforeUpdate(tx *gorm.DB) error {
	ac.Version++

	if err := ac.Validate(); err != nil {
		return err
	}

	return nil
}

// ============================================================================
// Validation
// ============================================================================

func (ac *AppCapability) Validate() error {
	// Code validation
	if ac.Code == "" {
		return errors.New("capability code is required")
	}

	// Name validation
	if ac.Name == "" {
		return errors.New("capability name is required")
	}

	// Type validation
	if ac.Type != CapabilityTypeFeature && ac.Type != CapabilityTypeLimit {
		return fmt.Errorf("invalid capability type: %s", ac.Type)
	}

	// Type-specific validation
	if ac.Type == CapabilityTypeFeature {
		if ac.DefaultValue.Enabled == nil {
			return errors.New("FEATURE capability must have 'enabled' in default_value")
		}
	} else if ac.Type == CapabilityTypeLimit {
		if ac.DefaultValue.Value == nil {
			return errors.New("LIMIT capability must have 'value' in default_value")
		}
	}

	return nil
}

// ============================================================================
// Helper Methods
// ============================================================================

// IsActive checks if the capability is active
func (ac *AppCapability) IsActive() bool {
	return ac.Status == CapabilityStatusActive && ac.DeletedAt == nil
}

// IsFeature checks if this is a feature capability
func (ac *AppCapability) IsFeature() bool {
	return ac.Type == CapabilityTypeFeature
}

// IsLimit checks if this is a limit capability
func (ac *AppCapability) IsLimit() bool {
	return ac.Type == CapabilityTypeLimit
}

// GetDefaultEnabled returns the default enabled value for features
func (ac *AppCapability) GetDefaultEnabled() bool {
	if ac.Type == CapabilityTypeFeature && ac.DefaultValue.Enabled != nil {
		return *ac.DefaultValue.Enabled
	}
	return false
}

// GetDefaultValue returns the default value for limits
func (ac *AppCapability) GetDefaultValue() int {
	if ac.Type == CapabilityTypeLimit && ac.DefaultValue.Value != nil {
		return *ac.DefaultValue.Value
	}
	return 0
}

// GetUnit returns the unit for limits
func (ac *AppCapability) GetUnit() string {
	if ac.DefaultValue.Unit != nil {
		return *ac.DefaultValue.Unit
	}
	return ""
}

// SoftDelete performs a soft delete
func (ac *AppCapability) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	ac.DeletedAt = &now
	ac.DeletedBy = &deletedBy
	ac.Status = CapabilityStatusArchived
}

// ============================================================================
// TENANT CAPABILITY - Tenant-specific capability overrides
// ============================================================================
// Purpose: Override capability values per tenant
// Table: tenant_capabilities
// Primary Key: _id (UUID)
// ============================================================================

type TenantCapability struct {
	// Identity (4 fields)
	ID           uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID     uuid.UUID `gorm:"column:tenant_id;type:uuid;not null;index" json:"tenant_id"`
	AppID        uuid.UUID `gorm:"column:app_id;type:uuid;not null;index" json:"app_id"`
	CapabilityID uuid.UUID `gorm:"column:capability_id;type:uuid;not null;index" json:"capability_id"` // FK to app_capabilities

	// Override Values (2 fields)
	OverrideValue DefaultValue `gorm:"column:override_value;type:jsonb;not null" json:"override_value"`
	IsOverridden  bool         `gorm:"column:is_overridden;default:true" json:"is_overridden"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationship
	Capability *AppCapability `gorm:"foreignKey:CapabilityID" json:"capability,omitempty"`
}

func (TenantCapability) TableName() string {
	return "tenant_capabilities"
}

// GetEffectiveValue returns the effective value (override or default)
func (tc *TenantCapability) GetEffectiveValue() DefaultValue {
	if tc.IsOverridden {
		return tc.OverrideValue
	}
	if tc.Capability != nil {
		return tc.Capability.DefaultValue
	}
	return DefaultValue{}
}

// ============================================================================
// CAPABILITY USAGE - Track capability usage
// ============================================================================
// Purpose: Track actual usage of capabilities (for limits)
// Table: capability_usage
// Primary Key: _id (UUID)
// ============================================================================

type CapabilityUsage struct {
	// Identity (4 fields)
	ID           uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID     uuid.UUID `gorm:"column:tenant_id;type:uuid;not null;index" json:"tenant_id"`
	AppID        uuid.UUID `gorm:"column:app_id;type:uuid;not null;index" json:"app_id"`
	CapabilityID uuid.UUID `gorm:"column:capability_id;type:uuid;not null;index" json:"capability_id"`

	// Usage Tracking (6 fields)
	CurrentValue int       `gorm:"column:current_value;default:0" json:"current_value"`
	PeakValue    int       `gorm:"column:peak_value;default:0" json:"peak_value"`
	LimitValue   int       `gorm:"column:limit_value;not null" json:"limit_value"`
	LastResetAt  time.Time `gorm:"column:last_reset_at;autoCreateTime" json:"last_reset_at"`
	ResetPeriod  string    `gorm:"column:reset_period;type:varchar(20)" json:"reset_period"` // daily, monthly, yearly, never
	IsExceeded   bool      `gorm:"column:is_exceeded;default:false" json:"is_exceeded"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Capability *AppCapability `gorm:"foreignKey:CapabilityID" json:"capability,omitempty"`
}

func (CapabilityUsage) TableName() string {
	return "capability_usage"
}

// Increment increments the current value
func (cu *CapabilityUsage) Increment(amount int) error {
	cu.CurrentValue += amount

	// Update peak value
	if cu.CurrentValue > cu.PeakValue {
		cu.PeakValue = cu.CurrentValue
	}

	// Check if limit exceeded
	if cu.CurrentValue > cu.LimitValue {
		cu.IsExceeded = true
		return fmt.Errorf("capability limit exceeded: %d/%d", cu.CurrentValue, cu.LimitValue)
	}

	cu.IsExceeded = false
	return nil
}

// Decrement decrements the current value
func (cu *CapabilityUsage) Decrement(amount int) {
	cu.CurrentValue -= amount
	if cu.CurrentValue < 0 {
		cu.CurrentValue = 0
	}

	// Recheck exceeded status
	cu.IsExceeded = cu.CurrentValue > cu.LimitValue
}

// Reset resets the current value
func (cu *CapabilityUsage) Reset() {
	cu.CurrentValue = 0
	cu.IsExceeded = false
	cu.LastResetAt = time.Now()
}

// GetUsagePercentage returns the usage percentage
func (cu *CapabilityUsage) GetUsagePercentage() float64 {
	if cu.LimitValue == 0 {
		return 0
	}
	return (float64(cu.CurrentValue) / float64(cu.LimitValue)) * 100
}

// ShouldReset checks if the usage should be reset based on reset period
func (cu *CapabilityUsage) ShouldReset() bool {
	now := time.Now()

	switch cu.ResetPeriod {
	case "daily":
		return now.Sub(cu.LastResetAt).Hours() >= 24
	case "monthly":
		return now.Month() != cu.LastResetAt.Month() || now.Year() != cu.LastResetAt.Year()
	case "yearly":
		return now.Year() != cu.LastResetAt.Year()
	case "never":
		return false
	default:
		return false
	}
}

// ============================================================================
// Response DTOs
// ============================================================================

type AppCapabilityResponse struct {
	ID              uuid.UUID        `json:"_id"`
	TenantID        uuid.UUID        `json:"tenant_id"`
	AppID           uuid.UUID        `json:"app_id"`
	Code            string           `json:"code"`
	Name            string           `json:"name"`
	Description     *string          `json:"description,omitempty"`
	Type            CapabilityType   `json:"type"`
	DefaultValue    DefaultValue     `json:"default_value"`
	DisplayOrder    int              `json:"display_order"`
	IsRequired      bool             `json:"is_required"`
	ValidationRules ValidationRules  `json:"validation_rules"`
	Status          CapabilityStatus `json:"status"`
	Metadata        JSONB            `json:"metadata,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	Version         int64            `json:"version"`
}

// ToResponse converts AppCapability to response DTO
func (ac *AppCapability) ToResponse() *AppCapabilityResponse {
	return &AppCapabilityResponse{
		ID:              ac.ID,
		TenantID:        ac.TenantID,
		AppID:           ac.AppID,
		Code:            ac.Code,
		Name:            ac.Name,
		Description:     ac.Description,
		Type:            ac.Type,
		DefaultValue:    ac.DefaultValue,
		DisplayOrder:    ac.DisplayOrder,
		IsRequired:      ac.IsRequired,
		ValidationRules: ac.ValidationRules,
		Status:          ac.Status,
		Metadata:        ac.Metadata,
		CreatedAt:       ac.CreatedAt,
		UpdatedAt:       ac.UpdatedAt,
		Version:         ac.Version,
	}
}

// ============================================================================
// Request DTOs
// ============================================================================

type CreateCapabilityRequest struct {
	TenantID        uuid.UUID       `json:"tenant_id" validate:"required"`
	AppID           uuid.UUID       `json:"app_id" validate:"required"`
	Code            string          `json:"code" validate:"required,max=100"`
	Name            string          `json:"name" validate:"required,max=255"`
	Description     *string         `json:"description,omitempty"`
	Type            CapabilityType  `json:"type" validate:"required"`
	DefaultValue    DefaultValue    `json:"default_value" validate:"required"`
	DisplayOrder    int             `json:"display_order"`
	IsRequired      bool            `json:"is_required"`
	ValidationRules ValidationRules `json:"validation_rules"`
	Status          CapabilityStatus `json:"status"`
	Metadata        JSONB           `json:"metadata,omitempty"`
}

type UpdateCapabilityRequest struct {
	Code            *string          `json:"code,omitempty" validate:"omitempty,max=100"`
	Name            *string          `json:"name,omitempty" validate:"omitempty,max=255"`
	Description     *string          `json:"description,omitempty"`
	Type            *CapabilityType  `json:"type,omitempty"`
	DefaultValue    *DefaultValue    `json:"default_value,omitempty"`
	DisplayOrder    *int             `json:"display_order,omitempty"`
	IsRequired      *bool            `json:"is_required,omitempty"`
	ValidationRules *ValidationRules `json:"validation_rules,omitempty"`
	Status          *CapabilityStatus `json:"status,omitempty"`
	Metadata        *JSONB           `json:"metadata,omitempty"`
	Version         int64            `json:"version" validate:"required"`
}

// ============================================================================
// Query Scopes
// ============================================================================

// ScopeActiveCapabilities returns only active capabilities
func ScopeActiveCapabilities(db *gorm.DB) *gorm.DB {
	return db.Where("status = ? AND deleted_at IS NULL", CapabilityStatusActive)
}

// ScopeByApp returns capabilities for a specific app
func ScopeByApp(appID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("app_id = ?", appID)
	}
}

// ScopeByType returns capabilities by type
func ScopeByCapabilityType(capType CapabilityType) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("type = ?", capType)
	}
}

// ScopeRequired returns only required capabilities
func ScopeRequired(db *gorm.DB) *gorm.DB {
	return db.Where("is_required = ?", true)
}

// ScopeOrderedByDisplay returns capabilities ordered by display_order
func ScopeOrderedByDisplay(db *gorm.DB) *gorm.DB {
	return db.Order("display_order ASC, name ASC")
}

// ============================================================================
// Helper Functions
// ============================================================================

// GetCapabilitiesForApp retrieves all active capabilities for an app
func GetCapabilitiesForApp(db *gorm.DB, appID uuid.UUID) ([]AppCapability, error) {
	var capabilities []AppCapability
	err := db.Scopes(ScopeActiveCapabilities, ScopeByApp(appID), ScopeOrderedByDisplay).
		Find(&capabilities).Error
	return capabilities, err
}

// GetTenantCapabilityValue retrieves the effective capability value for a tenant
func GetTenantCapabilityValue(db *gorm.DB, tenantID, appID, capabilityID uuid.UUID) (*DefaultValue, error) {
	// First, try to get tenant override
	var tenantCap TenantCapability
	err := db.Where("tenant_id = ? AND app_id = ? AND capability_id = ?",
		tenantID, appID, capabilityID).
		Preload("Capability").
		First(&tenantCap).Error

	if err == gorm.ErrRecordNotFound {
		// No override, get default from capability
		var capability AppCapability
		if err := db.First(&capability, capabilityID).Error; err != nil {
			return nil, err
		}
		return &capability.DefaultValue, nil
	} else if err != nil {
		return nil, err
	}

	// Return effective value
	effectiveValue := tenantCap.GetEffectiveValue()
	return &effectiveValue, nil
}

// CheckCapabilityLimit checks if a tenant can perform an action based on capability limit
func CheckCapabilityLimit(db *gorm.DB, tenantID, appID, capabilityID uuid.UUID, increment int) error {
	var usage CapabilityUsage
	err := db.Where("tenant_id = ? AND app_id = ? AND capability_id = ?",
		tenantID, appID, capabilityID).First(&usage).Error

	if err == gorm.ErrRecordNotFound {
		return errors.New("capability usage not found")
	} else if err != nil {
		return err
	}

	// Check if should reset
	if usage.ShouldReset() {
		usage.Reset()
		db.Save(&usage)
	}

	// Try to increment
	if err := usage.Increment(increment); err != nil {
		return err
	}

	// Save updated usage
	return db.Save(&usage).Error
}

// CreateDefaultCapabilitiesForApp creates standard capabilities for a new app
func CreateDefaultCapabilitiesForApp(db *gorm.DB, tenantID, appID uuid.UUID, createdBy *uuid.UUID) error {
	defaultCapabilities := []AppCapability{
		{
			TenantID: tenantID,
			AppID:    appID,
			Code:     "api_access",
			Name:     "API Access",
			Type:     CapabilityTypeFeature,
			DefaultValue: DefaultValue{
				Enabled: boolPtr(true),
			},
			DisplayOrder: 1,
			IsRequired:   true,
			Status:       CapabilityStatusActive,
			CreatedBy:    createdBy,
		},
		{
			TenantID: tenantID,
			AppID:    appID,
			Code:     "max_users",
			Name:     "Maximum Users",
			Type:     CapabilityTypeLimit,
			DefaultValue: DefaultValue{
				Value: intPtr(100),
				Unit:  strPtr("users"),
			},
			DisplayOrder: 2,
			IsRequired:   true,
			Status:       CapabilityStatusActive,
			CreatedBy:    createdBy,
		},
		{
			TenantID: tenantID,
			AppID:    appID,
			Code:     "max_storage",
			Name:     "Maximum Storage",
			Type:     CapabilityTypeLimit,
			DefaultValue: DefaultValue{
				Value: intPtr(10),
				Unit:  strPtr("GB"),
			},
			DisplayOrder: 3,
			IsRequired:   true,
			Status:       CapabilityStatusActive,
			CreatedBy:    createdBy,
		},
	}

	return db.Create(&defaultCapabilities).Error
}

// Utility helper functions
func boolPtr(b bool) *bool {
	return &b
}

func intPtr(i int) *int {
	return &i
}

func strPtr(s string) *string {
	return &s
}
