package models

// TenantTier represents tenant tier/plan
type TenantTier string

const (
	TenantTierFree       TenantTier = "FREE"
	TenantTierPro        TenantTier = "PRO"
	TenantTierEnterprise TenantTier = "ENTERPRISE"
)

// TenantStatus represents tenant status
type TenantStatus string

const (
	TenantStatusTrial     TenantStatus = "TRIAL"
	TenantStatusActive    TenantStatus = "ACTIVE"
	TenantStatusSuspended TenantStatus = "SUSPENDED"
	TenantStatusCancelled TenantStatus = "CANCELLED"
)

// Tenant represents a tenant/organization in the system
type Tenant struct {
	BaseModel
	Code             string                 `json:"code" db:"code" validate:"required"`
	Name             string                 `json:"name" db:"name" validate:"required"`
	ParentTenantID   *string                `json:"parent_tenant_id,omitempty" db:"parent_tenant_id"`
	Path             *string                `json:"path,omitempty" db:"path"`
	Tier             TenantTier             `json:"tier" db:"tier" validate:"required"`
	Status           TenantStatus           `json:"status" db:"status" validate:"required"`
	DataRegion       string                 `json:"data_region" db:"data_region"`
	ComplianceLevel  string                 `json:"compliance_level" db:"compliance_level"`
	Timezone         string                 `json:"timezone" db:"timezone"`
	BillingType      string                 `json:"billing_type" db:"billing_type"`
	Profile          map[string]interface{} `json:"profile,omitempty" db:"profile"`
	Settings         map[string]interface{} `json:"settings,omitempty" db:"settings"`
	CreatedBy        *string                `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy        *string                `json:"updated_by,omitempty" db:"updated_by"`
	DeletedBy        *string                `json:"deleted_by,omitempty" db:"deleted_by"`
	PartnerTenantID  *string                `json:"partner_tenant_id,omitempty" db:"partner_tenant_id"`
}

// CreateTenantRequest represents request to create a tenant
type CreateTenantRequest struct {
	Code            string                 `json:"code" validate:"required,min=2,max=50"`
	Name            string                 `json:"name" validate:"required,min=1,max=255"`
	ParentTenantID  *string                `json:"parent_tenant_id,omitempty" validate:"omitempty,uuid"`
	Tier            TenantTier             `json:"tier,omitempty"`
	Status          TenantStatus           `json:"status,omitempty"`
	DataRegion      string                 `json:"data_region,omitempty"`
	ComplianceLevel string                 `json:"compliance_level,omitempty"`
	Timezone        string                 `json:"timezone,omitempty"`
	BillingType     string                 `json:"billing_type,omitempty"`
	Profile         map[string]interface{} `json:"profile,omitempty"`
	Settings        map[string]interface{} `json:"settings,omitempty"`
	PartnerTenantID *string                `json:"partner_tenant_id,omitempty" validate:"omitempty,uuid"`
}

// UpdateTenantRequest represents request to update a tenant
type UpdateTenantRequest struct {
	Name            *string                `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Tier            *TenantTier            `json:"tier,omitempty"`
	Status          *TenantStatus          `json:"status,omitempty"`
	ComplianceLevel *string                `json:"compliance_level,omitempty"`
	Timezone        *string                `json:"timezone,omitempty"`
	BillingType     *string                `json:"billing_type,omitempty"`
	Profile         map[string]interface{} `json:"profile,omitempty"`
	Settings        map[string]interface{} `json:"settings,omitempty"`
}

// TenantFilters represents filters for querying tenants
type TenantFilters struct {
	Tier           *TenantTier   `json:"tier,omitempty"`
	Status         *TenantStatus `json:"status,omitempty"`
	ParentTenantID *string       `json:"parent_tenant_id,omitempty"`
	DataRegion     *string       `json:"data_region,omitempty"`
	Search         *string       `json:"search,omitempty"`
}
