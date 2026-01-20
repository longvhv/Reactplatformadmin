package models

// PackageStatus represents package status
type PackageStatus string

const (
	PackageStatusActive      PackageStatus = "ACTIVE"
	PackageStatusInactive    PackageStatus = "INACTIVE"
	PackageStatusDiscontinued PackageStatus = "DISCONTINUED"
)

// BillingCycle represents billing cycle
type BillingCycle string

const (
	BillingCycleMonthly   BillingCycle = "MONTHLY"
	BillingCycleQuarterly BillingCycle = "QUARTERLY"
	BillingCycleYearly    BillingCycle = "YEARLY"
	BillingCycleOneTime   BillingCycle = "ONE_TIME"
)

// Package represents a package/pricing plan in the system
type Package struct {
	BaseModel
	ProductID           string                 `json:"product_id" db:"product_id" validate:"required,uuid"`
	Code                string                 `json:"code" db:"code" validate:"required"`
	Name                string                 `json:"name" db:"name" validate:"required"`
	Description         *string                `json:"description,omitempty" db:"description"`
	Status              PackageStatus          `json:"status" db:"status" validate:"required"`
	Price               float64                `json:"price" db:"price" validate:"required,min=0"`
	Currency            string                 `json:"currency" db:"currency" validate:"required"`
	BillingCycle        BillingCycle           `json:"billing_cycle" db:"billing_cycle" validate:"required"`
	TrialDays           int                    `json:"trial_days" db:"trial_days"`
	MaxUsers            *int                   `json:"max_users,omitempty" db:"max_users"`
	MaxStorage          *int                   `json:"max_storage,omitempty" db:"max_storage"`
	IncludedFeatures    []string               `json:"included_features,omitempty" db:"included_features"`
	IsPopular           bool                   `json:"is_popular" db:"is_popular"`
	SortOrder           int                    `json:"sort_order" db:"sort_order"`
	Metadata            map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	PricingConfiguration map[string]interface{} `json:"pricing_configuration,omitempty" db:"pricing_configuration"`
}

// CreatePackageRequest represents request to create a package
type CreatePackageRequest struct {
	ProductID            string                 `json:"product_id" validate:"required,uuid"`
	Code                 string                 `json:"code" validate:"required,min=2,max=50"`
	Name                 string                 `json:"name" validate:"required,min=1,max=255"`
	Description          *string                `json:"description,omitempty"`
	Status               PackageStatus          `json:"status,omitempty"`
	Price                float64                `json:"price" validate:"required,min=0"`
	Currency             string                 `json:"currency" validate:"required,len=3"`
	BillingCycle         BillingCycle           `json:"billing_cycle" validate:"required"`
	TrialDays            int                    `json:"trial_days,omitempty"`
	MaxUsers             *int                   `json:"max_users,omitempty"`
	MaxStorage           *int                   `json:"max_storage,omitempty"`
	IncludedFeatures     []string               `json:"included_features,omitempty"`
	IsPopular            bool                   `json:"is_popular,omitempty"`
	SortOrder            int                    `json:"sort_order,omitempty"`
	Metadata             map[string]interface{} `json:"metadata,omitempty"`
	PricingConfiguration map[string]interface{} `json:"pricing_configuration,omitempty"`
}

// UpdatePackageRequest represents request to update a package
type UpdatePackageRequest struct {
	Name                 *string                `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Description          *string                `json:"description,omitempty"`
	Status               *PackageStatus         `json:"status,omitempty"`
	Price                *float64               `json:"price,omitempty" validate:"omitempty,min=0"`
	Currency             *string                `json:"currency,omitempty" validate:"omitempty,len=3"`
	BillingCycle         *BillingCycle          `json:"billing_cycle,omitempty"`
	TrialDays            *int                   `json:"trial_days,omitempty"`
	MaxUsers             *int                   `json:"max_users,omitempty"`
	MaxStorage           *int                   `json:"max_storage,omitempty"`
	IncludedFeatures     []string               `json:"included_features,omitempty"`
	IsPopular            *bool                  `json:"is_popular,omitempty"`
	SortOrder            *int                   `json:"sort_order,omitempty"`
	Metadata             map[string]interface{} `json:"metadata,omitempty"`
	PricingConfiguration map[string]interface{} `json:"pricing_configuration,omitempty"`
}

// PackageFilters represents filters for querying packages
type PackageFilters struct {
	ProductID    *string        `json:"product_id,omitempty"`
	Status       *PackageStatus `json:"status,omitempty"`
	BillingCycle *BillingCycle  `json:"billing_cycle,omitempty"`
	IsPopular    *bool          `json:"is_popular,omitempty"`
	Search       *string        `json:"search,omitempty"`
}
