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
// PRODUCT - Main Product Model
// ============================================================================
// Purpose: Core product entity for e-commerce/SaaS platform
// Table: products
// Primary Key: _id (UUID)
// Features: Variants, Categories, Pricing, Multi-currency, SEO
// ============================================================================

// ProductType represents the type of product
type ProductType string

const (
	ProductTypePhysical ProductType = "PHYSICAL" // Physical goods
	ProductTypeDigital  ProductType = "DIGITAL"  // Digital downloads
	ProductTypeService  ProductType = "SERVICE"  // Services
	ProductTypeApp      ProductType = "APP"      // SaaS application
	ProductTypeDomain   ProductType = "DOMAIN"   // Domain registration
	ProductTypeSSL      ProductType = "SSL"      // SSL certificates
)

// ProductStatus represents the lifecycle status
type ProductStatus string

const (
	ProductStatusDraft     ProductStatus = "DRAFT"     // Being created
	ProductStatusActive    ProductStatus = "ACTIVE"    // Available for sale
	ProductStatusInactive  ProductStatus = "INACTIVE"  // Temporarily unavailable
	ProductStatusArchived  ProductStatus = "ARCHIVED"  // Discontinued
	ProductStatusSoldOut   ProductStatus = "SOLD_OUT"  // Out of stock
)

// ProductVisibility controls where the product is shown
type ProductVisibility string

const (
	ProductVisibilityPublic   ProductVisibility = "PUBLIC"   // Visible to all
	ProductVisibilityPrivate  ProductVisibility = "PRIVATE"  // Only admins
	ProductVisibilityHidden   ProductVisibility = "HIDDEN"   // Hidden from catalogs
	ProductVisibilityFeatured ProductVisibility = "FEATURED" // Featured products
)

// PricingModel defines how the product is priced
type PricingModel string

const (
	PricingModelOneTime     PricingModel = "ONE_TIME"     // One-time purchase
	PricingModelSubscription PricingModel = "SUBSCRIPTION" // Recurring subscription
	PricingModelUsageBased  PricingModel = "USAGE_BASED"  // Pay-per-use
	PricingModelTiered      PricingModel = "TIERED"       // Tiered pricing
	PricingModelFree        PricingModel = "FREE"         // Free product
)

// SEOData stores SEO information (JSONB)
type SEOData struct {
	MetaTitle       string   `json:"meta_title,omitempty"`
	MetaDescription string   `json:"meta_description,omitempty"`
	MetaKeywords    []string `json:"meta_keywords,omitempty"`
	OGTitle         string   `json:"og_title,omitempty"`
	OGDescription   string   `json:"og_description,omitempty"`
	OGImage         string   `json:"og_image,omitempty"`
	CanonicalURL    string   `json:"canonical_url,omitempty"`
}

// Scan implements sql.Scanner for SEOData
func (s *SEOData) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan SEOData")
	}
	return json.Unmarshal(bytes, s)
}

// Value implements driver.Valuer for SEOData
func (s SEOData) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// ProductDimensions stores physical dimensions (JSONB)
type ProductDimensions struct {
	Length float64 `json:"length,omitempty"` // cm
	Width  float64 `json:"width,omitempty"`  // cm
	Height float64 `json:"height,omitempty"` // cm
	Weight float64 `json:"weight,omitempty"` // kg
	Unit   string  `json:"unit,omitempty"`   // metric, imperial
}

// Scan implements sql.Scanner for ProductDimensions
func (pd *ProductDimensions) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan ProductDimensions")
	}
	return json.Unmarshal(bytes, pd)
}

// Value implements driver.Valuer for ProductDimensions
func (pd ProductDimensions) Value() (driver.Value, error) {
	return json.Marshal(pd)
}

// StringArray for PostgreSQL text[] type
type StringArray []string

func (sa *StringArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan StringArray")
	}
	str := string(bytes)
	str = strings.Trim(str, "{}")
	if str == "" {
		*sa = []string{}
		return nil
	}
	*sa = strings.Split(str, ",")
	return nil
}

func (sa StringArray) Value() (driver.Value, error) {
	if len(sa) == 0 {
		return "{}", nil
	}
	return "{" + strings.Join(sa, ",") + "}", nil
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
// Product - Main Model (30 fields)
// ============================================================================

type Product struct {
	// ========== Identity & Relationships (3 fields) ==========
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`

	// ========== Basic Information (6 fields) ==========
	Code        string      `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string      `gorm:"column:name;type:varchar(255);not null;index" json:"name"`
	Slug        string      `gorm:"column:slug;type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`
	ShortDesc   *string     `gorm:"column:short_desc;type:varchar(500)" json:"short_desc,omitempty"`
	Type        ProductType `gorm:"column:type;type:varchar(20);default:'PHYSICAL';index" json:"type"`

	// ========== Status & Visibility (3 fields) ==========
	Status     ProductStatus     `gorm:"column:status;type:varchar(20);default:'DRAFT';index" json:"status"`
	Visibility ProductVisibility `gorm:"column:visibility;type:varchar(20);default:'PUBLIC'" json:"visibility"`
	IsActive   bool              `gorm:"column:is_active;default:true;index" json:"is_active"`

	// ========== Pricing (4 fields) ==========
	BasePrice    float64      `gorm:"column:base_price;type:decimal(15,2);not null" json:"base_price"`
	SalePrice    *float64     `gorm:"column:sale_price;type:decimal(15,2)" json:"sale_price,omitempty"`
	Currency     string       `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`
	PricingModel PricingModel `gorm:"column:pricing_model;type:varchar(20);default:'ONE_TIME'" json:"pricing_model"`

	// ========== Media (3 fields) ==========
	ImageURL       *string     `gorm:"column:image_url;type:text" json:"image_url,omitempty"`
	GalleryImages  StringArray `gorm:"column:gallery_images;type:text[]" json:"gallery_images,omitempty"`
	VideoURL       *string     `gorm:"column:video_url;type:text" json:"video_url,omitempty"`

	// ========== Product Details (2 fields) ==========
	Dimensions *ProductDimensions `gorm:"column:dimensions;type:jsonb" json:"dimensions,omitempty"`
	Tags       StringArray        `gorm:"column:tags;type:text[]" json:"tags,omitempty"`

	// ========== SEO (1 field) ==========
	SEO *SEOData `gorm:"column:seo;type:jsonb" json:"seo,omitempty"`

	// ========== Features & Configuration (2 fields) ==========
	IsFeatured     bool  `gorm:"column:is_featured;default:false;index" json:"is_featured"`
	HasVariants    bool  `gorm:"column:has_variants;default:false" json:"has_variants"`

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

	// Relationships
	Category *ProductCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Variants []ProductVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
}

// TableName specifies the table name for Product
func (Product) TableName() string {
	return "products"
}

// ============================================================================
// GORM Hooks
// ============================================================================

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}

	if p.Slug == "" {
		p.Slug = generateSlug(p.Name)
	}

	if err := p.Validate(); err != nil {
		return err
	}

	return nil
}

func (p *Product) BeforeUpdate(tx *gorm.DB) error {
	p.Version++

	if err := p.Validate(); err != nil {
		return err
	}

	return nil
}

// ============================================================================
// Validation
// ============================================================================

func (p *Product) Validate() error {
	if p.Code == "" {
		return errors.New("product code is required")
	}
	if p.Name == "" {
		return errors.New("product name is required")
	}
	if p.BasePrice < 0 {
		return errors.New("base price cannot be negative")
	}
	if p.SalePrice != nil && *p.SalePrice < 0 {
		return errors.New("sale price cannot be negative")
	}
	if p.SalePrice != nil && *p.SalePrice > p.BasePrice {
		return errors.New("sale price cannot exceed base price")
	}
	return nil
}

// ============================================================================
// Helper Methods
// ============================================================================

func (p *Product) IsActive() bool {
	return p.Status == ProductStatusActive && p.IsActive && p.DeletedAt == nil
}

func (p *Product) IsOnSale() bool {
	return p.SalePrice != nil && *p.SalePrice < p.BasePrice
}

func (p *Product) GetEffectivePrice() float64 {
	if p.IsOnSale() {
		return *p.SalePrice
	}
	return p.BasePrice
}

func (p *Product) GetDiscountPercentage() float64 {
	if !p.IsOnSale() {
		return 0
	}
	return ((p.BasePrice - *p.SalePrice) / p.BasePrice) * 100
}

func (p *Product) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	p.DeletedAt = &now
	p.DeletedBy = &deletedBy
	p.IsActive = false
}

func (p *Product) ToggleFeatured() {
	p.IsFeatured = !p.IsFeatured
}

func (p *Product) Activate() error {
	if p.DeletedAt != nil {
		return errors.New("cannot activate deleted product")
	}
	p.Status = ProductStatusActive
	p.IsActive = true
	return nil
}

func (p *Product) Deactivate() {
	p.Status = ProductStatusInactive
	p.IsActive = false
}

// ============================================================================
// PRODUCT CATEGORY - Product Categories
// ============================================================================

type ProductCategory struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Category Info (6 fields)
	Code        string     `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string     `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Slug        string     `gorm:"column:slug;type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description *string    `gorm:"column:description;type:text" json:"description,omitempty"`
	ParentID    *uuid.UUID `gorm:"column:parent_id;type:uuid;index" json:"parent_id,omitempty"`
	Path        *string    `gorm:"column:path;type:text" json:"path,omitempty"` // Materialized path

	// Display (3 fields)
	ImageURL     *string `gorm:"column:image_url;type:text" json:"image_url,omitempty"`
	DisplayOrder int     `gorm:"column:display_order;default:0" json:"display_order"`
	IsActive     bool    `gorm:"column:is_active;default:true;index" json:"is_active"`

	// SEO (1 field)
	SEO *SEOData `gorm:"column:seo;type:jsonb" json:"seo,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Versioning (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationships
	ParentCategory *ProductCategory   `gorm:"foreignKey:ParentID" json:"parent_category,omitempty"`
	ChildCategories []ProductCategory `gorm:"foreignKey:ParentID" json:"child_categories,omitempty"`
	Products        []Product         `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}

func (ProductCategory) TableName() string {
	return "product_categories"
}

func (pc *ProductCategory) IsRoot() bool {
	return pc.ParentID == nil
}

func (pc *ProductCategory) GetDepth() int {
	if pc.Path == nil {
		return 0
	}
	return strings.Count(*pc.Path, "/") - 1
}

// ============================================================================
// PRODUCT VARIANT - Product Variations
// ============================================================================

type ProductVariant struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID uuid.UUID `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`

	// Variant Info (5 fields)
	SKU         string  `gorm:"column:sku;type:varchar(100);uniqueIndex;not null" json:"sku"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	ImageURL    *string `gorm:"column:image_url;type:text" json:"image_url,omitempty"`
	IsDefault   bool    `gorm:"column:is_default;default:false" json:"is_default"`

	// Pricing (2 fields)
	Price      float64  `gorm:"column:price;type:decimal(15,2);not null" json:"price"`
	SalePrice  *float64 `gorm:"column:sale_price;type:decimal(15,2)" json:"sale_price,omitempty"`

	// Attributes (1 field)
	Attributes JSONB `gorm:"column:attributes;type:jsonb" json:"attributes,omitempty"` // e.g., {"size": "L", "color": "Red"}

	// Status (2 fields)
	IsActive    bool `gorm:"column:is_active;default:true;index" json:"is_active"`
	IsAvailable bool `gorm:"column:is_available;default:true" json:"is_available"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Versioning (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationship
	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (ProductVariant) TableName() string {
	return "product_variants"
}

func (pv *ProductVariant) IsOnSale() bool {
	return pv.SalePrice != nil && *pv.SalePrice < pv.Price
}

func (pv *ProductVariant) GetEffectivePrice() float64 {
	if pv.IsOnSale() {
		return *pv.SalePrice
	}
	return pv.Price
}

func (pv *ProductVariant) GetAttribute(key string) (interface{}, bool) {
	if pv.Attributes == nil {
		return nil, false
	}
	val, ok := pv.Attributes[key]
	return val, ok
}

// ============================================================================
// PRODUCT PRICING - Advanced Pricing Rules
// ============================================================================

type PricingRuleType string

const (
	PricingRuleTypeBulkDiscount     PricingRuleType = "BULK_DISCOUNT"     // Volume discount
	PricingRuleTypeTimeBased        PricingRuleType = "TIME_BASED"        // Time-limited pricing
	PricingRuleTypeCustomerSegment  PricingRuleType = "CUSTOMER_SEGMENT"  // Segment-based pricing
	PricingRuleTypeGeographic       PricingRuleType = "GEOGRAPHIC"        // Region-based pricing
)

type ProductPricing struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID uuid.UUID `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`

	// Pricing Rule (5 fields)
	RuleType    PricingRuleType `gorm:"column:rule_type;type:varchar(50);not null" json:"rule_type"`
	Name        string          `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string         `gorm:"column:description;type:text" json:"description,omitempty"`
	Priority    int             `gorm:"column:priority;default:0" json:"priority"`
	IsActive    bool            `gorm:"column:is_active;default:true" json:"is_active"`

	// Price Adjustment (2 fields)
	DiscountType  string  `gorm:"column:discount_type;type:varchar(20)" json:"discount_type"` // percentage, fixed, override
	DiscountValue float64 `gorm:"column:discount_value;type:decimal(15,2)" json:"discount_value"`

	// Conditions (3 fields)
	MinQuantity *int       `gorm:"column:min_quantity" json:"min_quantity,omitempty"`
	MaxQuantity *int       `gorm:"column:max_quantity" json:"max_quantity,omitempty"`
	Conditions  JSONB      `gorm:"column:conditions;type:jsonb" json:"conditions,omitempty"`

	// Time Period (2 fields)
	ValidFrom *time.Time `gorm:"column:valid_from" json:"valid_from,omitempty"`
	ValidTo   *time.Time `gorm:"column:valid_to" json:"valid_to,omitempty"`

	// Audit (4 fields)
	CreatedAt, UpdatedAt, CreatedBy, UpdatedBy

	// Soft Delete & Version (3 fields)
	DeletedAt, DeletedBy, Version
}

func (ProductPricing) TableName() string {
	return "product_pricing"
}

func (pp *ProductPricing) IsValid() bool {
	now := time.Now()
	if !pp.IsActive {
		return false
	}
	if pp.ValidFrom != nil && now.Before(*pp.ValidFrom) {
		return false
	}
	if pp.ValidTo != nil && now.After(*pp.ValidTo) {
		return false
	}
	return true
}

func (pp *ProductPricing) CalculatePrice(basePrice float64, quantity int) float64 {
	if !pp.IsValid() {
		return basePrice
	}

	// Check quantity conditions
	if pp.MinQuantity != nil && quantity < *pp.MinQuantity {
		return basePrice
	}
	if pp.MaxQuantity != nil && quantity > *pp.MaxQuantity {
		return basePrice
	}

	// Apply discount
	switch pp.DiscountType {
	case "percentage":
		return basePrice * (1 - pp.DiscountValue/100)
	case "fixed":
		return basePrice - pp.DiscountValue
	case "override":
		return pp.DiscountValue
	default:
		return basePrice
	}
}

// ============================================================================
// Response DTOs
// ============================================================================

type ProductResponse struct {
	ID           uuid.UUID         `json:"_id"`
	TenantID     *uuid.UUID        `json:"tenant_id,omitempty"`
	CategoryID   *uuid.UUID        `json:"category_id,omitempty"`
	Code         string            `json:"code"`
	Name         string            `json:"name"`
	Slug         string            `json:"slug"`
	Description  *string           `json:"description,omitempty"`
	ShortDesc    *string           `json:"short_desc,omitempty"`
	Type         ProductType       `json:"type"`
	Status       ProductStatus     `json:"status"`
	Visibility   ProductVisibility `json:"visibility"`
	IsActive     bool              `json:"is_active"`
	BasePrice    float64           `json:"base_price"`
	SalePrice    *float64          `json:"sale_price,omitempty"`
	Currency     string            `json:"currency"`
	PricingModel PricingModel      `json:"pricing_model"`
	ImageURL     *string           `json:"image_url,omitempty"`
	IsFeatured   bool              `json:"is_featured"`
	HasVariants  bool              `json:"has_variants"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	Version      int64             `json:"version"`
}

func (p *Product) ToResponse() *ProductResponse {
	return &ProductResponse{
		ID:           p.ID,
		TenantID:     p.TenantID,
		CategoryID:   p.CategoryID,
		Code:         p.Code,
		Name:         p.Name,
		Slug:         p.Slug,
		Description:  p.Description,
		ShortDesc:    p.ShortDesc,
		Type:         p.Type,
		Status:       p.Status,
		Visibility:   p.Visibility,
		IsActive:     p.IsActive,
		BasePrice:    p.BasePrice,
		SalePrice:    p.SalePrice,
		Currency:     p.Currency,
		PricingModel: p.PricingModel,
		ImageURL:     p.ImageURL,
		IsFeatured:   p.IsFeatured,
		HasVariants:  p.HasVariants,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
		Version:      p.Version,
	}
}

// ============================================================================
// Request DTOs
// ============================================================================

type CreateProductRequest struct {
	TenantID     *uuid.UUID        `json:"tenant_id,omitempty"`
	CategoryID   *uuid.UUID        `json:"category_id,omitempty"`
	Code         string            `json:"code" validate:"required,max=100"`
	Name         string            `json:"name" validate:"required,max=255"`
	Description  *string           `json:"description,omitempty"`
	Type         ProductType       `json:"type"`
	BasePrice    float64           `json:"base_price" validate:"required,gte=0"`
	Currency     string            `json:"currency"`
	PricingModel PricingModel      `json:"pricing_model"`
	ImageURL     *string           `json:"image_url,omitempty"`
	Tags         []string          `json:"tags,omitempty"`
	SEO          *SEOData          `json:"seo,omitempty"`
}

type UpdateProductRequest struct {
	Name         *string           `json:"name,omitempty" validate:"omitempty,max=255"`
	Description  *string           `json:"description,omitempty"`
	Status       *ProductStatus    `json:"status,omitempty"`
	Visibility   *ProductVisibility `json:"visibility,omitempty"`
	BasePrice    *float64          `json:"base_price,omitempty" validate:"omitempty,gte=0"`
	SalePrice    *float64          `json:"sale_price,omitempty" validate:"omitempty,gte=0"`
	IsActive     *bool             `json:"is_active,omitempty"`
	IsFeatured   *bool             `json:"is_featured,omitempty"`
	Version      int64             `json:"version" validate:"required"`
}

// ============================================================================
// Query Scopes
// ============================================================================

func ScopeActiveProducts(db *gorm.DB) *gorm.DB {
	return db.Where("is_active = ? AND status = ? AND deleted_at IS NULL", 
		true, ProductStatusActive)
}

func ScopeByCategory(categoryID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("category_id = ?", categoryID)
	}
}

func ScopeByType(productType ProductType) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("type = ?", productType)
	}
}

func ScopeFeatured(db *gorm.DB) *gorm.DB {
	return db.Where("is_featured = ?", true)
}

func ScopeOnSale(db *gorm.DB) *gorm.DB {
	return db.Where("sale_price IS NOT NULL AND sale_price < base_price")
}

func ScopeSearchProducts(query string) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		searchPattern := "%" + query + "%"
		return db.Where("name ILIKE ? OR description ILIKE ? OR code ILIKE ?", 
			searchPattern, searchPattern, searchPattern)
	}
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
