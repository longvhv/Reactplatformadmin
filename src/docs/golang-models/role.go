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
// ROLE - Role-Based Access Control (RBAC)
// ============================================================================
// Purpose: Manage roles and permissions
// Table: roles
// Primary Key: _id (UUID)
// Features: RBAC, Hierarchy, Dynamic permissions, Scoped roles
// ============================================================================

type RoleType string

const (
	RoleTypeSystem      RoleType = "SYSTEM"      // Built-in roles
	RoleTypeCustom      RoleType = "CUSTOM"      // User-defined
	RoleTypeDepartment  RoleType = "DEPARTMENT"  // Department-specific
	RoleTypeProject     RoleType = "PROJECT"     // Project-specific
	RoleTypeTemporary   RoleType = "TEMPORARY"   // Time-limited
)

type RoleStatus string

const (
	RoleStatusActive     RoleStatus = "ACTIVE"
	RoleStatusInactive   RoleStatus = "INACTIVE"
	RoleStatusDeprecated RoleStatus = "DEPRECATED"
	RoleStatusArchived   RoleStatus = "ARCHIVED"
)

type RoleScope string

const (
	RoleScopeGlobal       RoleScope = "GLOBAL"       // System-wide
	RoleScopeTenant       RoleScope = "TENANT"       // Tenant-specific
	RoleScopeDepartment   RoleScope = "DEPARTMENT"   // Department-specific
	RoleScopeProject      RoleScope = "PROJECT"      // Project-specific
	RoleScopeResource     RoleScope = "RESOURCE"     // Resource-specific
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
// Role Model (30 fields)
// ============================================================================

type Role struct {
	// ========== Identity (4 fields) ==========
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	ParentID   *uuid.UUID `gorm:"column:parent_id;type:uuid;index" json:"parent_id,omitempty"` // For hierarchy
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`

	// ========== Role Info (9 fields) ==========
	Code        string     `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string     `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string    `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        RoleType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status      RoleStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Scope       RoleScope  `gorm:"column:scope;type:varchar(20);not null;index" json:"scope"`
	Priority    int        `gorm:"column:priority;default:0" json:"priority"` // Higher = more important
	IsSystem    bool       `gorm:"column:is_system;default:false" json:"is_system"`
	IsDefault   bool       `gorm:"column:is_default;default:false" json:"is_default"`

	// ========== Permissions (2 fields) ==========
	PermissionCount int   `gorm:"column:permission_count;default:0" json:"permission_count"`
	Permissions     JSONB `gorm:"column:permissions;type:jsonb" json:"permissions,omitempty"` // Quick lookup cache

	// ========== Scope Context (3 fields) ==========
	ScopeID       *uuid.UUID `gorm:"column:scope_id;type:uuid" json:"scope_id,omitempty"` // Department/Project ID
	ScopeType     *string    `gorm:"column:scope_type;type:varchar(50)" json:"scope_type,omitempty"`
	ScopeMetadata JSONB      `gorm:"column:scope_metadata;type:jsonb" json:"scope_metadata,omitempty"`

	// ========== Constraints (3 fields) ==========
	MaxAssignments *int       `gorm:"column:max_assignments" json:"max_assignments,omitempty"` // Max users
	ExpiresAt      *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"` // For temporary roles
	Conditions     JSONB      `gorm:"column:conditions;type:jsonb" json:"conditions,omitempty"` // Assignment conditions

	// ========== Statistics (3 fields) ==========
	AssignmentCount int64      `gorm:"column:assignment_count;default:0" json:"assignment_count"`
	ActiveUsers     int64      `gorm:"column:active_users;default:0" json:"active_users"`
	LastAssignedAt  *time.Time `gorm:"column:last_assigned_at" json:"last_assigned_at,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete (2 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Parent       *Role               `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Category     *RoleCategory       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	RolePermissions []RolePermission `gorm:"foreignKey:RoleID" json:"role_permissions,omitempty"`
	Assignments  []RoleAssignment    `gorm:"foreignKey:RoleID" json:"assignments,omitempty"`
}

func (Role) TableName() string {
	return "roles"
}

// Helper Methods
func (r *Role) IsActive() bool {
	return r.Status == RoleStatusActive
}

func (r *Role) IsExpired() bool {
	return r.ExpiresAt != nil && time.Now().After(*r.ExpiresAt)
}

func (r *Role) CanAssign() bool {
	if !r.IsActive() || r.IsExpired() {
		return false
	}
	
	if r.MaxAssignments != nil && r.AssignmentCount >= int64(*r.MaxAssignments) {
		return false
	}
	
	return true
}

// ============================================================================
// PERMISSION - Permissions
// ============================================================================

type PermissionType string

const (
	PermissionTypeResource PermissionType = "RESOURCE" // CRUD on resources
	PermissionTypeAction   PermissionType = "ACTION"   // Specific actions
	PermissionTypeFeature  PermissionType = "FEATURE"  // Feature access
	PermissionTypeData     PermissionType = "DATA"     // Data access
	PermissionTypeAPI      PermissionType = "API"      // API endpoints
)

type PermissionEffect string

const (
	PermissionEffectAllow PermissionEffect = "ALLOW"
	PermissionEffectDeny  PermissionEffect = "DENY"
)

type Permission struct {
	// Identity (3 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`

	// Permission Info (8 fields)
	Code        string           `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string           `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string          `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        PermissionType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Effect      PermissionEffect `gorm:"column:effect;type:varchar(10);default:'ALLOW'" json:"effect"`
	Resource    string           `gorm:"column:resource;type:varchar(100);not null;index" json:"resource"`
	Action      string           `gorm:"column:action;type:varchar(100);not null;index" json:"action"`
	IsSystem    bool             `gorm:"column:is_system;default:false" json:"is_system"`

	// Scope (2 fields)
	Scope      RoleScope `gorm:"column:scope;type:varchar(20);default:'GLOBAL'" json:"scope"`
	Conditions JSONB     `gorm:"column:conditions;type:jsonb" json:"conditions,omitempty"`

	// Statistics (2 fields)
	RoleCount      int64      `gorm:"column:role_count;default:0" json:"role_count"`
	LastAssignedAt *time.Time `gorm:"column:last_assigned_at" json:"last_assigned_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Category *PermissionCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (Permission) TableName() string {
	return "permissions"
}

func (p *Permission) Matches(resource, action string) bool {
	// Support wildcards
	resourceMatch := p.Resource == "*" || p.Resource == resource
	actionMatch := p.Action == "*" || p.Action == action
	
	return resourceMatch && actionMatch
}

func (p *Permission) GetFullCode() string {
	return fmt.Sprintf("%s:%s", p.Resource, p.Action)
}

// ============================================================================
// ROLE PERMISSION - Role-Permission Mapping
// ============================================================================

type RolePermission struct {
	// Identity (3 fields)
	ID           uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	RoleID       uuid.UUID `gorm:"column:role_id;type:uuid;not null;index;uniqueIndex:idx_role_permission" json:"role_id"`
	PermissionID uuid.UUID `gorm:"column:permission_id;type:uuid;not null;index;uniqueIndex:idx_role_permission" json:"permission_id"`

	// Configuration (3 fields)
	Effect     PermissionEffect `gorm:"column:effect;type:varchar(10);default:'ALLOW'" json:"effect"`
	Conditions JSONB            `gorm:"column:conditions;type:jsonb" json:"conditions,omitempty"`
	Priority   int              `gorm:"column:priority;default:0" json:"priority"`

	// Scope (2 fields)
	ScopeID   *uuid.UUID `gorm:"column:scope_id;type:uuid" json:"scope_id,omitempty"`
	ScopeType *string    `gorm:"column:scope_type;type:varchar(50)" json:"scope_type,omitempty"`

	// Time Constraints (2 fields)
	ValidFrom *time.Time `gorm:"column:valid_from" json:"valid_from,omitempty"`
	ValidTo   *time.Time `gorm:"column:valid_to" json:"valid_to,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationships
	Role       *Role       `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Permission *Permission `gorm:"foreignKey:PermissionID" json:"permission,omitempty"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}

func (rp *RolePermission) IsValid() bool {
	now := time.Now()
	
	if rp.ValidFrom != nil && now.Before(*rp.ValidFrom) {
		return false
	}
	
	if rp.ValidTo != nil && now.After(*rp.ValidTo) {
		return false
	}
	
	return true
}

// ============================================================================
// ROLE CATEGORY - Role Categories
// ============================================================================

type RoleCategory struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Category Info (7 fields)
	Code        string  `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	Icon        *string `gorm:"column:icon;type:varchar(100)" json:"icon,omitempty"`
	Color       *string `gorm:"column:color;type:varchar(20)" json:"color,omitempty"`
	SortOrder   int     `gorm:"column:sort_order;default:0" json:"sort_order"`
	IsActive    bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Statistics (2 fields)
	RoleCount int64      `gorm:"column:role_count;default:0" json:"role_count"`
	LastUsedAt *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Roles []Role `gorm:"foreignKey:CategoryID" json:"roles,omitempty"`
}

func (RoleCategory) TableName() string {
	return "role_categories"
}

// ============================================================================
// PERMISSION CATEGORY - Permission Categories
// ============================================================================

type PermissionCategory struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Category Info (7 fields)
	Code        string  `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	Icon        *string `gorm:"column:icon;type:varchar(100)" json:"icon,omitempty"`
	Color       *string `gorm:"column:color;type:varchar(20)" json:"color,omitempty"`
	SortOrder   int     `gorm:"column:sort_order;default:0" json:"sort_order"`
	IsActive    bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Statistics (2 fields)
	PermissionCount int64      `gorm:"column:permission_count;default:0" json:"permission_count"`
	LastUsedAt      *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Permissions []Permission `gorm:"foreignKey:CategoryID" json:"permissions,omitempty"`
}

func (PermissionCategory) TableName() string {
	return "permission_categories"
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateRole creates a new role
func CreateRole(db *gorm.DB, role *Role, userID *uuid.UUID) error {
	role.CreatedBy = userID
	role.Status = RoleStatusActive
	
	return db.Create(role).Error
}

// CreatePermission creates a new permission
func CreatePermission(db *gorm.DB, permission *Permission, userID *uuid.UUID) error {
	permission.CreatedBy = userID
	
	return db.Create(permission).Error
}

// AssignPermissionToRole assigns a permission to a role
func AssignPermissionToRole(
	db *gorm.DB,
	roleID, permissionID uuid.UUID,
	effect PermissionEffect,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Check if already assigned
		var existing RolePermission
		err := tx.Where("role_id = ? AND permission_id = ?", roleID, permissionID).
			First(&existing).Error
		
		if err == nil {
			// Already exists
			return nil
		}
		
		// Create assignment
		rolePermission := &RolePermission{
			RoleID:       roleID,
			PermissionID: permissionID,
			Effect:       effect,
			CreatedBy:    userID,
		}
		
		if err := tx.Create(rolePermission).Error; err != nil {
			return err
		}
		
		// Update role permission count
		var role Role
		if err := tx.First(&role, roleID).Error; err != nil {
			return err
		}
		
		role.PermissionCount++
		tx.Save(&role)
		
		// Update permission role count
		var permission Permission
		if err := tx.First(&permission, permissionID).Error; err != nil {
			return err
		}
		
		permission.RoleCount++
		now := time.Now()
		permission.LastAssignedAt = &now
		tx.Save(&permission)
		
		return nil
	})
}

// RemovePermissionFromRole removes a permission from a role
func RemovePermissionFromRole(
	db *gorm.DB,
	roleID, permissionID uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Delete assignment
		if err := tx.Where("role_id = ? AND permission_id = ?", roleID, permissionID).
			Delete(&RolePermission{}).Error; err != nil {
			return err
		}
		
		// Update counts
		tx.Model(&Role{}).Where("_id = ?", roleID).
			Update("permission_count", gorm.Expr("permission_count - 1"))
		
		tx.Model(&Permission{}).Where("_id = ?", permissionID).
			Update("role_count", gorm.Expr("role_count - 1"))
		
		return nil
	})
}

// GetRolePermissions gets all permissions for a role
func GetRolePermissions(db *gorm.DB, roleID uuid.UUID) ([]Permission, error) {
	var permissions []Permission
	
	err := db.Table("permissions").
		Joins("INNER JOIN role_permissions ON permissions._id = role_permissions.permission_id").
		Where("role_permissions.role_id = ?", roleID).
		Find(&permissions).Error
	
	return permissions, err
}

// GetRolePermissionsWithEffect gets permissions with their effects
func GetRolePermissionsWithEffect(
	db *gorm.DB,
	roleID uuid.UUID,
) ([]RolePermission, error) {
	var rolePermissions []RolePermission
	
	err := db.Where("role_id = ?", roleID).
		Preload("Permission").
		Preload("Permission.Category").
		Find(&rolePermissions).Error
	
	return rolePermissions, err
}

// CheckPermission checks if a role has a specific permission
func CheckPermission(
	db *gorm.DB,
	roleID uuid.UUID,
	resource, action string,
) (bool, error) {
	permissions, err := GetRolePermissions(db, roleID)
	if err != nil {
		return false, err
	}
	
	for _, perm := range permissions {
		if perm.Matches(resource, action) && perm.Effect == PermissionEffectAllow {
			return true, nil
		}
	}
	
	return false, nil
}

// GetRoleByCode gets a role by code
func GetRoleByCode(db *gorm.DB, code string) (*Role, error) {
	var role Role
	err := db.Where("code = ? AND status = ?", code, RoleStatusActive).
		Preload("Category").
		First(&role).Error
	
	return &role, err
}

// GetPermissionByCode gets a permission by code
func GetPermissionByCode(db *gorm.DB, code string) (*Permission, error) {
	var permission Permission
	err := db.Where("code = ?", code).First(&permission).Error
	
	return &permission, err
}

// GetActiveRoles gets all active roles
func GetActiveRoles(db *gorm.DB, roleType *RoleType) ([]Role, error) {
	query := db.Where("status = ?", RoleStatusActive)
	
	if roleType != nil {
		query = query.Where("type = ?", roleType)
	}
	
	var roles []Role
	err := query.Order("priority DESC, name ASC").
		Preload("Category").
		Find(&roles).Error
	
	return roles, err
}

// GetAllPermissions gets all permissions
func GetAllPermissions(db *gorm.DB, permType *PermissionType) ([]Permission, error) {
	query := db.Model(&Permission{})
	
	if permType != nil {
		query = query.Where("type = ?", permType)
	}
	
	var permissions []Permission
	err := query.Order("resource ASC, action ASC").
		Preload("Category").
		Find(&permissions).Error
	
	return permissions, err
}

// BulkAssignPermissions assigns multiple permissions to a role
func BulkAssignPermissions(
	db *gorm.DB,
	roleID uuid.UUID,
	permissionIDs []uuid.UUID,
	userID *uuid.UUID,
) error {
	for _, permID := range permissionIDs {
		if err := AssignPermissionToRole(db, roleID, permID, PermissionEffectAllow, userID); err != nil {
			return err
		}
	}
	
	return nil
}

// CloneRole clones a role with its permissions
func CloneRole(
	db *gorm.DB,
	sourceRoleID uuid.UUID,
	newCode, newName string,
	userID *uuid.UUID,
) (*Role, error) {
	return db.Transaction(func(tx *gorm.DB) (*Role, error) {
		// Get source role
		var sourceRole Role
		if err := tx.First(&sourceRole, sourceRoleID).Error; err != nil {
			return nil, err
		}
		
		// Create new role
		newRole := &Role{
			TenantID:    sourceRole.TenantID,
			CategoryID:  sourceRole.CategoryID,
			Code:        newCode,
			Name:        newName,
			Description: sourceRole.Description,
			Type:        RoleTypeCustom,
			Status:      RoleStatusActive,
			Scope:       sourceRole.Scope,
			Priority:    sourceRole.Priority,
			CreatedBy:   userID,
		}
		
		if err := tx.Create(newRole).Error; err != nil {
			return nil, err
		}
		
		// Copy permissions
		var sourcePermissions []RolePermission
		tx.Where("role_id = ?", sourceRoleID).Find(&sourcePermissions)
		
		for _, sp := range sourcePermissions {
			newRolePermission := &RolePermission{
				RoleID:       newRole.ID,
				PermissionID: sp.PermissionID,
				Effect:       sp.Effect,
				Conditions:   sp.Conditions,
				Priority:     sp.Priority,
				CreatedBy:    userID,
			}
			tx.Create(newRolePermission)
		}
		
		// Update permission count
		newRole.PermissionCount = len(sourcePermissions)
		tx.Save(newRole)
		
		return newRole, nil
	}).(*Role), nil
}

// GetRoleHierarchy gets the role hierarchy (parent chain)
func GetRoleHierarchy(db *gorm.DB, roleID uuid.UUID) ([]Role, error) {
	hierarchy := []Role{}
	currentID := &roleID
	
	for currentID != nil {
		var role Role
		if err := db.First(&role, currentID).Error; err != nil {
			break
		}
		
		hierarchy = append(hierarchy, role)
		currentID = role.ParentID
	}
	
	return hierarchy, nil
}

// GetEffectivePermissions gets all permissions including inherited
func GetEffectivePermissions(
	db *gorm.DB,
	roleID uuid.UUID,
) ([]Permission, error) {
	// Get role hierarchy
	hierarchy, err := GetRoleHierarchy(db, roleID)
	if err != nil {
		return nil, err
	}
	
	// Collect all permissions
	permissionMap := make(map[uuid.UUID]Permission)
	
	// Start from root (last in hierarchy) to allow override
	for i := len(hierarchy) - 1; i >= 0; i-- {
		rolePerms, err := GetRolePermissions(db, hierarchy[i].ID)
		if err != nil {
			continue
		}
		
		for _, perm := range rolePerms {
			permissionMap[perm.ID] = perm
		}
	}
	
	// Convert map to slice
	permissions := make([]Permission, 0, len(permissionMap))
	for _, perm := range permissionMap {
		permissions = append(permissions, perm)
	}
	
	return permissions, nil
}

func strPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}
