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
// SERVICE - Service Definition
// ============================================================================
// Purpose: Define available services that customers can subscribe to
// Table: services
// Primary Key: _id (UUID)
// Features: Multi-type services, Categorization, Feature management
// ============================================================================

type ServiceType string

const (
	ServiceTypeSaaS       ServiceType = "SAAS"        // Software as a Service
	ServiceTypePaaS       ServiceType = "PAAS"        // Platform as a Service
	ServiceTypeIaaS       ServiceType = "IAAS"        // Infrastructure as a Service
	ServiceTypeHosting    ServiceType = "HOSTING"     // Hosting service
	ServiceTypeConsulting ServiceType = "CONSULTING"  // Consulting service
	ServiceTypeSupport    ServiceType = "SUPPORT"     // Support service
	ServiceTypeLicense    ServiceType = "LICENSE"     // Software license
	ServiceTypeCustom     ServiceType = "CUSTOM"      // Custom service
)

type ServiceStatus string

const (
	ServiceStatusDraft      ServiceStatus = "DRAFT"
	ServiceStatusActive     ServiceStatus = "ACTIVE"
	ServiceStatusDeprecated ServiceStatus = "DEPRECATED"
	ServiceStatusDiscontinued ServiceStatus = "DISCONTINUED"
)

type BillingModel string

const (
	BillingModelFlat       BillingModel = "FLAT"        // Flat rate
	BillingModelTiered     BillingModel = "TIERED"      // Tiered pricing
	BillingModelVolume     BillingModel = "VOLUME"      // Volume pricing
	BillingModelUsageBased BillingModel = "USAGE_BASED" // Pay per use
	BillingModelPerUser    BillingModel = "PER_USER"    // Per user pricing
	BillingModelPerSeat    BillingModel = "PER_SEAT"    // Per seat pricing
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
// Service Model (32 fields)
// ============================================================================

type Service struct {
	// ========== Identity (2 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// ========== Basic Info (8 fields) ==========
	Code        string        `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string        `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string       `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        ServiceType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	CategoryID  *uuid.UUID    `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`
	Status      ServiceStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	IconURL     *string       `gorm:"column:icon_url;type:text" json:"icon_url,omitempty"`
	ImageURL    *string       `gorm:"column:image_url;type:text" json:"image_url,omitempty"`

	// ========== Billing (3 fields) ==========
	BillingModel BillingModel `gorm:"column:billing_model;type:varchar(20);not null" json:"billing_model"`
	BasePrice    *float64     `gorm:"column:base_price;type:decimal(15,2)" json:"base_price,omitempty"`
	Currency     string       `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// ========== Limits & Quotas (4 fields) ==========
	MaxUsers       *int `gorm:"column:max_users" json:"max_users,omitempty"`
	MaxStorage     *int `gorm:"column:max_storage" json:"max_storage,omitempty"`        // In GB
	MaxBandwidth   *int `gorm:"column:max_bandwidth" json:"max_bandwidth,omitempty"`    // In GB
	MaxAPIRequests *int `gorm:"column:max_api_requests" json:"max_api_requests,omitempty"` // Per month

	// ========== Trial & Setup (4 fields) ==========
	HasTrial           bool `gorm:"column:has_trial;default:false" json:"has_trial"`
	TrialDays          *int `gorm:"column:trial_days" json:"trial_days,omitempty"`
	RequiresSetup      bool `gorm:"column:requires_setup;default:false" json:"requires_setup"`
	SetupFee           *float64 `gorm:"column:setup_fee;type:decimal(15,2)" json:"setup_fee,omitempty"`

	// ========== Marketing (3 fields) ==========
	IsPopular     bool    `gorm:"column:is_popular;default:false" json:"is_popular"`
	IsFeatured    bool    `gorm:"column:is_featured;default:false" json:"is_featured"`
	TagLine       *string `gorm:"column:tag_line;type:varchar(255)" json:"tag_line,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete & Version (3 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationships
	Plans    []ServicePlan    `gorm:"foreignKey:ServiceID" json:"plans,omitempty"`
	Features []ServiceFeature `gorm:"foreignKey:ServiceID" json:"features,omitempty"`
	Category *ServiceCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (Service) TableName() string {
	return "services"
}

// Helper Methods
func (s *Service) IsActive() bool {
	return s.Status == ServiceStatusActive
}

func (s *Service) IsAvailable() bool {
	return s.Status == ServiceStatusActive
}

func (s *Service) HasFreeTrial() bool {
	return s.HasTrial && s.TrialDays != nil && *s.TrialDays > 0
}

// ============================================================================
// SERVICE CATEGORY - Service Categories
// ============================================================================

type ServiceCategory struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Category Info (6 fields)
	Code        string  `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	IconURL     *string `gorm:"column:icon_url;type:text" json:"icon_url,omitempty"`
	DisplayOrder int    `gorm:"column:display_order;default:0" json:"display_order"`
	IsActive    bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Hierarchy (1 field)
	ParentID *uuid.UUID `gorm:"column:parent_id;type:uuid" json:"parent_id,omitempty"`

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

	// Relationships
	Services []Service         `gorm:"foreignKey:CategoryID" json:"services,omitempty"`
	Parent   *ServiceCategory  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []ServiceCategory `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

func (ServiceCategory) TableName() string {
	return "service_categories"
}

// ============================================================================
// SERVICE PLAN - Service Plans/Tiers
// ============================================================================

type PlanType string

const (
	PlanTypeFree       PlanType = "FREE"
	PlanTypeBasic      PlanType = "BASIC"
	PlanTypeStandard   PlanType = "STANDARD"
	PlanTypeProfessional PlanType = "PROFESSIONAL"
	PlanTypePremium    PlanType = "PREMIUM"
	PlanTypeEnterprise PlanType = "ENTERPRISE"
	PlanTypeCustom     PlanType = "CUSTOM"
)

type BillingCycle string

const (
	BillingCycleMonthly    BillingCycle = "MONTHLY"
	BillingCycleQuarterly  BillingCycle = "QUARTERLY"
	BillingCycleSemiAnnual BillingCycle = "SEMI_ANNUAL"
	BillingCycleAnnual     BillingCycle = "ANNUAL"
	BillingCycleBiennial   BillingCycle = "BIENNIAL"
	BillingCycleOneTime    BillingCycle = "ONE_TIME"
)

type ServicePlan struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ServiceID uuid.UUID `gorm:"column:service_id;type:uuid;not null;index" json:"service_id"`

	// Plan Info (7 fields)
	Code        string   `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string   `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string  `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        PlanType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	DisplayOrder int     `gorm:"column:display_order;default:0" json:"display_order"`
	IsActive    bool     `gorm:"column:is_active;default:true" json:"is_active"`
	IsPublic    bool     `gorm:"column:is_public;default:true" json:"is_public"`

	// Pricing (4 fields)
	BillingCycle BillingCycle `gorm:"column:billing_cycle;type:varchar(20);not null" json:"billing_cycle"`
	Price        float64      `gorm:"column:price;type:decimal(15,2);not null" json:"price"`
	SetupFee     float64      `gorm:"column:setup_fee;type:decimal(15,2);default:0" json:"setup_fee"`
	Currency     string       `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Limits & Quotas (7 fields)
	MaxUsers       *int `gorm:"column:max_users" json:"max_users,omitempty"`
	MaxStorage     *int `gorm:"column:max_storage" json:"max_storage,omitempty"`       // In GB
	MaxBandwidth   *int `gorm:"column:max_bandwidth" json:"max_bandwidth,omitempty"`   // In GB
	MaxProjects    *int `gorm:"column:max_projects" json:"max_projects,omitempty"`
	MaxAPIRequests *int `gorm:"column:max_api_requests" json:"max_api_requests,omitempty"` // Per month
	MaxDomains     *int `gorm:"column:max_domains" json:"max_domains,omitempty"`
	MaxEmails      *int `gorm:"column:max_emails" json:"max_emails,omitempty"` // Per month

	// Trial (2 fields)
	HasTrial  bool `gorm:"column:has_trial;default:false" json:"has_trial"`
	TrialDays *int `gorm:"column:trial_days" json:"trial_days,omitempty"`

	// Marketing (3 fields)
	IsRecommended bool    `gorm:"column:is_recommended;default:false" json:"is_recommended"`
	IsPopular     bool    `gorm:"column:is_popular;default:false" json:"is_popular"`
	TagLine       *string `gorm:"column:tag_line;type:varchar(255)" json:"tag_line,omitempty"`

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

	// Relationships
	Service        *Service              `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
	Features       []ServicePlanFeature  `gorm:"foreignKey:PlanID" json:"features,omitempty"`
	PricingTiers   []PricingTier         `gorm:"foreignKey:PlanID" json:"pricing_tiers,omitempty"`
}

func (ServicePlan) TableName() string {
	return "service_plans"
}

func (sp *ServicePlan) IsFree() bool {
	return sp.Price == 0 || sp.Type == PlanTypeFree
}

func (sp *ServicePlan) GetMonthlyPrice() float64 {
	switch sp.BillingCycle {
	case BillingCycleMonthly:
		return sp.Price
	case BillingCycleQuarterly:
		return sp.Price / 3
	case BillingCycleSemiAnnual:
		return sp.Price / 6
	case BillingCycleAnnual:
		return sp.Price / 12
	case BillingCycleBiennial:
		return sp.Price / 24
	default:
		return sp.Price
	}
}

// ============================================================================
// SERVICE FEATURE - Service Features
// ============================================================================

type FeatureType string

const (
	FeatureTypeBoolean FeatureType = "BOOLEAN" // Yes/No feature
	FeatureTypeNumeric FeatureType = "NUMERIC" // Numeric limit
	FeatureTypeText    FeatureType = "TEXT"    // Text feature
	FeatureTypeList    FeatureType = "LIST"    // List of options
)

type ServiceFeature struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ServiceID uuid.UUID `gorm:"column:service_id;type:uuid;not null;index" json:"service_id"`

	// Feature Info (7 fields)
	Code        string      `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string      `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        FeatureType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Unit        *string     `gorm:"column:unit;type:varchar(20)" json:"unit,omitempty"` // GB, users, requests, etc.
	DisplayOrder int        `gorm:"column:display_order;default:0" json:"display_order"`
	IsCore      bool        `gorm:"column:is_core;default:false" json:"is_core"` // Core feature vs addon

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Service *Service `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
}

func (ServiceFeature) TableName() string {
	return "service_features"
}

// ============================================================================
// SERVICE PLAN FEATURE - Plan Feature Mapping
// ============================================================================

type ServicePlanFeature struct {
	// Identity (3 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PlanID    uuid.UUID `gorm:"column:plan_id;type:uuid;not null;index" json:"plan_id"`
	FeatureID uuid.UUID `gorm:"column:feature_id;type:uuid;not null;index" json:"feature_id"`

	// Feature Value (3 fields)
	IsEnabled    bool    `gorm:"column:is_enabled;default:true" json:"is_enabled"`
	Value        *string `gorm:"column:value;type:varchar(255)" json:"value,omitempty"` // For numeric/text features
	NumericValue *float64 `gorm:"column:numeric_value;type:decimal(15,2)" json:"numeric_value,omitempty"`

	// Display (1 field)
	DisplayOrder int `gorm:"column:display_order;default:0" json:"display_order"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Plan    *ServicePlan    `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	Feature *ServiceFeature `gorm:"foreignKey:FeatureID" json:"feature,omitempty"`
}

func (ServicePlanFeature) TableName() string {
	return "service_plan_features"
}

// ============================================================================
// PRICING TIER - Tiered Pricing
// ============================================================================

type PricingTier struct {
	// Identity (2 fields)
	ID     uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PlanID uuid.UUID `gorm:"column:plan_id;type:uuid;not null;index" json:"plan_id"`

	// Tier Info (5 fields)
	Name        string  `gorm:"column:name;type:varchar(100);not null" json:"name"`
	MinQuantity int     `gorm:"column:min_quantity;not null" json:"min_quantity"`
	MaxQuantity *int    `gorm:"column:max_quantity" json:"max_quantity,omitempty"` // Null = unlimited
	UnitPrice   float64 `gorm:"column:unit_price;type:decimal(15,2);not null" json:"unit_price"`
	FlatFee     float64 `gorm:"column:flat_fee;type:decimal(15,2);default:0" json:"flat_fee"`

	// Display (1 field)
	DisplayOrder int `gorm:"column:display_order;default:0" json:"display_order"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Plan *ServicePlan `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
}

func (PricingTier) TableName() string {
	return "pricing_tiers"
}

func (pt *PricingTier) CalculatePrice(quantity int) float64 {
	if quantity < pt.MinQuantity {
		return 0
	}
	if pt.MaxQuantity != nil && quantity > *pt.MaxQuantity {
		quantity = *pt.MaxQuantity
	}
	return pt.FlatFee + (float64(quantity) * pt.UnitPrice)
}

// ============================================================================
// SERVICE ADDON - Service Add-ons
// ============================================================================

type AddonType string

const (
	AddonTypeOneTime   AddonType = "ONE_TIME"
	AddonTypeRecurring AddonType = "RECURRING"
	AddonTypeUsageBased AddonType = "USAGE_BASED"
)

type ServiceAddon struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ServiceID uuid.UUID `gorm:"column:service_id;type:uuid;not null;index" json:"service_id"`

	// Addon Info (5 fields)
	Code        string    `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string    `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string   `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        AddonType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	IsActive    bool      `gorm:"column:is_active;default:true" json:"is_active"`

	// Pricing (3 fields)
	Price    float64 `gorm:"column:price;type:decimal(15,2);not null" json:"price"`
	Unit     *string `gorm:"column:unit;type:varchar(20)" json:"unit,omitempty"` // per user, per GB, etc.
	Currency string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Limits (2 fields)
	MinQuantity int  `gorm:"column:min_quantity;default:1" json:"min_quantity"`
	MaxQuantity *int `gorm:"column:max_quantity" json:"max_quantity,omitempty"`

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
	Service *Service `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
}

func (ServiceAddon) TableName() string {
	return "service_addons"
}

func (sa *ServiceAddon) CalculatePrice(quantity int) float64 {
	if quantity < sa.MinQuantity {
		quantity = sa.MinQuantity
	}
	if sa.MaxQuantity != nil && quantity > *sa.MaxQuantity {
		quantity = *sa.MaxQuantity
	}
	return float64(quantity) * sa.Price
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateService creates a new service with plans
func CreateService(
	db *gorm.DB,
	service *Service,
	plans []ServicePlan,
	features []ServiceFeature,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		service.CreatedBy = userID

		if err := tx.Create(service).Error; err != nil {
			return err
		}

		// Create plans
		if len(plans) > 0 {
			for i := range plans {
				plans[i].ServiceID = service.ID
				plans[i].CreatedBy = userID
			}
			if err := tx.Create(&plans).Error; err != nil {
				return err
			}
		}

		// Create features
		if len(features) > 0 {
			for i := range features {
				features[i].ServiceID = service.ID
				features[i].CreatedBy = userID
			}
			if err := tx.Create(&features).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// GetServiceWithPlans gets service with all plans and features
func GetServiceWithPlans(db *gorm.DB, serviceID uuid.UUID) (*Service, error) {
	var service Service
	err := db.Preload("Plans", func(db *gorm.DB) *gorm.DB {
		return db.Where("is_active = ?", true).Order("display_order ASC")
	}).Preload("Plans.Features.Feature").
		Preload("Features", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("Category").
		First(&service, serviceID).Error

	return &service, err
}

// GetAvailableServices gets all active services
func GetAvailableServices(db *gorm.DB, categoryID *uuid.UUID) ([]Service, error) {
	query := db.Where("status = ?", ServiceStatusActive)

	if categoryID != nil {
		query = query.Where("category_id = ?", categoryID)
	}

	var services []Service
	err := query.Preload("Plans", func(db *gorm.DB) *gorm.DB {
		return db.Where("is_active = ? AND is_public = ?", true, true).
			Order("display_order ASC")
	}).Order("name ASC").Find(&services).Error

	return services, err
}

// ComparePlans compares features across multiple plans
func ComparePlans(db *gorm.DB, planIDs []uuid.UUID) (map[string]interface{}, error) {
	var plans []ServicePlan
	err := db.Preload("Features.Feature").
		Where("_id IN ?", planIDs).
		Order("display_order ASC").
		Find(&plans).Error

	if err != nil {
		return nil, err
	}

	// Build comparison matrix
	comparison := map[string]interface{}{
		"plans": plans,
		"features": make(map[string]map[uuid.UUID]interface{}),
	}

	return comparison, nil
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
