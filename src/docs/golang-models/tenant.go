package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ==================== ENUMS ====================

// TenantStatus represents the operational status of a tenant
type TenantStatus string

const (
	TenantStatusTrial     TenantStatus = "TRIAL"
	TenantStatusActive    TenantStatus = "ACTIVE"
	TenantStatusSuspended TenantStatus = "SUSPENDED"
	TenantStatusCancelled TenantStatus = "CANCELLED"
)

// IsValid validates tenant status
func (s TenantStatus) IsValid() bool {
	switch s {
	case TenantStatusTrial, TenantStatusActive, TenantStatusSuspended, TenantStatusCancelled:
		return true
	}
	return false
}

// TenantTier represents the subscription tier of a tenant
type TenantTier string

const (
	// Customer tiers
	TenantTierFree       TenantTier = "FREE"
	TenantTierPro        TenantTier = "PRO"
	TenantTierEnterprise TenantTier = "ENTERPRISE"

	// Partner tiers
	TenantTierPartnerBasic   TenantTier = "PARTNER_BASIC"
	TenantTierPartnerPremium TenantTier = "PARTNER_PREMIUM"
	TenantTierPartnerElite   TenantTier = "PARTNER_ELITE"

	// Platform owner
	TenantTierProvider TenantTier = "PROVIDER"
)

// IsValid validates tenant tier
func (t TenantTier) IsValid() bool {
	switch t {
	case TenantTierFree, TenantTierPro, TenantTierEnterprise,
		TenantTierPartnerBasic, TenantTierPartnerPremium, TenantTierPartnerElite,
		TenantTierProvider:
		return true
	}
	return false
}

// IsPartner checks if tier is a partner tier
func (t TenantTier) IsPartner() bool {
	switch t {
	case TenantTierPartnerBasic, TenantTierPartnerPremium, TenantTierPartnerElite:
		return true
	}
	return false
}

// BillingType represents the billing method
type BillingType string

const (
	BillingTypePrepaid  BillingType = "PREPAID"
	BillingTypePostpaid BillingType = "POSTPAID"
)

// IsValid validates billing type
func (b BillingType) IsValid() bool {
	switch b {
	case BillingTypePrepaid, BillingTypePostpaid:
		return true
	}
	return false
}

// DataRegion represents the data storage region
type DataRegion string

const (
	DataRegionAPSoutheast1 DataRegion = "ap-southeast-1"
	DataRegionUSEast1      DataRegion = "us-east-1"
	DataRegionEUCentral1   DataRegion = "eu-central-1"
)

// IsValid validates data region
func (r DataRegion) IsValid() bool {
	switch r {
	case DataRegionAPSoutheast1, DataRegionUSEast1, DataRegionEUCentral1:
		return true
	}
	return false
}

// ComplianceLevel represents the compliance requirements
type ComplianceLevel string

const (
	ComplianceLevelStandard ComplianceLevel = "STANDARD"
	ComplianceLevelGDPR     ComplianceLevel = "GDPR"
	ComplianceLevelHIPAA    ComplianceLevel = "HIPAA"
	ComplianceLevelPCIDSS   ComplianceLevel = "PCI-DSS"
)

// IsValid validates compliance level
func (c ComplianceLevel) IsValid() bool {
	switch c {
	case ComplianceLevelStandard, ComplianceLevelGDPR, ComplianceLevelHIPAA, ComplianceLevelPCIDSS:
		return true
	}
	return false
}

// ==================== JSONB STRUCTURES ====================

// TenantProfile contains tenant business information (stored as JSONB)
type TenantProfile struct {
	BillingEmail  string `json:"billing_email,omitempty"`
	Phone         string `json:"phone,omitempty"`
	Domain        string `json:"domain,omitempty"`
	ContactPerson string `json:"contact_person,omitempty"`
	Industry      string `json:"industry,omitempty"`
	CompanySize   string `json:"company_size,omitempty"`
	Country       string `json:"country,omitempty"`
	Address       string `json:"address,omitempty"`
	TaxID         string `json:"tax_id,omitempty"`
	LogoURL       string `json:"logo_url,omitempty"`
	Website       string `json:"website,omitempty"`
}

// Value implements driver.Valuer for database storage
func (p TenantProfile) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// Scan implements sql.Scanner for database retrieval
func (p *TenantProfile) Scan(value interface{}) error {
	if value == nil {
		*p = TenantProfile{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal JSONB value")
	}

	return json.Unmarshal(bytes, p)
}

// TenantSettings contains tenant configuration (stored as JSONB)
type TenantSettings struct {
	MaxUsers            int      `json:"max_users"`
	MaxStorage          int      `json:"max_storage"` // in GB
	CurrentUsers        int      `json:"current_users"`
	CurrentStorage      int      `json:"current_storage"` // in GB
	MFAEnforced         bool     `json:"mfa_enforced"`
	SSOEnabled          bool     `json:"sso_enabled"`
	CustomBranding      bool     `json:"custom_branding"`
	APIAccess           bool     `json:"api_access"`
	SubscriptionEndDate string   `json:"subscription_end_date,omitempty"`
	Features            []string `json:"features"`
	AllowedDomains      []string `json:"allowed_domains,omitempty"`
	IPWhitelist         []string `json:"ip_whitelist,omitempty"`
}

// Value implements driver.Valuer for database storage
func (s TenantSettings) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan implements sql.Scanner for database retrieval
func (s *TenantSettings) Scan(value interface{}) error {
	if value == nil {
		*s = TenantSettings{
			Features: []string{},
		}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal JSONB value")
	}

	return json.Unmarshal(bytes, s)
}

// ==================== MAIN MODEL ====================

// Tenant represents a tenant in the multi-tenant SaaS platform
// Table: tenants
type Tenant struct {
	// I. IDENTITY & INFRASTRUCTURE
	ID               uuid.UUID       `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	Code             string          `gorm:"column:code;type:varchar(64);not null;uniqueIndex:idx_tenants_code" json:"code"`
	DataRegion       DataRegion      `gorm:"column:data_region;type:varchar(50);not null" json:"data_region"`
	ComplianceLevel  ComplianceLevel `gorm:"column:compliance_level;type:varchar(50);not null" json:"compliance_level"`
	ParentTenantID   *uuid.UUID      `gorm:"column:parent_tenant_id;type:uuid;index:idx_tenants_parent" json:"parent_tenant_id,omitempty"`
	PartnerTenantID  *uuid.UUID      `gorm:"column:partner_tenant_id;type:uuid;index:idx_tenants_partner" json:"partner_tenant_id,omitempty"`
	Path             string          `gorm:"column:path;type:text" json:"path,omitempty"` // Materialized path: /parent_id/child_id/

	// II. BUSINESS INFORMATION & LOCALIZATION
	Name        string      `gorm:"column:name;type:text;not null" json:"name"`
	Tier        TenantTier  `gorm:"column:tier;type:varchar(50);not null;default:'FREE';index:idx_tenants_tier" json:"tier"`
	BillingType BillingType `gorm:"column:billing_type;type:varchar(20);not null;default:'POSTPAID'" json:"billing_type"`
	Timezone    string      `gorm:"column:timezone;type:varchar(50);default:'UTC'" json:"timezone"`

	// III. DYNAMIC DATA (JSONB)
	Profile  TenantProfile  `gorm:"column:profile;type:jsonb;not null;default:'{}'" json:"profile"`
	Settings TenantSettings `gorm:"column:settings;type:jsonb;not null;default:'{\"max_users\":10,\"max_storage\":50,\"current_users\":0,\"current_storage\":0,\"mfa_enforced\":false,\"sso_enabled\":false,\"custom_branding\":false,\"api_access\":false,\"features\":[]}'" json:"settings"`

	// IV. STATUS & AUDIT TRAIL
	Status    TenantStatus `gorm:"column:status;type:varchar(20);not null;default:'TRIAL';index:idx_tenants_status" json:"status"`
	CreatedAt time.Time    `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time    `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	DeletedAt *time.Time   `gorm:"column:deleted_at;type:timestamptz;index:idx_tenants_deleted_at" json:"deleted_at,omitempty"`
	CreatedBy *uuid.UUID   `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID   `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
	DeletedBy *uuid.UUID   `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64        `gorm:"column:version;type:bigint;not null;default:1" json:"version"` // Optimistic locking

	// V. RELATIONSHIPS (not stored in DB, loaded via joins)
	ParentTenant  *Tenant   `gorm:"foreignKey:ParentTenantID;references:ID" json:"parent_tenant,omitempty"`
	PartnerTenant *Tenant   `gorm:"foreignKey:PartnerTenantID;references:ID" json:"partner_tenant,omitempty"`
	ChildTenants  []*Tenant `gorm:"foreignKey:ParentTenantID;references:ID" json:"child_tenants,omitempty"`
}

// TableName specifies the table name for GORM
func (Tenant) TableName() string {
	return "tenants"
}

// ==================== HOOKS ====================

// BeforeCreate hook to set defaults and validate
func (t *Tenant) BeforeCreate(tx *gorm.DB) error {
	// Generate UUID if not provided
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}

	// Set default timezone if not provided
	if t.Timezone == "" {
		t.Timezone = "UTC"
	}

	// Set default tier if not provided
	if t.Tier == "" {
		t.Tier = TenantTierFree
	}

	// Set default status if not provided
	if t.Status == "" {
		t.Status = TenantStatusTrial
	}

	// Set default billing type if not provided
	if t.BillingType == "" {
		t.BillingType = BillingTypePostpaid
	}

	// Set default compliance level if not provided
	if t.ComplianceLevel == "" {
		t.ComplianceLevel = ComplianceLevelStandard
	}

	// Initialize empty JSONB fields if nil
	if t.Settings.Features == nil {
		t.Settings.Features = []string{}
	}

	// Build materialized path
	if err := t.buildPath(tx); err != nil {
		return err
	}

	// Validate
	return t.Validate()
}

// BeforeUpdate hook to validate and update audit fields
func (t *Tenant) BeforeUpdate(tx *gorm.DB) error {
	// Update timestamp
	t.UpdatedAt = time.Now()

	// Increment version for optimistic locking
	t.Version++

	// Rebuild path if parent changed
	if tx.Statement.Changed("ParentTenantID") {
		if err := t.buildPath(tx); err != nil {
			return err
		}
	}

	// Validate
	return t.Validate()
}

// BeforeDelete hook (soft delete)
func (t *Tenant) BeforeDelete(tx *gorm.DB) error {
	// Check if has active children
	var childCount int64
	if err := tx.Model(&Tenant{}).
		Where("parent_tenant_id = ? AND deleted_at IS NULL", t.ID).
		Count(&childCount).Error; err != nil {
		return err
	}

	if childCount > 0 {
		return errors.New("cannot delete tenant with active child tenants")
	}

	return nil
}

// ==================== VALIDATION ====================

// Validate validates the tenant model
func (t *Tenant) Validate() error {
	// Required fields
	if t.Code == "" {
		return errors.New("tenant code is required")
	}
	if t.Name == "" {
		return errors.New("tenant name is required")
	}

	// Code format validation (lowercase alphanumeric with hyphens)
	if !isValidTenantCode(t.Code) {
		return errors.New("tenant code must be lowercase alphanumeric with hyphens only")
	}

	// Enum validations
	if !t.Status.IsValid() {
		return errors.New("invalid tenant status")
	}
	if !t.Tier.IsValid() {
		return errors.New("invalid tenant tier")
	}
	if !t.BillingType.IsValid() {
		return errors.New("invalid billing type")
	}
	if !t.DataRegion.IsValid() {
		return errors.New("invalid data region")
	}
	if !t.ComplianceLevel.IsValid() {
		return errors.New("invalid compliance level")
	}

	// Business logic validations
	if t.ParentTenantID != nil && *t.ParentTenantID == t.ID {
		return errors.New("tenant cannot be its own parent")
	}

	if t.Settings.CurrentUsers > t.Settings.MaxUsers {
		return errors.New("current users cannot exceed max users")
	}

	if t.Settings.CurrentStorage > t.Settings.MaxStorage {
		return errors.New("current storage cannot exceed max storage")
	}

	return nil
}

// isValidTenantCode checks if code follows the format: lowercase alphanumeric with hyphens
func isValidTenantCode(code string) bool {
	if len(code) == 0 || len(code) > 64 {
		return false
	}

	for _, char := range code {
		if !((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-') {
			return false
		}
	}

	// Cannot start or end with hyphen
	if code[0] == '-' || code[len(code)-1] == '-' {
		return false
	}

	return true
}

// ==================== HELPER METHODS ====================

// buildPath builds the materialized path for hierarchical queries
func (t *Tenant) buildPath(tx *gorm.DB) error {
	if t.ParentTenantID == nil {
		// Root tenant
		t.Path = "/" + t.ID.String() + "/"
		return nil
	}

	// Get parent tenant
	var parent Tenant
	if err := tx.Select("path").First(&parent, t.ParentTenantID).Error; err != nil {
		return err
	}

	// Build path: parent_path + current_id + /
	t.Path = parent.Path + t.ID.String() + "/"
	return nil
}

// IsRoot checks if tenant is a root tenant (no parent)
func (t *Tenant) IsRoot() bool {
	return t.ParentTenantID == nil
}

// GetDepth returns the depth in the hierarchy (0 for root)
func (t *Tenant) GetDepth() int {
	if t.Path == "" {
		return 0
	}

	// Count slashes - 2 (for leading and trailing)
	depth := 0
	for _, char := range t.Path {
		if char == '/' {
			depth++
		}
	}
	return depth - 2
}

// IsPartner checks if tenant is a partner
func (t *Tenant) IsPartner() bool {
	return t.Tier.IsPartner()
}

// IsActive checks if tenant is active
func (t *Tenant) IsActive() bool {
	return t.Status == TenantStatusActive
}

// IsSuspended checks if tenant is suspended
func (t *Tenant) IsSuspended() bool {
	return t.Status == TenantStatusSuspended
}

// IsTrial checks if tenant is in trial
func (t *Tenant) IsTrial() bool {
	return t.Status == TenantStatusTrial
}

// GetUsagePercentage returns storage usage percentage
func (t *Tenant) GetStorageUsagePercentage() float64 {
	if t.Settings.MaxStorage == 0 {
		return 0
	}
	return float64(t.Settings.CurrentStorage) / float64(t.Settings.MaxStorage) * 100
}

// GetUserUsagePercentage returns user usage percentage
func (t *Tenant) GetUserUsagePercentage() float64 {
	if t.Settings.MaxUsers == 0 {
		return 0
	}
	return float64(t.Settings.CurrentUsers) / float64(t.Settings.MaxUsers) * 100
}

// IsStorageLimitReached checks if storage limit is reached
func (t *Tenant) IsStorageLimitReached() bool {
	return t.Settings.CurrentStorage >= t.Settings.MaxStorage
}

// IsUserLimitReached checks if user limit is reached
func (t *Tenant) IsUserLimitReached() bool {
	return t.Settings.CurrentUsers >= t.Settings.MaxUsers
}

// CanAddUser checks if can add more users
func (t *Tenant) CanAddUser() bool {
	return !t.IsUserLimitReached()
}

// CanUseStorage checks if can use more storage
func (t *Tenant) CanUseStorage(additionalGB int) bool {
	return t.Settings.CurrentStorage+additionalGB <= t.Settings.MaxStorage
}

// HasFeature checks if tenant has a specific feature
func (t *Tenant) HasFeature(feature string) bool {
	for _, f := range t.Settings.Features {
		if f == feature {
			return true
		}
	}
	return false
}

// ==================== QUERY HELPERS ====================

// ScopeActive returns active tenants only
func ScopeActive(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", TenantStatusActive)
}

// ScopeNotDeleted returns non-deleted tenants
func ScopeNotDeleted(db *gorm.DB) *gorm.DB {
	return db.Where("deleted_at IS NULL")
}

// ScopeByTier filters by tier
func ScopeByTier(tier TenantTier) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tier = ?", tier)
	}
}

// ScopeByRegion filters by data region
func ScopeByRegion(region DataRegion) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("data_region = ?", region)
	}
}

// ScopeRootTenants returns root tenants only
func ScopeRootTenants(db *gorm.DB) *gorm.DB {
	return db.Where("parent_tenant_id IS NULL")
}

// ScopeChildrenOf returns children of a specific tenant
func ScopeChildrenOf(parentID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("parent_tenant_id = ?", parentID)
	}
}

// ScopePartners returns partner tenants only
func ScopePartners(db *gorm.DB) *gorm.DB {
	return db.Where("tier IN ?", []TenantTier{
		TenantTierPartnerBasic,
		TenantTierPartnerPremium,
		TenantTierPartnerElite,
	})
}

// ==================== DTO STRUCTS ====================

// CreateTenantRequest represents the request to create a new tenant
type CreateTenantRequest struct {
	Code             string                 `json:"code" binding:"required,max=64"`
	Name             string                 `json:"name" binding:"required"`
	ParentTenantID   *uuid.UUID             `json:"parent_tenant_id,omitempty"`
	PartnerTenantID  *uuid.UUID             `json:"partner_tenant_id,omitempty"`
	Tier             TenantTier             `json:"tier" binding:"required"`
	Status           TenantStatus           `json:"status" binding:"required"`
	DataRegion       DataRegion             `json:"data_region" binding:"required"`
	ComplianceLevel  ComplianceLevel        `json:"compliance_level" binding:"required"`
	Timezone         string                 `json:"timezone,omitempty"`
	BillingType      BillingType            `json:"billing_type" binding:"required"`
	Profile          map[string]interface{} `json:"profile,omitempty"`
	Settings         map[string]interface{} `json:"settings,omitempty"`
	CreatedBy        *uuid.UUID             `json:"created_by,omitempty"`
}

// UpdateTenantRequest represents the request to update a tenant
type UpdateTenantRequest struct {
	Code            *string                `json:"code,omitempty"`
	Name            *string                `json:"name,omitempty"`
	ParentTenantID  *uuid.UUID             `json:"parent_tenant_id,omitempty"`
	PartnerTenantID *uuid.UUID             `json:"partner_tenant_id,omitempty"`
	Tier            *TenantTier            `json:"tier,omitempty"`
	Status          *TenantStatus          `json:"status,omitempty"`
	DataRegion      *DataRegion            `json:"data_region,omitempty"`
	ComplianceLevel *ComplianceLevel       `json:"compliance_level,omitempty"`
	Timezone        *string                `json:"timezone,omitempty"`
	BillingType     *BillingType           `json:"billing_type,omitempty"`
	Profile         map[string]interface{} `json:"profile,omitempty"`
	Settings        map[string]interface{} `json:"settings,omitempty"`
	UpdatedBy       *uuid.UUID             `json:"updated_by,omitempty"`
	Version         int64                  `json:"version" binding:"required"` // For optimistic locking
}

// TenantResponse represents the API response for a tenant
type TenantResponse struct {
	ID              uuid.UUID       `json:"_id"`
	Code            string          `json:"code"`
	Name            string          `json:"name"`
	Tier            TenantTier      `json:"tier"`
	Status          TenantStatus    `json:"status"`
	DataRegion      DataRegion      `json:"data_region"`
	ComplianceLevel ComplianceLevel `json:"compliance_level"`
	ParentTenantID  *uuid.UUID      `json:"parent_tenant_id,omitempty"`
	PartnerTenantID *uuid.UUID      `json:"partner_tenant_id,omitempty"`
	Path            string          `json:"path,omitempty"`
	Timezone        string          `json:"timezone"`
	BillingType     BillingType     `json:"billing_type"`
	Profile         TenantProfile   `json:"profile"`
	Settings        TenantSettings  `json:"settings"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       *time.Time      `json:"deleted_at,omitempty"`
	CreatedBy       *uuid.UUID      `json:"created_by,omitempty"`
	UpdatedBy       *uuid.UUID      `json:"updated_by,omitempty"`
	Version         int64           `json:"version"`
}

// ToResponse converts Tenant model to TenantResponse
func (t *Tenant) ToResponse() *TenantResponse {
	return &TenantResponse{
		ID:              t.ID,
		Code:            t.Code,
		Name:            t.Name,
		Tier:            t.Tier,
		Status:          t.Status,
		DataRegion:      t.DataRegion,
		ComplianceLevel: t.ComplianceLevel,
		ParentTenantID:  t.ParentTenantID,
		PartnerTenantID: t.PartnerTenantID,
		Path:            t.Path,
		Timezone:        t.Timezone,
		BillingType:     t.BillingType,
		Profile:         t.Profile,
		Settings:        t.Settings,
		CreatedAt:       t.CreatedAt,
		UpdatedAt:       t.UpdatedAt,
		DeletedAt:       t.DeletedAt,
		CreatedBy:       t.CreatedBy,
		UpdatedBy:       t.UpdatedBy,
		Version:         t.Version,
	}
}
