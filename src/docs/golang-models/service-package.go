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

// ============================================================================
// SERVICE PACKAGE - Subscription Plans/Tiers
// ============================================================================
// Purpose: Core service package entity for SaaS subscription platform
// Table: service_packages
// Primary Key: _id (UUID)
// Features: Pricing tiers, Feature sets, Billing cycles, Trial periods
// ============================================================================

// PackageType represents the type of package
type PackageType string

const (
	PackageTypeFree       PackageType = "FREE"       // Free tier
	PackageTypeBasic      PackageType = "BASIC"      // Basic tier
	PackageTypePro        PackageType = "PRO"        // Professional tier
	PackageTypeEnterprise PackageType = "ENTERPRISE" // Enterprise tier
	PackageTypeCustom     PackageType = "CUSTOM"     // Custom package
	PackageTypeTrial      PackageType = "TRIAL"      // Trial package
)

// PackageStatus represents the package lifecycle status
type PackageStatus string

const (
	PackageStatusDraft     PackageStatus = "DRAFT"     // Being created
	PackageStatusActive    PackageStatus = "ACTIVE"    // Available for purchase
	PackageStatusInactive  PackageStatus = "INACTIVE"  // Temporarily unavailable
	PackageStatusArchived  PackageStatus = "ARCHIVED"  // No longer offered
	PackageStatusDeprecated PackageStatus = "DEPRECATED" // Deprecated, existing subscriptions only
)

// BillingCycle represents the billing frequency
type BillingCycle string

const (
	BillingCycleDaily     BillingCycle = "DAILY"
	BillingCycleWeekly    BillingCycle = "WEEKLY"
	BillingCycleMonthly   BillingCycle = "MONTHLY"
	BillingCycleQuarterly BillingCycle = "QUARTERLY"
	BillingCycleYearly    BillingCycle = "YEARLY"
	BillingCycleLifetime  BillingCycle = "LIFETIME"
)

// PricingStrategy defines how the package is priced
type PricingStrategy string

const (
	PricingStrategyFlat       PricingStrategy = "FLAT"        // Fixed price
	PricingStrategyPerUser    PricingStrategy = "PER_USER"    // Per user pricing
	PricingStrategyPerUnit    PricingStrategy = "PER_UNIT"    // Per unit (e.g., per GB)
	PricingStrategyTiered     PricingStrategy = "TIERED"      // Tiered pricing
	PricingStrategyUsageBased PricingStrategy = "USAGE_BASED" // Pay-per-use
)

// PackageFeatures stores package feature configuration (JSONB)
type PackageFeatures struct {
	MaxUsers          *int     `json:"max_users,omitempty"`           // Max number of users
	MaxStorage        *int     `json:"max_storage,omitempty"`         // Max storage in GB
	MaxProjects       *int     `json:"max_projects,omitempty"`        // Max projects
	MaxAPIRequests    *int     `json:"max_api_requests,omitempty"`    // Max API requests per month
	CustomDomain      bool     `json:"custom_domain"`                 // Allow custom domain
	SSLCertificate    bool     `json:"ssl_certificate"`               // SSL included
	PrioritySupport   bool     `json:"priority_support"`              // Priority support
	AdvancedAnalytics bool     `json:"advanced_analytics"`            // Advanced analytics
	APIAccess         bool     `json:"api_access"`                    // API access
	WhiteLabel        bool     `json:"white_label"`                   // White label option
	CustomIntegrations bool    `json:"custom_integrations"`           // Custom integrations
	SLA               *string  `json:"sla,omitempty"`                 // SLA guarantee (e.g., "99.9%")
	Features          []string `json:"features,omitempty"`            // Additional features list
}

// Scan implements sql.Scanner for PackageFeatures
func (pf *PackageFeatures) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan PackageFeatures")
	}
	return json.Unmarshal(bytes, pf)
}

// Value implements driver.Valuer for PackageFeatures
func (pf PackageFeatures) Value() (driver.Value, error) {
	return json.Marshal(pf)
}

// PricingTiers stores tiered pricing (JSONB)
type PricingTiers []struct {
	From     int     `json:"from"`      // Starting quantity
	To       *int    `json:"to,omitempty"` // Ending quantity (null = unlimited)
	Price    float64 `json:"price"`     // Price for this tier
	UnitPrice float64 `json:"unit_price"` // Price per unit in this tier
}

// Scan implements sql.Scanner for PricingTiers
func (pt *PricingTiers) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan PricingTiers")
	}
	return json.Unmarshal(bytes, pt)
}

// Value implements driver.Valuer for PricingTiers
func (pt PricingTiers) Value() (driver.Value, error) {
	return json.Marshal(pt)
}

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
// ServicePackage - Main Model (32 fields)
// ============================================================================

type ServicePackage struct {
	// ========== Identity & Relationships (2 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// ========== Basic Information (6 fields) ==========
	Code        string        `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string        `gorm:"column:name;type:varchar(255);not null;index" json:"name"`
	Slug        string        `gorm:"column:slug;type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description *string       `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        PackageType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status      PackageStatus `gorm:"column:status;type:varchar(20);default:'DRAFT';index" json:"status"`

	// ========== Pricing (6 fields) ==========
	BasePrice       float64         `gorm:"column:base_price;type:decimal(15,2);not null" json:"base_price"`
	Currency        string          `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`
	BillingCycle    BillingCycle    `gorm:"column:billing_cycle;type:varchar(20);not null" json:"billing_cycle"`
	PricingStrategy PricingStrategy `gorm:"column:pricing_strategy;type:varchar(20);default:'FLAT'" json:"pricing_strategy"`
	SetupFee        *float64        `gorm:"column:setup_fee;type:decimal(15,2)" json:"setup_fee,omitempty"`
	PricingTiers    *PricingTiers   `gorm:"column:pricing_tiers;type:jsonb" json:"pricing_tiers,omitempty"`

	// ========== Features & Limits (1 field) ==========
	Features PackageFeatures `gorm:"column:features;type:jsonb;not null" json:"features"`

	// ========== Trial Configuration (3 fields) ==========
	HasTrial        bool `gorm:"column:has_trial;default:false" json:"has_trial"`
	TrialDays       int  `gorm:"column:trial_days;default:0" json:"trial_days"`
	TrialRequiresCC bool `gorm:"column:trial_requires_cc;default:false" json:"trial_requires_cc"` // Requires credit card

	// ========== Display & Marketing (5 fields) ==========
	DisplayOrder  int     `gorm:"column:display_order;default:0" json:"display_order"`
	IsFeatured    bool    `gorm:"column:is_featured;default:false;index" json:"is_featured"`
	IsPopular     bool    `gorm:"column:is_popular;default:false" json:"is_popular"`
	Highlight     *string `gorm:"column:highlight;type:varchar(255)" json:"highlight,omitempty"` // e.g., "Most Popular", "Best Value"
	RecommendedFor *string `gorm:"column:recommended_for;type:text" json:"recommended_for,omitempty"`

	// ========== Visibility & Access (2 fields) ==========
	IsPublic  bool `gorm:"column:is_public;default:true" json:"is_public"`
	IsActive  bool `gorm:"column:is_active;default:true;index" json:"is_active"`

	// ========== Statistics (2 fields) ==========
	SubscriptionCount int `gorm:"column:subscription_count;default:0" json:"subscription_count"`
	Revenue           float64 `gorm:"column:revenue;default:0;type:decimal(20,2)" json:"revenue"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit Fields (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete & Versioning (3 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`
}

// TableName specifies the table name for ServicePackage
func (ServicePackage) TableName() string {
	return "service_packages"
}

// ============================================================================
// GORM Hooks
// ============================================================================

func (sp *ServicePackage) BeforeCreate(tx *gorm.DB) error {
	if sp.ID == uuid.Nil {
		sp.ID = uuid.New()
	}

	if sp.Slug == "" {
		sp.Slug = generateSlug(sp.Name)
	}

	if err := sp.Validate(); err != nil {
		return err
	}

	return nil
}

func (sp *ServicePackage) BeforeUpdate(tx *gorm.DB) error {
	sp.Version++

	if err := sp.Validate(); err != nil {
		return err
	}

	return nil
}

// ============================================================================
// Validation
// ============================================================================

func (sp *ServicePackage) Validate() error {
	if sp.Code == "" {
		return errors.New("package code is required")
	}
	if sp.Name == "" {
		return errors.New("package name is required")
	}
	if sp.BasePrice < 0 {
		return errors.New("base price cannot be negative")
	}
	if sp.SetupFee != nil && *sp.SetupFee < 0 {
		return errors.New("setup fee cannot be negative")
	}
	if sp.TrialDays < 0 {
		return errors.New("trial days cannot be negative")
	}
	return nil
}

// ============================================================================
// Helper Methods
// ============================================================================

func (sp *ServicePackage) IsActive() bool {
	return sp.Status == PackageStatusActive && sp.IsActive && sp.DeletedAt == nil
}

func (sp *ServicePackage) IsFree() bool {
	return sp.Type == PackageTypeFree || sp.BasePrice == 0
}

func (sp *ServicePackage) IsAvailable() bool {
	return sp.IsActive() && sp.IsPublic
}

func (sp *ServicePackage) GetTotalPrice() float64 {
	total := sp.BasePrice
	if sp.SetupFee != nil {
		total += *sp.SetupFee
	}
	return total
}

func (sp *ServicePackage) GetMonthlyEquivalent() float64 {
	switch sp.BillingCycle {
	case BillingCycleDaily:
		return sp.BasePrice * 30
	case BillingCycleWeekly:
		return sp.BasePrice * 4.33
	case BillingCycleMonthly:
		return sp.BasePrice
	case BillingCycleQuarterly:
		return sp.BasePrice / 3
	case BillingCycleYearly:
		return sp.BasePrice / 12
	case BillingCycleLifetime:
		return 0 // Lifetime has no monthly equivalent
	default:
		return sp.BasePrice
	}
}

func (sp *ServicePackage) CalculatePriceForQuantity(quantity int) float64 {
	if sp.PricingStrategy != PricingStrategyTiered || sp.PricingTiers == nil {
		// Simple pricing
		switch sp.PricingStrategy {
		case PricingStrategyPerUser, PricingStrategyPerUnit:
			return sp.BasePrice * float64(quantity)
		default:
			return sp.BasePrice
		}
	}

	// Tiered pricing
	var totalPrice float64
	remainingQty := quantity

	for _, tier := range *sp.PricingTiers {
		if remainingQty <= 0 {
			break
		}

		tierSize := remainingQty
		if tier.To != nil && *tier.To >= tier.From {
			maxInTier := *tier.To - tier.From + 1
			if tierSize > maxInTier {
				tierSize = maxInTier
			}
		}

		totalPrice += tier.UnitPrice * float64(tierSize)
		remainingQty -= tierSize
	}

	return totalPrice
}

func (sp *ServicePackage) IncrementSubscriptions() {
	sp.SubscriptionCount++
}

func (sp *ServicePackage) DecrementSubscriptions() {
	if sp.SubscriptionCount > 0 {
		sp.SubscriptionCount--
	}
}

func (sp *ServicePackage) AddRevenue(amount float64) {
	sp.Revenue += amount
}

func (sp *ServicePackage) Activate() error {
	if sp.DeletedAt != nil {
		return errors.New("cannot activate deleted package")
	}
	sp.Status = PackageStatusActive
	sp.IsActive = true
	return nil
}

func (sp *ServicePackage) Deactivate() {
	sp.Status = PackageStatusInactive
	sp.IsActive = false
}

func (sp *ServicePackage) Deprecate() {
	sp.Status = PackageStatusDeprecated
}

func (sp *ServicePackage) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	sp.DeletedAt = &now
	sp.DeletedBy = &deletedBy
	sp.IsActive = false
}

// ============================================================================
// PACKAGE FEATURE - Individual Features
// ============================================================================

type FeatureType string

const (
	FeatureTypeBoolean FeatureType = "BOOLEAN" // On/off feature
	FeatureTypeNumeric FeatureType = "NUMERIC" // Numeric limit
	FeatureTypeText    FeatureType = "TEXT"    // Text value
)

type PackageFeature struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PackageID uuid.UUID `gorm:"column:package_id;type:uuid;not null;index" json:"package_id"`

	// Feature Info (6 fields)
	Code        string      `gorm:"column:code;type:varchar(100);not null;index" json:"code"`
	Name        string      `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        FeatureType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Value       JSONB       `gorm:"column:value;type:jsonb;not null" json:"value"`
	DisplayOrder int        `gorm:"column:display_order;default:0" json:"display_order"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationship
	Package *ServicePackage `gorm:"foreignKey:PackageID" json:"package,omitempty"`
}

func (PackageFeature) TableName() string {
	return "package_features"
}

// ============================================================================
// PACKAGE COMPARISON - Compare features across packages
// ============================================================================

type PackageComparison struct {
	Packages []ServicePackage   `json:"packages"`
	Features []FeatureComparison `json:"features"`
}

type FeatureComparison struct {
	Code        string                   `json:"code"`
	Name        string                   `json:"name"`
	Description *string                  `json:"description,omitempty"`
	Values      map[string]interface{}   `json:"values"` // packageID -> value
}

// ============================================================================
// PACKAGE ADDON - Add-ons for packages
// ============================================================================

type AddonType string

const (
	AddonTypeOneTime   AddonType = "ONE_TIME"   // One-time purchase
	AddonTypeRecurring AddonType = "RECURRING"  // Recurring charge
	AddonTypeUsageBased AddonType = "USAGE_BASED" // Based on usage
)

type PackageAddon struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PackageID uuid.UUID `gorm:"column:package_id;type:uuid;not null;index" json:"package_id"`

	// Addon Info (6 fields)
	Code        string    `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string    `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string   `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        AddonType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	IsOptional  bool      `gorm:"column:is_optional;default:true" json:"is_optional"`
	IsActive    bool      `gorm:"column:is_active;default:true" json:"is_active"`

	// Pricing (2 fields)
	Price    float64      `gorm:"column:price;type:decimal(15,2);not null" json:"price"`
	Currency string       `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Billing (1 field)
	BillingCycle *BillingCycle `gorm:"column:billing_cycle;type:varchar(20)" json:"billing_cycle,omitempty"`

	// Limits (1 field)
	Quota JSONB `gorm:"column:quota;type:jsonb" json:"quota,omitempty"` // e.g., {"additional_users": 10}

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Version (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationship
	Package *ServicePackage `gorm:"foreignKey:PackageID" json:"package,omitempty"`
}

func (PackageAddon) TableName() string {
	return "package_addons"
}

// ============================================================================
// Response DTOs
// ============================================================================

type ServicePackageResponse struct {
	ID                uuid.UUID       `json:"_id"`
	TenantID          *uuid.UUID      `json:"tenant_id,omitempty"`
	Code              string          `json:"code"`
	Name              string          `json:"name"`
	Slug              string          `json:"slug"`
	Description       *string         `json:"description,omitempty"`
	Type              PackageType     `json:"type"`
	Status            PackageStatus   `json:"status"`
	BasePrice         float64         `json:"base_price"`
	Currency          string          `json:"currency"`
	BillingCycle      BillingCycle    `json:"billing_cycle"`
	PricingStrategy   PricingStrategy `json:"pricing_strategy"`
	SetupFee          *float64        `json:"setup_fee,omitempty"`
	Features          PackageFeatures `json:"features"`
	HasTrial          bool            `json:"has_trial"`
	TrialDays         int             `json:"trial_days"`
	IsFeatured        bool            `json:"is_featured"`
	IsPopular         bool            `json:"is_popular"`
	Highlight         *string         `json:"highlight,omitempty"`
	SubscriptionCount int             `json:"subscription_count"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	Version           int64           `json:"version"`
}

func (sp *ServicePackage) ToResponse() *ServicePackageResponse {
	return &ServicePackageResponse{
		ID:                sp.ID,
		TenantID:          sp.TenantID,
		Code:              sp.Code,
		Name:              sp.Name,
		Slug:              sp.Slug,
		Description:       sp.Description,
		Type:              sp.Type,
		Status:            sp.Status,
		BasePrice:         sp.BasePrice,
		Currency:          sp.Currency,
		BillingCycle:      sp.BillingCycle,
		PricingStrategy:   sp.PricingStrategy,
		SetupFee:          sp.SetupFee,
		Features:          sp.Features,
		HasTrial:          sp.HasTrial,
		TrialDays:         sp.TrialDays,
		IsFeatured:        sp.IsFeatured,
		IsPopular:         sp.IsPopular,
		Highlight:         sp.Highlight,
		SubscriptionCount: sp.SubscriptionCount,
		CreatedAt:         sp.CreatedAt,
		UpdatedAt:         sp.UpdatedAt,
		Version:           sp.Version,
	}
}

// ============================================================================
// Request DTOs
// ============================================================================

type CreateServicePackageRequest struct {
	TenantID        *uuid.UUID      `json:"tenant_id,omitempty"`
	Code            string          `json:"code" validate:"required,max=100"`
	Name            string          `json:"name" validate:"required,max=255"`
	Description     *string         `json:"description,omitempty"`
	Type            PackageType     `json:"type" validate:"required"`
	BasePrice       float64         `json:"base_price" validate:"required,gte=0"`
	Currency        string          `json:"currency"`
	BillingCycle    BillingCycle    `json:"billing_cycle" validate:"required"`
	PricingStrategy PricingStrategy `json:"pricing_strategy"`
	SetupFee        *float64        `json:"setup_fee,omitempty" validate:"omitempty,gte=0"`
	Features        PackageFeatures `json:"features" validate:"required"`
	HasTrial        bool            `json:"has_trial"`
	TrialDays       int             `json:"trial_days"`
}

type UpdateServicePackageRequest struct {
	Name        *string         `json:"name,omitempty" validate:"omitempty,max=255"`
	Description *string         `json:"description,omitempty"`
	Status      *PackageStatus  `json:"status,omitempty"`
	BasePrice   *float64        `json:"base_price,omitempty" validate:"omitempty,gte=0"`
	SetupFee    *float64        `json:"setup_fee,omitempty" validate:"omitempty,gte=0"`
	Features    *PackageFeatures `json:"features,omitempty"`
	IsActive    *bool           `json:"is_active,omitempty"`
	IsFeatured  *bool           `json:"is_featured,omitempty"`
	IsPopular   *bool           `json:"is_popular,omitempty"`
	Version     int64           `json:"version" validate:"required"`
}

// ============================================================================
// Query Scopes
// ============================================================================

func ScopeActivePackages(db *gorm.DB) *gorm.DB {
	return db.Where("is_active = ? AND status = ? AND deleted_at IS NULL",
		true, PackageStatusActive)
}

func ScopePublicPackages(db *gorm.DB) *gorm.DB {
	return db.Where("is_public = ?", true)
}

func ScopeByType(packageType PackageType) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("type = ?", packageType)
	}
}

func ScopeFeaturedPackages(db *gorm.DB) *gorm.DB {
	return db.Where("is_featured = ?", true)
}

func ScopePopularPackages(db *gorm.DB) *gorm.DB {
	return db.Where("is_popular = ?", true)
}

func ScopeByBillingCycle(cycle BillingCycle) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("billing_cycle = ?", cycle)
	}
}

func ScopeOrderedByPrice(db *gorm.DB) *gorm.DB {
	return db.Order("base_price ASC")
}

func ScopeOrderedByDisplay(db *gorm.DB) *gorm.DB {
	return db.Order("display_order ASC, name ASC")
}

// ============================================================================
// Utility Functions
// ============================================================================

func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, slug)
	return slug
}

// ComparePackages compares features across multiple packages
func ComparePackages(db *gorm.DB, packageIDs []uuid.UUID) (*PackageComparison, error) {
	var packages []ServicePackage
	if err := db.Where("_id IN ?", packageIDs).
		Scopes(ScopeOrderedByPrice).
		Find(&packages).Error; err != nil {
		return nil, err
	}

	// Get all features for these packages
	var features []PackageFeature
	if err := db.Where("package_id IN ?", packageIDs).
		Order("display_order ASC").
		Find(&features).Error; err != nil {
		return nil, err
	}

	// Build comparison
	comparison := &PackageComparison{
		Packages: packages,
		Features: make([]FeatureComparison, 0),
	}

	// Group features by code
	featureMap := make(map[string]*FeatureComparison)
	for _, feature := range features {
		if _, exists := featureMap[feature.Code]; !exists {
			featureMap[feature.Code] = &FeatureComparison{
				Code:        feature.Code,
				Name:        feature.Name,
				Description: feature.Description,
				Values:      make(map[string]interface{}),
			}
		}
		featureMap[feature.Code].Values[feature.PackageID.String()] = feature.Value
	}

	// Convert map to slice
	for _, fc := range featureMap {
		comparison.Features = append(comparison.Features, *fc)
	}

	return comparison, nil
}
