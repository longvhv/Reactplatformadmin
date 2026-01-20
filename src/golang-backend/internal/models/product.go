package models

// ProductStatus represents product status
type ProductStatus string

const (
	ProductStatusActive      ProductStatus = "ACTIVE"
	ProductStatusInactive    ProductStatus = "INACTIVE"
	ProductStatusDiscontinued ProductStatus = "DISCONTINUED"
)

// ProductType represents product type
type ProductType string

const (
	ProductTypeSubscription ProductType = "SUBSCRIPTION"
	ProductTypeOneTime      ProductType = "ONE_TIME"
	ProductTypeUsageBased   ProductType = "USAGE_BASED"
)

// Product represents a product in the system
type Product struct {
	BaseModel
	ApplicationID string                 `json:"application_id" db:"application_id" validate:"required,uuid"`
	Code          string                 `json:"code" db:"code" validate:"required"`
	Name          string                 `json:"name" db:"name" validate:"required"`
	Description   *string                `json:"description,omitempty" db:"description"`
	Type          ProductType            `json:"type" db:"type" validate:"required"`
	Status        ProductStatus          `json:"status" db:"status" validate:"required"`
	Features      []string               `json:"features,omitempty" db:"features"`
	SortOrder     int                    `json:"sort_order" db:"sort_order"`
	Metadata      map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
}

// CreateProductRequest represents request to create a product
type CreateProductRequest struct {
	ApplicationID string                 `json:"application_id" validate:"required,uuid"`
	Code          string                 `json:"code" validate:"required,min=2,max=50"`
	Name          string                 `json:"name" validate:"required,min=1,max=255"`
	Description   *string                `json:"description,omitempty"`
	Type          ProductType            `json:"type" validate:"required"`
	Status        ProductStatus          `json:"status,omitempty"`
	Features      []string               `json:"features,omitempty"`
	SortOrder     int                    `json:"sort_order,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateProductRequest represents request to update a product
type UpdateProductRequest struct {
	Name        *string                `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Description *string                `json:"description,omitempty"`
	Status      *ProductStatus         `json:"status,omitempty"`
	Features    []string               `json:"features,omitempty"`
	SortOrder   *int                   `json:"sort_order,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// ProductFilters represents filters for querying products
type ProductFilters struct {
	ApplicationID *string        `json:"application_id,omitempty"`
	Type          *ProductType   `json:"type,omitempty"`
	Status        *ProductStatus `json:"status,omitempty"`
	Search        *string        `json:"search,omitempty"`
}
