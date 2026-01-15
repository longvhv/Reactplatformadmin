package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// ROLE ASSIGNMENT - User-Role Assignments
// ============================================================================
// Purpose: Assign roles to users
// Table: role_assignments
// Primary Key: _id (UUID)
// Features: Time-based, Scoped, Delegation, Temporary
// ============================================================================

type AssignmentStatus string

const (
	AssignmentStatusActive    AssignmentStatus = "ACTIVE"
	AssignmentStatusInactive  AssignmentStatus = "INACTIVE"
	AssignmentStatusExpired   AssignmentStatus = "EXPIRED"
	AssignmentStatusRevoked   AssignmentStatus = "REVOKED"
	AssignmentStatusSuspended AssignmentStatus = "SUSPENDED"
)

type AssignmentSource string

const (
	AssignmentSourceDirect     AssignmentSource = "DIRECT"     // Directly assigned
	AssignmentSourceInherited  AssignmentSource = "INHERITED"  // From parent role
	AssignmentSourceDelegated  AssignmentSource = "DELEGATED"  // Delegated by another user
	AssignmentSourceAutomatic  AssignmentSource = "AUTOMATIC"  // Auto-assigned by rule
	AssignmentSourceProvisioned AssignmentSource = "PROVISIONED" // Provisioned by system
)

type RoleAssignment struct {
	// Identity (3 fields)
	ID     uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	UserID uuid.UUID `gorm:"column:user_id;type:uuid;not null;index;uniqueIndex:idx_user_role_scope" json:"user_id"`
	RoleID uuid.UUID `gorm:"column:role_id;type:uuid;not null;index;uniqueIndex:idx_user_role_scope" json:"role_id"`

	// Status (2 fields)
	Status AssignmentStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Source AssignmentSource `gorm:"column:source;type:varchar(20);not null" json:"source"`

	// Scope (3 fields)
	ScopeID   *uuid.UUID `gorm:"column:scope_id;type:uuid;uniqueIndex:idx_user_role_scope" json:"scope_id,omitempty"`
	ScopeType *string    `gorm:"column:scope_type;type:varchar(50)" json:"scope_type,omitempty"` // department, project, resource
	Scope     RoleScope  `gorm:"column:scope;type:varchar(20);default:'GLOBAL'" json:"scope"`

	// Time Constraints (3 fields)
	ValidFrom *time.Time `gorm:"column:valid_from" json:"valid_from,omitempty"`
	ValidTo   *time.Time `gorm:"column:valid_to" json:"valid_to,omitempty"`
	ExpiresAt *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`

	// Assignment Info (3 fields)
	AssignedBy  *uuid.UUID `gorm:"column:assigned_by;type:uuid" json:"assigned_by,omitempty"`
	Reason      *string    `gorm:"column:reason;type:text" json:"reason,omitempty"`
	IsTemporary bool       `gorm:"column:is_temporary;default:false" json:"is_temporary"`

	// Delegation (2 fields)
	CanDelegate       bool  `gorm:"column:can_delegate;default:false" json:"can_delegate"`
	MaxDelegationDepth *int `gorm:"column:max_delegation_depth" json:"max_delegation_depth,omitempty"`

	// Conditions (1 field)
	Conditions JSONB `gorm:"column:conditions;type:jsonb" json:"conditions,omitempty"`

	// Revocation (3 fields)
	RevokedAt *time.Time `gorm:"column:revoked_at" json:"revoked_at,omitempty"`
	RevokedBy *uuid.UUID `gorm:"column:revoked_by;type:uuid" json:"revoked_by,omitempty"`
	RevokeReason *string `gorm:"column:revoke_reason;type:text" json:"revoke_reason,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Role *Role `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

func (RoleAssignment) TableName() string {
	return "role_assignments"
}

func (ra *RoleAssignment) IsActive() bool {
	return ra.Status == AssignmentStatusActive
}

func (ra *RoleAssignment) IsValid() bool {
	if !ra.IsActive() {
		return false
	}

	now := time.Now()

	if ra.ValidFrom != nil && now.Before(*ra.ValidFrom) {
		return false
	}

	if ra.ValidTo != nil && now.After(*ra.ValidTo) {
		return false
	}

	if ra.ExpiresAt != nil && now.After(*ra.ExpiresAt) {
		return false
	}

	return true
}

// ============================================================================
// ROLE DELEGATION - Delegation Management
// ============================================================================

type DelegationStatus string

const (
	DelegationStatusActive   DelegationStatus = "ACTIVE"
	DelegationStatusExpired  DelegationStatus = "EXPIRED"
	DelegationStatusRevoked  DelegationStatus = "REVOKED"
	DelegationStatusCompleted DelegationStatus = "COMPLETED"
)

type RoleDelegation struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	AssignmentID   uuid.UUID `gorm:"column:assignment_id;type:uuid;not null;index" json:"assignment_id"`
	DelegatedToID  uuid.UUID `gorm:"column:delegated_to_id;type:uuid;not null;index" json:"delegated_to_id"`

	// Delegation Info (5 fields)
	DelegatedByID uuid.UUID         `gorm:"column:delegated_by_id;type:uuid;not null;index" json:"delegated_by_id"`
	Status        DelegationStatus  `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Reason        *string           `gorm:"column:reason;type:text" json:"reason,omitempty"`
	Depth         int               `gorm:"column:depth;default:1" json:"depth"` // Delegation chain depth
	CanSubDelegate bool             `gorm:"column:can_sub_delegate;default:false" json:"can_sub_delegate"`

	// Time Constraints (3 fields)
	ValidFrom *time.Time `gorm:"column:valid_from" json:"valid_from,omitempty"`
	ValidTo   *time.Time `gorm:"column:valid_to" json:"valid_to,omitempty"`
	ExpiresAt *time.Time `gorm:"column:expires_at;not null" json:"expires_at"`

	// Scope Restrictions (2 fields)
	ScopeRestrictions JSONB `gorm:"column:scope_restrictions;type:jsonb" json:"scope_restrictions,omitempty"`
	PermissionSubset  JSONB `gorm:"column:permission_subset;type:jsonb" json:"permission_subset,omitempty"` // Subset of permissions

	// Revocation (3 fields)
	RevokedAt    *time.Time `gorm:"column:revoked_at" json:"revoked_at,omitempty"`
	RevokedBy    *uuid.UUID `gorm:"column:revoked_by;type:uuid" json:"revoked_by,omitempty"`
	RevokeReason *string    `gorm:"column:revoke_reason;type:text" json:"revoke_reason,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Assignment *RoleAssignment `gorm:"foreignKey:AssignmentID" json:"assignment,omitempty"`
}

func (RoleDelegation) TableName() string {
	return "role_delegations"
}

func (rd *RoleDelegation) IsActive() bool {
	return rd.Status == DelegationStatusActive && !rd.IsExpired()
}

func (rd *RoleDelegation) IsExpired() bool {
	return time.Now().After(*rd.ExpiresAt)
}

// ============================================================================
// ROLE HIERARCHY - Role Hierarchy
// ============================================================================

type RoleHierarchy struct {
	// Identity (3 fields)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ParentID uuid.UUID `gorm:"column:parent_id;type:uuid;not null;index;uniqueIndex:idx_parent_child" json:"parent_id"`
	ChildID  uuid.UUID `gorm:"column:child_id;type:uuid;not null;index;uniqueIndex:idx_parent_child" json:"child_id"`

	// Hierarchy Info (3 fields)
	Depth       int  `gorm:"column:depth;default:1" json:"depth"` // Distance from root
	InheritPerms bool `gorm:"column:inherit_perms;default:true" json:"inherit_perms"`
	IsActive    bool `gorm:"column:is_active;default:true" json:"is_active"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationships
	Parent *Role `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Child  *Role `gorm:"foreignKey:ChildID" json:"child,omitempty"`
}

func (RoleHierarchy) TableName() string {
	return "role_hierarchies"
}

// ============================================================================
// ROLE CONDITION - Dynamic Assignment Conditions
// ============================================================================

type ConditionType string

const (
	ConditionTypeAttribute ConditionType = "ATTRIBUTE" // User attribute
	ConditionTypeGroup     ConditionType = "GROUP"     // User group membership
	ConditionTypeDepartment ConditionType = "DEPARTMENT"
	ConditionTypeLocation  ConditionType = "LOCATION"
	ConditionTypeTime      ConditionType = "TIME"      // Time-based
	ConditionTypeCustom    ConditionType = "CUSTOM"    // Custom logic
)

type ConditionOperator string

const (
	ConditionOperatorEquals       ConditionOperator = "EQUALS"
	ConditionOperatorNotEquals    ConditionOperator = "NOT_EQUALS"
	ConditionOperatorContains     ConditionOperator = "CONTAINS"
	ConditionOperatorIn           ConditionOperator = "IN"
	ConditionOperatorGreaterThan  ConditionOperator = "GREATER_THAN"
	ConditionOperatorLessThan     ConditionOperator = "LESS_THAN"
)

type RoleCondition struct {
	// Identity (2 fields)
	ID     uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	RoleID uuid.UUID `gorm:"column:role_id;type:uuid;not null;index" json:"role_id"`

	// Condition Info (6 fields)
	Name        string            `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string           `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        ConditionType     `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Field       string            `gorm:"column:field;type:varchar(100);not null" json:"field"`
	Operator    ConditionOperator `gorm:"column:operator;type:varchar(20);not null" json:"operator"`
	Value       JSONB             `gorm:"column:value;type:jsonb;not null" json:"value"`

	// Logic (2 fields)
	IsActive bool `gorm:"column:is_active;default:true" json:"is_active"`
	Priority int  `gorm:"column:priority;default:0" json:"priority"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Role *Role `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

func (RoleCondition) TableName() string {
	return "role_conditions"
}

func (rc *RoleCondition) Evaluate(context map[string]interface{}) bool {
	value, exists := context[rc.Field]
	if !exists {
		return false
	}

	conditionValue := rc.Value["value"]

	switch rc.Operator {
	case ConditionOperatorEquals:
		return value == conditionValue
	case ConditionOperatorNotEquals:
		return value != conditionValue
	case ConditionOperatorContains:
		str, ok := value.(string)
		target, ok2 := conditionValue.(string)
		if ok && ok2 {
			return contains(str, target)
		}
		return false
	// Add more operators as needed
	default:
		return false
	}
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && 
		   (s == substr || (len(s) > len(substr) && 
		    (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr)))
}

// ============================================================================
// Helper Functions
// ============================================================================

// AssignRole assigns a role to a user
func AssignRole(
	db *gorm.DB,
	userID, roleID uuid.UUID,
	assignedBy *uuid.UUID,
	options map[string]interface{},
) (*RoleAssignment, error) {
	return db.Transaction(func(tx *gorm.DB) (*RoleAssignment, error) {
		// Check if role can be assigned
		var role Role
		if err := tx.First(&role, roleID).Error; err != nil {
			return nil, err
		}

		if !role.CanAssign() {
			return nil, fmt.Errorf("role cannot be assigned")
		}

		// Check if already assigned
		var existing RoleAssignment
		err := tx.Where("user_id = ? AND role_id = ? AND status = ?", 
			userID, roleID, AssignmentStatusActive).First(&existing).Error

		if err == nil {
			return &existing, nil // Already assigned
		}

		// Create assignment
		assignment := &RoleAssignment{
			UserID:     userID,
			RoleID:     roleID,
			Status:     AssignmentStatusActive,
			Source:     AssignmentSourceDirect,
			AssignedBy: assignedBy,
			Scope:      role.Scope,
		}

		// Apply options
		if validFrom, ok := options["valid_from"].(time.Time); ok {
			assignment.ValidFrom = &validFrom
		}
		if validTo, ok := options["valid_to"].(time.Time); ok {
			assignment.ValidTo = &validTo
		}
		if expiresAt, ok := options["expires_at"].(time.Time); ok {
			assignment.ExpiresAt = &expiresAt
			assignment.IsTemporary = true
		}
		if reason, ok := options["reason"].(string); ok {
			assignment.Reason = &reason
		}

		if err := tx.Create(assignment).Error; err != nil {
			return nil, err
		}

		// Update role statistics
		role.AssignmentCount++
		role.ActiveUsers++
		now := time.Now()
		role.LastAssignedAt = &now
		tx.Save(&role)

		return assignment, nil
	}).(*RoleAssignment), nil
}

// RevokeRole revokes a role from a user
func RevokeRole(
	db *gorm.DB,
	assignmentID uuid.UUID,
	revokedBy *uuid.UUID,
	reason string,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var assignment RoleAssignment
		if err := tx.First(&assignment, assignmentID).Error; err != nil {
			return err
		}

		now := time.Now()
		assignment.Status = AssignmentStatusRevoked
		assignment.RevokedAt = &now
		assignment.RevokedBy = revokedBy
		assignment.RevokeReason = &reason

		if err := tx.Save(&assignment).Error; err != nil {
			return err
		}

		// Update role statistics
		tx.Model(&Role{}).Where("_id = ?", assignment.RoleID).
			Update("active_users", gorm.Expr("active_users - 1"))

		return nil
	})
}

// GetUserRoles gets all roles for a user
func GetUserRoles(db *gorm.DB, userID uuid.UUID) ([]Role, error) {
	var roles []Role

	err := db.Table("roles").
		Joins("INNER JOIN role_assignments ON roles._id = role_assignments.role_id").
		Where("role_assignments.user_id = ? AND role_assignments.status = ?", 
			userID, AssignmentStatusActive).
		Preload("Category").
		Find(&roles).Error

	return roles, err
}

// GetUserAssignments gets all role assignments for a user
func GetUserAssignments(db *gorm.DB, userID uuid.UUID) ([]RoleAssignment, error) {
	var assignments []RoleAssignment

	err := db.Where("user_id = ?", userID).
		Preload("Role").
		Preload("Role.Category").
		Order("created_at DESC").
		Find(&assignments).Error

	return assignments, err
}

// GetUserPermissions gets all permissions for a user (from all roles)
func GetUserPermissions(db *gorm.DB, userID uuid.UUID) ([]Permission, error) {
	roles, err := GetUserRoles(db, userID)
	if err != nil {
		return nil, err
	}

	permissionMap := make(map[uuid.UUID]Permission)

	for _, role := range roles {
		permissions, err := GetEffectivePermissions(db, role.ID)
		if err != nil {
			continue
		}

		for _, perm := range permissions {
			permissionMap[perm.ID] = perm
		}
	}

	permissions := make([]Permission, 0, len(permissionMap))
	for _, perm := range permissionMap {
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// CheckUserPermission checks if a user has a specific permission
func CheckUserPermission(
	db *gorm.DB,
	userID uuid.UUID,
	resource, action string,
) (bool, error) {
	permissions, err := GetUserPermissions(db, userID)
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

// DelegateRole delegates a role to another user
func DelegateRole(
	db *gorm.DB,
	assignmentID, delegatedToID, delegatedByID uuid.UUID,
	expiresAt time.Time,
	options map[string]interface{},
) (*RoleDelegation, error) {
	return db.Transaction(func(tx *gorm.DB) (*RoleDelegation, error) {
		// Get assignment
		var assignment RoleAssignment
		if err := tx.First(&assignment, assignmentID).Error; err != nil {
			return nil, err
		}

		// Check if can delegate
		if !assignment.CanDelegate {
			return nil, fmt.Errorf("this assignment cannot be delegated")
		}

		// Create delegation
		delegation := &RoleDelegation{
			AssignmentID:  assignmentID,
			DelegatedToID: delegatedToID,
			DelegatedByID: delegatedByID,
			Status:        DelegationStatusActive,
			ExpiresAt:     &expiresAt,
			Depth:         1,
		}

		// Apply options
		if reason, ok := options["reason"].(string); ok {
			delegation.Reason = &reason
		}
		if canSubDelegate, ok := options["can_sub_delegate"].(bool); ok {
			delegation.CanSubDelegate = canSubDelegate
		}

		if err := tx.Create(delegation).Error; err != nil {
			return nil, err
		}

		// Create temporary assignment for delegated user
		delegatedAssignment := &RoleAssignment{
			UserID:     delegatedToID,
			RoleID:     assignment.RoleID,
			Status:     AssignmentStatusActive,
			Source:     AssignmentSourceDelegated,
			AssignedBy: &delegatedByID,
			ExpiresAt:  &expiresAt,
			IsTemporary: true,
			Scope:      assignment.Scope,
			ScopeID:    assignment.ScopeID,
			ScopeType:  assignment.ScopeType,
		}

		tx.Create(delegatedAssignment)

		return delegation, nil
	}).(*RoleDelegation), nil
}

// RevokeDelegation revokes a delegation
func RevokeDelegation(
	db *gorm.DB,
	delegationID uuid.UUID,
	revokedBy *uuid.UUID,
	reason string,
) error {
	now := time.Now()

	return db.Model(&RoleDelegation{}).
		Where("_id = ?", delegationID).
		Updates(map[string]interface{}{
			"status":       DelegationStatusRevoked,
			"revoked_at":   now,
			"revoked_by":   revokedBy,
			"revoke_reason": reason,
		}).Error
}

// GetActiveDelegations gets active delegations for a user
func GetActiveDelegations(
	db *gorm.DB,
	userID uuid.UUID,
	asDelegate bool,
) ([]RoleDelegation, error) {
	query := db.Where("status = ?", DelegationStatusActive)

	if asDelegate {
		query = query.Where("delegated_to_id = ?", userID)
	} else {
		query = query.Where("delegated_by_id = ?", userID)
	}

	var delegations []RoleDelegation
	err := query.Preload("Assignment").
		Preload("Assignment.Role").
		Find(&delegations).Error

	return delegations, err
}

// ExpireAssignments expires assignments that have passed their expiry date
func ExpireAssignments(db *gorm.DB) error {
	return db.Model(&RoleAssignment{}).
		Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?", 
			AssignmentStatusActive, time.Now()).
		Update("status", AssignmentStatusExpired).Error
}

// ExpireDelegations expires delegations that have passed their expiry date
func ExpireDelegations(db *gorm.DB) error {
	return db.Model(&RoleDelegation{}).
		Where("status = ? AND expires_at < ?", 
			DelegationStatusActive, time.Now()).
		Update("status", DelegationStatusExpired).Error
}

// GetRoleUsers gets all users assigned to a role
func GetRoleUsers(db *gorm.DB, roleID uuid.UUID) ([]uuid.UUID, error) {
	var userIDs []uuid.UUID

	err := db.Table("role_assignments").
		Select("user_id").
		Where("role_id = ? AND status = ?", roleID, AssignmentStatusActive).
		Pluck("user_id", &userIDs).Error

	return userIDs, err
}

// BulkAssignRoles assigns multiple roles to a user
func BulkAssignRoles(
	db *gorm.DB,
	userID uuid.UUID,
	roleIDs []uuid.UUID,
	assignedBy *uuid.UUID,
) error {
	for _, roleID := range roleIDs {
		_, err := AssignRole(db, userID, roleID, assignedBy, nil)
		if err != nil {
			return err
		}
	}

	return nil
}
