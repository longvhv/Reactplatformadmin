package models

// ApplicationStatus represents application status
type ApplicationStatus string

const (
	ApplicationStatusActive      ApplicationStatus = "ACTIVE"
	ApplicationStatusInactive    ApplicationStatus = "INACTIVE"
	ApplicationStatusMaintenance ApplicationStatus = "MAINTENANCE"
	ApplicationStatusDeprecated  ApplicationStatus = "DEPRECATED"
)

// Application represents an application in the system
type Application struct {
	BaseModel
	Code           string                 `json:"code" db:"code" validate:"required"`
	Name           string                 `json:"name" db:"name" validate:"required"`
	Description    *string                `json:"description,omitempty" db:"description"`
	Status         ApplicationStatus      `json:"status" db:"status" validate:"required"`
	IconURL        *string                `json:"icon_url,omitempty" db:"icon_url"`
	BaseURL        *string                `json:"base_url,omitempty" db:"base_url"`
	OwnerTenantID  *string                `json:"owner_tenant_id,omitempty" db:"owner_tenant_id"`
	IsPublic       bool                   `json:"is_public" db:"is_public"`
	SortOrder      int                    `json:"sort_order" db:"sort_order"`
	Metadata       map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	Configuration  map[string]interface{} `json:"configuration,omitempty" db:"configuration"`
}

// CreateApplicationRequest represents request to create an application
type CreateApplicationRequest struct {
	Code          string                 `json:"code" validate:"required,min=2,max=50"`
	Name          string                 `json:"name" validate:"required,min=1,max=255"`
	Description   *string                `json:"description,omitempty"`
	Status        ApplicationStatus      `json:"status,omitempty"`
	IconURL       *string                `json:"icon_url,omitempty"`
	BaseURL       *string                `json:"base_url,omitempty"`
	OwnerTenantID *string                `json:"owner_tenant_id,omitempty" validate:"omitempty,uuid"`
	IsPublic      bool                   `json:"is_public,omitempty"`
	SortOrder     int                    `json:"sort_order,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	Configuration map[string]interface{} `json:"configuration,omitempty"`
}

// UpdateApplicationRequest represents request to update an application
type UpdateApplicationRequest struct {
	Name          *string                `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Description   *string                `json:"description,omitempty"`
	Status        *ApplicationStatus     `json:"status,omitempty"`
	IconURL       *string                `json:"icon_url,omitempty"`
	BaseURL       *string                `json:"base_url,omitempty"`
	IsPublic      *bool                  `json:"is_public,omitempty"`
	SortOrder     *int                   `json:"sort_order,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	Configuration map[string]interface{} `json:"configuration,omitempty"`
}

// ApplicationFilters represents filters for querying applications
type ApplicationFilters struct {
	Status        *ApplicationStatus `json:"status,omitempty"`
	OwnerTenantID *string            `json:"owner_tenant_id,omitempty"`
	IsPublic      *bool              `json:"is_public,omitempty"`
	Search        *string            `json:"search,omitempty"`
}
