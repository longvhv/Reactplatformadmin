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

// ==================== DEPARTMENTS ====================

// DepartmentStatus represents the status of a department
type DepartmentStatus string

const (
	DepartmentStatusActive   DepartmentStatus = "ACTIVE"
	DepartmentStatusInactive DepartmentStatus = "INACTIVE"
	DepartmentStatusArchived DepartmentStatus = "ARCHIVED"
)

// IsValid validates department status
func (s DepartmentStatus) IsValid() bool {
	switch s {
	case DepartmentStatusActive, DepartmentStatusInactive, DepartmentStatusArchived:
		return true
	}
	return false
}

// Department represents an organizational department
// Table: departments
type Department struct {
	// Identity & Relationships (2)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID uuid.UUID `gorm:"column:tenant_id;type:uuid;not null;index:idx_departments_tenant" json:"tenant_id"`

	// Department Information (5)
	Code               string     `gorm:"column:code;type:varchar(50);not null;uniqueIndex:idx_departments_tenant_code" json:"code"`
	Name               string     `gorm:"column:name;type:varchar(255);not null" json:"name"`
	ParentDepartmentID *uuid.UUID `gorm:"column:parent_department_id;type:uuid;index:idx_departments_parent" json:"parent_department_id"`
	ManagerID          *uuid.UUID `gorm:"column:manager_id;type:uuid;index:idx_departments_manager" json:"manager_id"`
	Description        *string    `gorm:"column:description;type:text" json:"description"`

	// Status & Configuration (3)
	Status   DepartmentStatus `gorm:"column:status;type:varchar(20);not null;default:'ACTIVE'" json:"status"`
	Order    int              `gorm:"column:order;type:int;not null;default:0" json:"order"`
	Metadata JSONB            `gorm:"column:metadata;type:jsonb;not null;default:'{}'" json:"metadata"`

	// Audit Fields (4)
	CreatedAt time.Time  `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by"`

	// Soft Delete (2)
	DeletedAt *time.Time `gorm:"column:deleted_at;type:timestamptz;index:idx_departments_deleted" json:"deleted_at"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by"`

	// Versioning (1)
	Version int64 `gorm:"column:version;type:bigint;not null;default:1" json:"version"`

	// Relationships
	Tenant           *Tenant      `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
	ParentDepartment *Department  `gorm:"foreignKey:ParentDepartmentID;references:ID" json:"parent_department,omitempty"`
	ChildDepartments []Department `gorm:"foreignKey:ParentDepartmentID;references:ID" json:"child_departments,omitempty"`
}

// TableName specifies the table name for GORM
func (Department) TableName() string {
	return "departments"
}

// BeforeCreate hook
func (d *Department) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}

	// Set defaults
	if d.Status == "" {
		d.Status = DepartmentStatusActive
	}
	if d.Metadata == nil {
		d.Metadata = make(map[string]interface{})
	}

	return d.Validate()
}

// BeforeUpdate hook
func (d *Department) BeforeUpdate(tx *gorm.DB) error {
	d.UpdatedAt = time.Now()
	d.Version++
	return d.Validate()
}

// Validate validates the department
func (d *Department) Validate() error {
	if d.Code == "" {
		return errors.New("code is required")
	}
	if d.Name == "" {
		return errors.New("name is required")
	}

	if !d.Status.IsValid() {
		return errors.New("invalid status")
	}

	// Prevent self-reference
	if d.ParentDepartmentID != nil && *d.ParentDepartmentID == d.ID {
		return errors.New("department cannot be its own parent")
	}

	return nil
}

// IsActive checks if department is active
func (d *Department) IsActive() bool {
	return d.Status == DepartmentStatusActive && d.DeletedAt == nil
}

// IsRoot checks if department is a root department (no parent)
func (d *Department) IsRoot() bool {
	return d.ParentDepartmentID == nil
}

// HasManager checks if department has a manager assigned
func (d *Department) HasManager() bool {
	return d.ManagerID != nil
}

// SoftDelete performs soft delete
func (d *Department) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	d.DeletedAt = &now
	d.DeletedBy = &deletedBy
}

// Restore restores a soft-deleted department
func (d *Department) Restore() {
	d.DeletedAt = nil
	d.DeletedBy = nil
}

// CreateDepartmentRequest represents the request to create a department
type CreateDepartmentRequest struct {
	TenantID           uuid.UUID         `json:"tenant_id" binding:"required"`
	Code               string            `json:"code" binding:"required"`
	Name               string            `json:"name" binding:"required"`
	ParentDepartmentID *uuid.UUID        `json:"parent_department_id,omitempty"`
	ManagerID          *uuid.UUID        `json:"manager_id,omitempty"`
	Description        *string           `json:"description,omitempty"`
	Status             *DepartmentStatus `json:"status,omitempty"`
	Order              int               `json:"order,omitempty"`
	Metadata           JSONB             `json:"metadata,omitempty"`
	CreatedBy          *uuid.UUID        `json:"created_by,omitempty"`
}

// UpdateDepartmentRequest represents the request to update a department
type UpdateDepartmentRequest struct {
	Code               *string           `json:"code,omitempty"`
	Name               *string           `json:"name,omitempty"`
	ParentDepartmentID *uuid.UUID        `json:"parent_department_id,omitempty"`
	ManagerID          *uuid.UUID        `json:"manager_id,omitempty"`
	Description        *string           `json:"description,omitempty"`
	Status             *DepartmentStatus `json:"status,omitempty"`
	Order              *int              `json:"order,omitempty"`
	Metadata           JSONB             `json:"metadata,omitempty"`
	UpdatedBy          *uuid.UUID        `json:"updated_by,omitempty"`
	Version            int64             `json:"version" binding:"required"`
}

// DepartmentResponse represents the API response
type DepartmentResponse struct {
	ID                 uuid.UUID        `json:"_id"`
	TenantID           uuid.UUID        `json:"tenant_id"`
	Code               string           `json:"code"`
	Name               string           `json:"name"`
	ParentDepartmentID *uuid.UUID       `json:"parent_department_id"`
	ManagerID          *uuid.UUID       `json:"manager_id"`
	Description        *string          `json:"description"`
	Status             DepartmentStatus `json:"status"`
	Order              int              `json:"order"`
	Metadata           JSONB            `json:"metadata"`
	CreatedAt          time.Time        `json:"created_at"`
	UpdatedAt          time.Time        `json:"updated_at"`
	CreatedBy          *uuid.UUID       `json:"created_by"`
	UpdatedBy          *uuid.UUID       `json:"updated_by"`
	DeletedAt          *time.Time       `json:"deleted_at"`
	DeletedBy          *uuid.UUID       `json:"deleted_by"`
	Version            int64            `json:"version"`
}

// ToResponse converts to response
func (d *Department) ToResponse() *DepartmentResponse {
	return &DepartmentResponse{
		ID:                 d.ID,
		TenantID:           d.TenantID,
		Code:               d.Code,
		Name:               d.Name,
		ParentDepartmentID: d.ParentDepartmentID,
		ManagerID:          d.ManagerID,
		Description:        d.Description,
		Status:             d.Status,
		Order:              d.Order,
		Metadata:           d.Metadata,
		CreatedAt:          d.CreatedAt,
		UpdatedAt:          d.UpdatedAt,
		CreatedBy:          d.CreatedBy,
		UpdatedBy:          d.UpdatedBy,
		DeletedAt:          d.DeletedAt,
		DeletedBy:          d.DeletedBy,
		Version:            d.Version,
	}
}

// DepartmentTreeNode represents a department in a tree structure
type DepartmentTreeNode struct {
	DepartmentResponse
	Children []DepartmentTreeNode `json:"children,omitempty"`
	Depth    int                  `json:"depth,omitempty"`
	IsLeaf   bool                 `json:"is_leaf,omitempty"`
}

// Query Scopes
func ScopeDepartmentsByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeActiveDepartments(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", DepartmentStatusActive)
}

func ScopeNotDeletedDepartments(db *gorm.DB) *gorm.DB {
	return db.Where("deleted_at IS NULL")
}

func ScopeRootDepartments(db *gorm.DB) *gorm.DB {
	return db.Where("parent_department_id IS NULL")
}

func ScopeChildrenOfDepartment(parentID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("parent_department_id = ?", parentID)
	}
}

// ==================== USER GROUPS ====================

// UserGroupStatus represents the status of a user group
type UserGroupStatus string

const (
	UserGroupStatusActive   UserGroupStatus = "ACTIVE"
	UserGroupStatusInactive UserGroupStatus = "INACTIVE"
	UserGroupStatusArchived UserGroupStatus = "ARCHIVED"
)

// IsValid validates user group status
func (s UserGroupStatus) IsValid() bool {
	switch s {
	case UserGroupStatusActive, UserGroupStatusInactive, UserGroupStatusArchived:
		return true
	}
	return false
}

// UserGroup represents a user group for access control
// Table: user_groups
type UserGroup struct {
	// Identity & Relationships (2)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID uuid.UUID `gorm:"column:tenant_id;type:uuid;not null;index:idx_user_groups_tenant" json:"tenant_id"`

	// Group Information (4)
	Code        string  `gorm:"column:code;type:varchar(50);not null;uniqueIndex:idx_user_groups_tenant_code" json:"code"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description"`
	GroupType   *string `gorm:"column:group_type;type:varchar(50)" json:"group_type"` // Flexible type, no enum

	// Status & Configuration (3)
	Status   UserGroupStatus `gorm:"column:status;type:varchar(20);not null;default:'ACTIVE'" json:"status"`
	Order    int             `gorm:"column:order;type:int;not null;default:0" json:"order"`
	Metadata JSONB           `gorm:"column:metadata;type:jsonb;not null;default:'{}'" json:"metadata"`

	// Audit Fields (4)
	CreatedAt time.Time  `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by"`

	// Soft Delete (2)
	DeletedAt *time.Time `gorm:"column:deleted_at;type:timestamptz;index:idx_user_groups_deleted" json:"deleted_at"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by"`

	// Versioning (1)
	Version int64 `gorm:"column:version;type:bigint;not null;default:1" json:"version"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (UserGroup) TableName() string {
	return "user_groups"
}

// BeforeCreate hook
func (ug *UserGroup) BeforeCreate(tx *gorm.DB) error {
	if ug.ID == uuid.Nil {
		ug.ID = uuid.New()
	}

	// Set defaults
	if ug.Status == "" {
		ug.Status = UserGroupStatusActive
	}
	if ug.Metadata == nil {
		ug.Metadata = make(map[string]interface{})
	}

	return ug.Validate()
}

// BeforeUpdate hook
func (ug *UserGroup) BeforeUpdate(tx *gorm.DB) error {
	ug.UpdatedAt = time.Now()
	ug.Version++
	return ug.Validate()
}

// Validate validates the user group
func (ug *UserGroup) Validate() error {
	if ug.Code == "" {
		return errors.New("code is required")
	}
	if ug.Name == "" {
		return errors.New("name is required")
	}

	if !ug.Status.IsValid() {
		return errors.New("invalid status")
	}

	return nil
}

// IsActive checks if user group is active
func (ug *UserGroup) IsActive() bool {
	return ug.Status == UserGroupStatusActive && ug.DeletedAt == nil
}

// SoftDelete performs soft delete
func (ug *UserGroup) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	ug.DeletedAt = &now
	ug.DeletedBy = &deletedBy
}

// Restore restores a soft-deleted user group
func (ug *UserGroup) Restore() {
	ug.DeletedAt = nil
	ug.DeletedBy = nil
}

// CreateUserGroupRequest represents the request to create a user group
type CreateUserGroupRequest struct {
	TenantID    uuid.UUID        `json:"tenant_id" binding:"required"`
	Code        string           `json:"code" binding:"required"`
	Name        string           `json:"name" binding:"required"`
	Description *string          `json:"description,omitempty"`
	GroupType   *string          `json:"group_type,omitempty"`
	Status      *UserGroupStatus `json:"status,omitempty"`
	Order       int              `json:"order,omitempty"`
	Metadata    JSONB            `json:"metadata,omitempty"`
	CreatedBy   *uuid.UUID       `json:"created_by,omitempty"`
}

// UpdateUserGroupRequest represents the request to update a user group
type UpdateUserGroupRequest struct {
	Code        *string          `json:"code,omitempty"`
	Name        *string          `json:"name,omitempty"`
	Description *string          `json:"description,omitempty"`
	GroupType   *string          `json:"group_type,omitempty"`
	Status      *UserGroupStatus `json:"status,omitempty"`
	Order       *int             `json:"order,omitempty"`
	Metadata    JSONB            `json:"metadata,omitempty"`
	UpdatedBy   *uuid.UUID       `json:"updated_by,omitempty"`
	Version     int64            `json:"version" binding:"required"`
}

// UserGroupResponse represents the API response
type UserGroupResponse struct {
	ID          uuid.UUID       `json:"_id"`
	TenantID    uuid.UUID       `json:"tenant_id"`
	Code        string          `json:"code"`
	Name        string          `json:"name"`
	Description *string         `json:"description"`
	GroupType   *string         `json:"group_type"`
	Status      UserGroupStatus `json:"status"`
	Order       int             `json:"order"`
	Metadata    JSONB           `json:"metadata"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	CreatedBy   *uuid.UUID      `json:"created_by"`
	UpdatedBy   *uuid.UUID      `json:"updated_by"`
	DeletedAt   *time.Time      `json:"deleted_at"`
	DeletedBy   *uuid.UUID      `json:"deleted_by"`
	Version     int64           `json:"version"`
}

// ToResponse converts to response
func (ug *UserGroup) ToResponse() *UserGroupResponse {
	return &UserGroupResponse{
		ID:          ug.ID,
		TenantID:    ug.TenantID,
		Code:        ug.Code,
		Name:        ug.Name,
		Description: ug.Description,
		GroupType:   ug.GroupType,
		Status:      ug.Status,
		Order:       ug.Order,
		Metadata:    ug.Metadata,
		CreatedAt:   ug.CreatedAt,
		UpdatedAt:   ug.UpdatedAt,
		CreatedBy:   ug.CreatedBy,
		UpdatedBy:   ug.UpdatedBy,
		DeletedAt:   ug.DeletedAt,
		DeletedBy:   ug.DeletedBy,
		Version:     ug.Version,
	}
}

// UserGroupWithMembers represents a user group with computed member count
type UserGroupWithMembers struct {
	UserGroupResponse
	MemberCount     int  `json:"member_count"`
	RoleCount       int  `json:"role_count"`
	PermissionCount int  `json:"permission_count"`
	IsSystem        bool `json:"is_system"`
}

// Query Scopes
func ScopeUserGroupsByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeActiveUserGroups(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", UserGroupStatusActive)
}

func ScopeNotDeletedUserGroups(db *gorm.DB) *gorm.DB {
	return db.Where("deleted_at IS NULL")
}

func ScopeUserGroupsByType(groupType string) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("group_type = ?", groupType)
	}
}

// ==================== LOCATIONS ====================

// LocationStatus represents the status of a location
type LocationStatus string

const (
	LocationStatusActive   LocationStatus = "ACTIVE"
	LocationStatusInactive LocationStatus = "INACTIVE"
	LocationStatusClosed   LocationStatus = "CLOSED"
)

// IsValid validates location status
func (s LocationStatus) IsValid() bool {
	switch s {
	case LocationStatusActive, LocationStatusInactive, LocationStatusClosed:
		return true
	}
	return false
}

// LocationAddress represents the address structure (stored in JSONB)
type LocationAddress struct {
	Line1      string `json:"line1,omitempty"`
	Line2      string `json:"line2,omitempty"`
	City       string `json:"city,omitempty"`
	State      string `json:"state,omitempty"`
	PostalCode string `json:"postal_code,omitempty"`
	Country    string `json:"country,omitempty"`
}

// Value implements driver.Valuer
func (a LocationAddress) Value() (driver.Value, error) {
	return json.Marshal(a)
}

// Scan implements sql.Scanner
func (a *LocationAddress) Scan(value interface{}) error {
	if value == nil {
		*a = LocationAddress{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal LocationAddress value")
	}

	return json.Unmarshal(bytes, a)
}

// LocationCoordinates represents geographic coordinates (stored as POINT in PostgreSQL)
type LocationCoordinates struct {
	Longitude float64 `json:"longitude"`
	Latitude  float64 `json:"latitude"`
}

// Value implements driver.Valuer for PostgreSQL POINT type
func (c LocationCoordinates) Value() (driver.Value, error) {
	// PostgreSQL POINT format: (longitude, latitude)
	return fmt.Sprintf("(%f,%f)", c.Longitude, c.Latitude), nil
}

// Scan implements sql.Scanner for PostgreSQL POINT type
func (c *LocationCoordinates) Scan(value interface{}) error {
	if value == nil {
		*c = LocationCoordinates{}
		return nil
	}

	var str string
	switch v := value.(type) {
	case []byte:
		str = string(v)
	case string:
		str = v
	default:
		return errors.New("failed to scan LocationCoordinates")
	}

	// Parse PostgreSQL POINT format: (longitude,latitude)
	str = strings.Trim(str, "()")
	parts := strings.Split(str, ",")
	if len(parts) != 2 {
		return errors.New("invalid POINT format")
	}

	_, err := fmt.Sscanf(parts[0], "%f", &c.Longitude)
	if err != nil {
		return err
	}
	_, err = fmt.Sscanf(parts[1], "%f", &c.Latitude)
	if err != nil {
		return err
	}

	return nil
}

// Location represents a physical location
// Table: locations
type Location struct {
	// Identity & Structure (4)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID uuid.UUID  `gorm:"column:tenant_id;type:uuid;not null;index:idx_locations_tenant" json:"tenant_id"`
	ParentID *uuid.UUID `gorm:"column:parent_id;type:uuid;index:idx_locations_parent" json:"parent_id"`
	TypeID   uuid.UUID  `gorm:"column:type_id;type:uuid;not null" json:"type_id"` // FK to location_types

	// Basic Info (4)
	Name   string          `gorm:"column:name;type:text;not null" json:"name"`
	Code   *string         `gorm:"column:code;type:varchar(50);uniqueIndex:idx_locations_tenant_code" json:"code"`
	Path   *string         `gorm:"column:path;type:text" json:"path"` // Materialized path: /root_id/parent_id/this_id/
	Status LocationStatus  `gorm:"column:status;type:varchar(20);not null;default:'ACTIVE'" json:"status"`

	// Geography & Timekeeping (5)
	Address        LocationAddress      `gorm:"column:address;type:jsonb;not null;default:'{}'" json:"address"`
	Coordinates    *LocationCoordinates `gorm:"column:coordinates;type:point" json:"coordinates"`
	RadiusMeters   int                  `gorm:"column:radius_meters;type:int;not null;default:100" json:"radius_meters"`
	Timezone       string               `gorm:"column:timezone;type:varchar(50);not null;default:'UTC'" json:"timezone"`
	IsHeadquarter  bool                 `gorm:"column:is_headquarter;type:boolean;not null;default:false" json:"is_headquarter"`

	// Dynamic Data (1)
	Metadata JSONB `gorm:"column:metadata;type:jsonb;not null;default:'{}'" json:"metadata"`

	// Audit (5)
	CreatedAt time.Time  `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at;type:timestamptz;index:idx_locations_deleted" json:"deleted_at"`
	Version   int64      `gorm:"column:version;type:bigint;not null;default:1" json:"version"`

	// Relationships
	Tenant         *Tenant    `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
	ParentLocation *Location  `gorm:"foreignKey:ParentID;references:ID" json:"parent_location,omitempty"`
	ChildLocations []Location `gorm:"foreignKey:ParentID;references:ID" json:"child_locations,omitempty"`
}

// TableName specifies the table name for GORM
func (Location) TableName() string {
	return "locations"
}

// BeforeCreate hook
func (l *Location) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}

	// Set defaults
	if l.Status == "" {
		l.Status = LocationStatusActive
	}
	if l.Timezone == "" {
		l.Timezone = "UTC"
	}
	if l.RadiusMeters == 0 {
		l.RadiusMeters = 100
	}
	if l.Metadata == nil {
		l.Metadata = make(map[string]interface{})
	}

	// Generate materialized path
	if l.ParentID != nil {
		var parent Location
		if err := tx.First(&parent, l.ParentID).Error; err == nil {
			if parent.Path != nil {
				path := *parent.Path + l.ID.String() + "/"
				l.Path = &path
			} else {
				path := "/" + *l.ParentID + "/" + l.ID.String() + "/"
				l.Path = &path
			}
		}
	} else {
		path := "/" + l.ID.String() + "/"
		l.Path = &path
	}

	return l.Validate()
}

// BeforeUpdate hook
func (l *Location) BeforeUpdate(tx *gorm.DB) error {
	l.UpdatedAt = time.Now()
	l.Version++
	return l.Validate()
}

// Validate validates the location
func (l *Location) Validate() error {
	if l.Name == "" {
		return errors.New("name is required")
	}

	if !l.Status.IsValid() {
		return errors.New("invalid status")
	}

	// Prevent self-reference
	if l.ParentID != nil && *l.ParentID == l.ID {
		return errors.New("location cannot be its own parent")
	}

	if l.RadiusMeters < 0 {
		return errors.New("radius_meters must be non-negative")
	}

	return nil
}

// IsActive checks if location is active
func (l *Location) IsActive() bool {
	return l.Status == LocationStatusActive && l.DeletedAt == nil
}

// IsRoot checks if location is a root location (no parent)
func (l *Location) IsRoot() bool {
	return l.ParentID == nil
}

// HasCoordinates checks if location has coordinates
func (l *Location) HasCoordinates() bool {
	return l.Coordinates != nil
}

// GetDepth returns the depth in hierarchy based on path
func (l *Location) GetDepth() int {
	if l.Path == nil {
		return 0
	}
	return strings.Count(*l.Path, "/") - 2 // Subtract leading and trailing /
}

// SoftDelete performs soft delete
func (l *Location) SoftDelete() {
	now := time.Now()
	l.DeletedAt = &now
}

// Restore restores a soft-deleted location
func (l *Location) Restore() {
	l.DeletedAt = nil
}

// CreateLocationRequest represents the request to create a location
type CreateLocationRequest struct {
	TenantID      uuid.UUID            `json:"tenant_id" binding:"required"`
	ParentID      *uuid.UUID           `json:"parent_id,omitempty"`
	TypeID        uuid.UUID            `json:"type_id" binding:"required"`
	Name          string               `json:"name" binding:"required"`
	Code          *string              `json:"code,omitempty"`
	Status        *LocationStatus      `json:"status,omitempty"`
	Address       LocationAddress      `json:"address,omitempty"`
	Coordinates   *LocationCoordinates `json:"coordinates,omitempty"`
	RadiusMeters  int                  `json:"radius_meters,omitempty"`
	Timezone      string               `json:"timezone,omitempty"`
	IsHeadquarter bool                 `json:"is_headquarter,omitempty"`
	Metadata      JSONB                `json:"metadata,omitempty"`
}

// UpdateLocationRequest represents the request to update a location
type UpdateLocationRequest struct {
	ParentID      *uuid.UUID           `json:"parent_id,omitempty"`
	TypeID        *uuid.UUID           `json:"type_id,omitempty"`
	Name          *string              `json:"name,omitempty"`
	Code          *string              `json:"code,omitempty"`
	Status        *LocationStatus      `json:"status,omitempty"`
	Address       *LocationAddress     `json:"address,omitempty"`
	Coordinates   *LocationCoordinates `json:"coordinates,omitempty"`
	RadiusMeters  *int                 `json:"radius_meters,omitempty"`
	Timezone      *string              `json:"timezone,omitempty"`
	IsHeadquarter *bool                `json:"is_headquarter,omitempty"`
	Metadata      JSONB                `json:"metadata,omitempty"`
	Version       int64                `json:"version" binding:"required"`
}

// LocationResponse represents the API response
type LocationResponse struct {
	ID            uuid.UUID            `json:"_id"`
	TenantID      uuid.UUID            `json:"tenant_id"`
	ParentID      *uuid.UUID           `json:"parent_id"`
	TypeID        uuid.UUID            `json:"type_id"`
	Name          string               `json:"name"`
	Code          *string              `json:"code"`
	Path          *string              `json:"path"`
	Status        LocationStatus       `json:"status"`
	Address       LocationAddress      `json:"address"`
	Coordinates   *LocationCoordinates `json:"coordinates"`
	RadiusMeters  int                  `json:"radius_meters"`
	Timezone      string               `json:"timezone"`
	IsHeadquarter bool                 `json:"is_headquarter"`
	Metadata      JSONB                `json:"metadata"`
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
	DeletedAt     *time.Time           `json:"deleted_at"`
	Version       int64                `json:"version"`
}

// ToResponse converts to response
func (l *Location) ToResponse() *LocationResponse {
	return &LocationResponse{
		ID:            l.ID,
		TenantID:      l.TenantID,
		ParentID:      l.ParentID,
		TypeID:        l.TypeID,
		Name:          l.Name,
		Code:          l.Code,
		Path:          l.Path,
		Status:        l.Status,
		Address:       l.Address,
		Coordinates:   l.Coordinates,
		RadiusMeters:  l.RadiusMeters,
		Timezone:      l.Timezone,
		IsHeadquarter: l.IsHeadquarter,
		Metadata:      l.Metadata,
		CreatedAt:     l.CreatedAt,
		UpdatedAt:     l.UpdatedAt,
		DeletedAt:     l.DeletedAt,
		Version:       l.Version,
	}
}

// LocationTreeNode represents a location in a tree structure
type LocationTreeNode struct {
	LocationResponse
	Children []LocationTreeNode `json:"children,omitempty"`
	Depth    int                `json:"depth,omitempty"`
	IsLeaf   bool               `json:"is_leaf,omitempty"`
}

// Query Scopes
func ScopeLocationsByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeActiveLocations(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", LocationStatusActive)
}

func ScopeNotDeletedLocations(db *gorm.DB) *gorm.DB {
	return db.Where("deleted_at IS NULL")
}

func ScopeRootLocations(db *gorm.DB) *gorm.DB {
	return db.Where("parent_id IS NULL")
}

func ScopeChildrenOfLocation(parentID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("parent_id = ?", parentID)
	}
}

func ScopeHeadquarters(db *gorm.DB) *gorm.DB {
	return db.Where("is_headquarter = ?", true)
}

func ScopeLocationsByType(typeID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("type_id = ?", typeID)
	}
}

// DistanceFrom calculates distance from another location in meters
// Using Haversine formula
func (l *Location) DistanceFrom(other *Location) float64 {
	if l.Coordinates == nil || other.Coordinates == nil {
		return 0
	}

	const earthRadius = 6371000 // meters

	lat1 := l.Coordinates.Latitude * 3.14159265359 / 180
	lat2 := other.Coordinates.Latitude * 3.14159265359 / 180
	deltaLat := (other.Coordinates.Latitude - l.Coordinates.Latitude) * 3.14159265359 / 180
	deltaLon := (other.Coordinates.Longitude - l.Coordinates.Longitude) * 3.14159265359 / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// IsWithinRadius checks if a coordinate is within the location's radius
func (l *Location) IsWithinRadius(coords LocationCoordinates) bool {
	if l.Coordinates == nil {
		return false
	}

	tempLoc := &Location{Coordinates: &coords}
	distance := l.DistanceFrom(tempLoc)
	return distance <= float64(l.RadiusMeters)
}

import "math"
