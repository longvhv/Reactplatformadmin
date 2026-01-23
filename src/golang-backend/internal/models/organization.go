package models

import (
	"github.com/google/uuid"
)

// TenantMember represents a member of a tenant
type TenantMember struct {
	BaseModel
	TenantID       uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	UserID         uuid.UUID  `json:"user_id" db:"user_id"`
	EmployeeCode   *string    `json:"employee_code,omitempty" db:"employee_code"`
	JobTitle       *string    `json:"job_title,omitempty" db:"job_title"`
	Department     *string    `json:"department,omitempty" db:"department"`
	ManagerID      *uuid.UUID `json:"manager_id,omitempty" db:"manager_id"`
	Status         string     `json:"status" db:"status"`
	JoinedAt       *string    `json:"joined_at,omitempty" db:"joined_at"`
	LeftAt         *string    `json:"left_at,omitempty" db:"left_at"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	IsPrimary      bool       `json:"is_primary" db:"is_primary"`
	WorkEmail      *string    `json:"work_email,omitempty" db:"work_email"`
	WorkPhone      *string    `json:"work_phone,omitempty" db:"work_phone"`
	WorkLocation   *string    `json:"work_location,omitempty" db:"work_location"`
	Metadata       *string    `json:"metadata,omitempty" db:"metadata"`
}

// NewTenantMember creates a new TenantMember
func NewTenantMember(tenantID, userID uuid.UUID) *TenantMember {
	return &TenantMember{
		BaseModel: NewBaseModel(),
		TenantID:  tenantID,
		UserID:    userID,
		Status:    "ACTIVE",
		IsActive:  true,
		IsPrimary: false,
	}
}

// Department represents organizational department
type Department struct {
	BaseModel
	TenantID           uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	Code               string     `json:"code" db:"code"`
	Name               string     `json:"name" db:"name"`
	ParentDepartmentID *uuid.UUID `json:"parent_department_id,omitempty" db:"parent_department_id"`
	ManagerID          *uuid.UUID `json:"manager_id,omitempty" db:"manager_id"`
	Description        *string    `json:"description,omitempty" db:"description"`
	Status             string     `json:"status" db:"status"`
	Order              int        `json:"order" db:"order"`
	Metadata           *string    `json:"metadata,omitempty" db:"metadata"`
}

// NewDepartment creates a new Department
func NewDepartment(tenantID uuid.UUID, code, name string) *Department {
	return &Department{
		BaseModel: NewBaseModel(),
		TenantID:  tenantID,
		Code:      code,
		Name:      name,
		Status:    "ACTIVE",
		Order:     0,
	}
}

// UserGroup represents a user group
type UserGroup struct {
	BaseModel
	TenantID    uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Code        string    `json:"code" db:"code"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description,omitempty" db:"description"`
	GroupType   string    `json:"group_type" db:"group_type"`
	Status      string    `json:"status" db:"status"`
	Metadata    *string   `json:"metadata,omitempty" db:"metadata"`
}

// NewUserGroup creates a new UserGroup
func NewUserGroup(tenantID uuid.UUID, code, name string) *UserGroup {
	return &UserGroup{
		BaseModel: NewBaseModel(),
		TenantID:  tenantID,
		Code:      code,
		Name:      name,
		GroupType: "STANDARD",
		Status:    "ACTIVE",
	}
}

// DepartmentMember represents department membership
type DepartmentMember struct {
	BaseModel
	TenantID         uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	DepartmentID     uuid.UUID  `json:"department_id" db:"department_id"`
	TenantMemberID   uuid.UUID  `json:"tenant_member_id" db:"tenant_member_id"`
	IsPrimary        bool       `json:"is_primary" db:"is_primary"`
	RoleInDepartment *string    `json:"role_in_department,omitempty" db:"role_in_department"`
	JoinedAt         *string    `json:"joined_at,omitempty" db:"joined_at"`
	LeftAt           *string    `json:"left_at,omitempty" db:"left_at"`
	Metadata         *string    `json:"metadata,omitempty" db:"metadata"`
}

// GroupMember represents group membership
type GroupMember struct {
	BaseModel
	TenantID       uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	UserGroupID    uuid.UUID  `json:"user_group_id" db:"user_group_id"`
	TenantMemberID uuid.UUID  `json:"tenant_member_id" db:"tenant_member_id"`
	IsPrimary      bool       `json:"is_primary" db:"is_primary"`
	RoleInGroup    *string    `json:"role_in_group,omitempty" db:"role_in_group"`
	JoinedAt       *string    `json:"joined_at,omitempty" db:"joined_at"`
	LeftAt         *string    `json:"left_at,omitempty" db:"left_at"`
	Metadata       *string    `json:"metadata,omitempty" db:"metadata"`
}

// Application represents a SaaS application
type Application struct {
	BaseModel
	Code        string  `json:"code" db:"code"`
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description,omitempty" db:"description"`
	IsActive    bool    `json:"is_active" db:"is_active"`
}

// NewApplication creates a new Application
func NewApplication(code, name string) *Application {
	return &Application{
		BaseModel: NewBaseModel(),
		Code:      code,
		Name:      name,
		IsActive:  true,
	}
}

// Location represents physical or logical location
type Location struct {
	BaseModel
	TenantID       uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	ParentID       *uuid.UUID `json:"parent_id,omitempty" db:"parent_id"`
	TypeID         uuid.UUID  `json:"type_id" db:"type_id"`
	Name           string     `json:"name" db:"name"`
	Code           *string    `json:"code,omitempty" db:"code"`
	Path           *string    `json:"path,omitempty" db:"path"`
	Status         string     `json:"status" db:"status"`
	Address        string     `json:"address" db:"address"`
	Coordinates    *string    `json:"coordinates,omitempty" db:"coordinates"`
	RadiusMeters   int        `json:"radius_meters" db:"radius_meters"`
	Timezone       string     `json:"timezone" db:"timezone"`
	IsHeadquarter  bool       `json:"is_headquarter" db:"is_headquarter"`
	Metadata       *string    `json:"metadata,omitempty" db:"metadata"`
}

// NewLocation creates a new Location
func NewLocation(tenantID, typeID uuid.UUID, name string) *Location {
	return &Location{
		BaseModel:     NewBaseModel(),
		TenantID:      tenantID,
		TypeID:        typeID,
		Name:          name,
		Status:        "ACTIVE",
		RadiusMeters:  100,
		Timezone:      "Asia/Ho_Chi_Minh",
		IsHeadquarter: false,
	}
}

// Webhook represents webhook configuration
type Webhook struct {
	BaseModel
	TenantID      uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Name          string    `json:"name" db:"name"`
	URL           string    `json:"url" db:"url"`
	Secret        string    `json:"-" db:"secret"`
	Events        string    `json:"events" db:"events"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	Description   *string   `json:"description,omitempty" db:"description"`
	Headers       *string   `json:"headers,omitempty" db:"headers"`
	RetryPolicy   *string   `json:"retry_policy,omitempty" db:"retry_policy"`
	Timeout       int       `json:"timeout" db:"timeout"`
	LastTriggered *string   `json:"last_triggered,omitempty" db:"last_triggered"`
	SuccessCount  int       `json:"success_count" db:"success_count"`
	FailureCount  int       `json:"failure_count" db:"failure_count"`
	Metadata      *string   `json:"metadata,omitempty" db:"metadata"`
}

// NewWebhook creates a new Webhook
func NewWebhook(tenantID uuid.UUID, name, url string) *Webhook {
	return &Webhook{
		BaseModel:    NewBaseModel(),
		TenantID:     tenantID,
		Name:         name,
		URL:          url,
		IsActive:     true,
		Timeout:      30,
		SuccessCount: 0,
		FailureCount: 0,
	}
}
