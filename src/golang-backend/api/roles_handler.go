package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

// ============================================================================
// MODELS - Roles & Permissions
// ============================================================================

// Role represents a role with permissions
type Role struct {
	// I. ĐỊNH DANH & PHÂN TÁCH
	ID       string `json:"_id" db:"_id"`
	TenantID string `json:"tenant_id" db:"tenant_id"`

	// II. THÔNG TIN NGHIỆP VỤ
	Name        string `json:"name" db:"name"`
	Description string `json:"description,omitempty" db:"description"`
	Type        string `json:"type" db:"type"` // SYSTEM, CUSTOM

	// III. QUYỀN HẠN (TEXT[] array)
	PermissionCodes []string `json:"permission_codes" db:"permission_codes"`

	// IV. TRUY VẾT & PHIÊN BẢN
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	Version   int64     `json:"version" db:"version"`
}

// Permission represents a system permission
type Permission struct {
	ID          string     `json:"_id" db:"_id"`
	AppCode     string     `json:"app_code" db:"app_code"`
	Code        string     `json:"code" db:"code"`
	ParentCode  *string    `json:"parent_code,omitempty" db:"parent_code"`
	Path        *string    `json:"path,omitempty" db:"path"`
	IsGroup     bool       `json:"is_group" db:"is_group"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// UserRole represents a role assignment to a user
type UserRole struct {
	ID         string    `json:"_id" db:"_id"`
	TenantID   string    `json:"tenant_id" db:"tenant_id"`
	MemberID   string    `json:"member_id" db:"member_id"`
	RoleID     string    `json:"role_id" db:"role_id"`
	ScopeType  string    `json:"scope_type" db:"scope_type"`       // GLOBAL, DEPARTMENT, LOCATION, PROJECT
	ScopeValues []string `json:"scope_values" db:"scope_values"`
	AssignedBy *string   `json:"assigned_by,omitempty" db:"assigned_by"`
	AssignedAt time.Time `json:"assigned_at" db:"assigned_at"`
}

// CreateRoleRequest represents request body for creating role
type CreateRoleRequest struct {
	TenantID        string   `json:"tenant_id" validate:"required"`
	Name            string   `json:"name" validate:"required"`
	Description     string   `json:"description,omitempty"`
	Type            string   `json:"type" validate:"required,oneof=SYSTEM CUSTOM"`
	PermissionCodes []string `json:"permission_codes,omitempty"`
}

// UpdateRoleRequest represents request body for updating role
type UpdateRoleRequest struct {
	Name            *string   `json:"name,omitempty"`
	Description     *string   `json:"description,omitempty"`
	PermissionCodes *[]string `json:"permission_codes,omitempty"`
}

// AssignRoleRequest represents request body for assigning role to user
type AssignRoleRequest struct {
	MemberID    string   `json:"member_id" validate:"required"`
	RoleID      string   `json:"role_id" validate:"required"`
	ScopeType   string   `json:"scope_type" validate:"required,oneof=GLOBAL DEPARTMENT LOCATION PROJECT"`
	ScopeValues []string `json:"scope_values,omitempty"`
	AssignedBy  string   `json:"assigned_by,omitempty"`
}

// RolesHandler handles role-related HTTP requests
type RolesHandler struct {
	db *sql.DB
}

// NewRolesHandler creates a new roles handler
func NewRolesHandler(db *sql.DB) *RolesHandler {
	return &RolesHandler{db: db}
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// RegisterRoutes registers role API routes
func (h *RolesHandler) RegisterRoutes(r *mux.Router) {
	// Roles CRUD
	r.HandleFunc("/api/roles", h.ListRoles).Methods("GET")
	r.HandleFunc("/api/roles/{id}", h.GetRole).Methods("GET")
	r.HandleFunc("/api/roles", h.CreateRole).Methods("POST")
	r.HandleFunc("/api/roles/{id}", h.UpdateRole).Methods("PUT", "PATCH")
	r.HandleFunc("/api/roles/{id}", h.DeleteRole).Methods("DELETE")

	// Permissions Management
	r.HandleFunc("/api/roles/{id}/permissions", h.GetRolePermissions).Methods("GET")
	r.HandleFunc("/api/roles/{id}/permissions", h.UpdateRolePermissions).Methods("PUT")
	r.HandleFunc("/api/roles/{id}/permissions/{code}", h.AddPermission).Methods("POST")
	r.HandleFunc("/api/roles/{id}/permissions/{code}", h.RemovePermission).Methods("DELETE")

	// Role Assignments
	r.HandleFunc("/api/user-roles", h.ListUserRoles).Methods("GET")
	r.HandleFunc("/api/user-roles", h.AssignRole).Methods("POST")
	r.HandleFunc("/api/user-roles/{id}", h.UnassignRole).Methods("DELETE")
	r.HandleFunc("/api/users/{userId}/roles", h.GetUserRoles).Methods("GET")

	// Permissions CRUD
	r.HandleFunc("/api/permissions", h.ListPermissions).Methods("GET")
	r.HandleFunc("/api/permissions/{id}", h.GetPermission).Methods("GET")
	r.HandleFunc("/api/permissions", h.CreatePermission).Methods("POST")
	r.HandleFunc("/api/permissions/{id}", h.UpdatePermission).Methods("PUT", "PATCH")
	r.HandleFunc("/api/permissions/{id}", h.DeletePermission).Methods("DELETE")

	// Special operations
	r.HandleFunc("/api/roles/search", h.SearchRoles).Methods("GET")
	r.HandleFunc("/api/roles/stats", h.GetStats).Methods("GET")
	r.HandleFunc("/api/permissions/tree", h.GetPermissionsTree).Methods("GET")
}

// ============================================================================
// HANDLERS - ROLES
// ============================================================================

// ListRoles returns all roles with pagination and filtering
func (h *RolesHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	roleType := r.URL.Query().Get("type")
	page := getIntQueryParam(r, "page", 1)
	limit := getIntQueryParam(r, "limit", 20)
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT 
			_id, tenant_id, name, description, type,
			permission_codes, created_at, updated_at, version
		FROM roles
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if tenantID != "" {
		query += fmt.Sprintf(" AND tenant_id = $%d", argIdx)
		args = append(args, tenantID)
		argIdx++
	}

	if roleType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, roleType)
		argIdx++
	}

	query += " ORDER BY type, name"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	roles := []Role{}
	for rows.Next() {
		var role Role
		err := rows.Scan(
			&role.ID, &role.TenantID, &role.Name, &role.Description, &role.Type,
			pq.Array(&role.PermissionCodes), &role.CreatedAt, &role.UpdatedAt, &role.Version,
		)
		if err != nil {
			continue
		}
		roles = append(roles, role)
	}

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM roles WHERE 1=1"
	if tenantID != "" {
		countQuery += " AND tenant_id = '" + tenantID + "'"
	}
	if roleType != "" {
		countQuery += " AND type = '" + roleType + "'"
	}
	h.db.QueryRow(countQuery).Scan(&total)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": roles,
		"meta": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetRole returns a specific role by ID
func (h *RolesHandler) GetRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(roleID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid role ID", err)
		return
	}

	query := `
		SELECT 
			_id, tenant_id, name, description, type,
			permission_codes, created_at, updated_at, version
		FROM roles
		WHERE _id = $1
	`

	var role Role
	err := h.db.QueryRow(query, roleID).Scan(
		&role.ID, &role.TenantID, &role.Name, &role.Description, &role.Type,
		pq.Array(&role.PermissionCodes), &role.CreatedAt, &role.UpdatedAt, &role.Version,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, role)
}

// CreateRole creates a new role
func (h *RolesHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var req CreateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Generate UUID
	roleID := uuid.New().String()

	// Insert
	query := `
		INSERT INTO roles (
			_id, tenant_id, name, description, type, permission_codes
		) VALUES (
			$1, $2, $3, $4, $5, $6
		)
		RETURNING _id, tenant_id, name, description, type, 
		          permission_codes, created_at, updated_at, version
	`

	var role Role
	err := h.db.QueryRow(
		query,
		roleID, req.TenantID, req.Name, req.Description, req.Type,
		pq.Array(req.PermissionCodes),
	).Scan(
		&role.ID, &role.TenantID, &role.Name, &role.Description, &role.Type,
		pq.Array(&role.PermissionCodes), &role.CreatedAt, &role.UpdatedAt, &role.Version,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			respondError(w, http.StatusConflict, "Role name already exists for this tenant", err)
			return
		}
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusCreated, role)
}

// UpdateRole updates role information
func (h *RolesHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(roleID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid role ID", err)
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Build dynamic UPDATE query
	updates := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.PermissionCodes != nil {
		updates = append(updates, fmt.Sprintf("permission_codes = $%d", argIdx))
		args = append(args, pq.Array(*req.PermissionCodes))
		argIdx++
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update", nil)
		return
	}

	// Add version increment
	updates = append(updates, "version = version + 1")

	// Add role ID
	args = append(args, roleID)

	query := fmt.Sprintf(`
		UPDATE roles 
		SET %s, updated_at = NOW()
		WHERE _id = $%d
		RETURNING _id, name, type, version, updated_at
	`, strings.Join(updates, ", "), argIdx)

	var role Role
	err := h.db.QueryRow(query, args...).Scan(
		&role.ID, &role.Name, &role.Type, &role.Version, &role.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, role)
}

// DeleteRole deletes a role
func (h *RolesHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(roleID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid role ID", err)
		return
	}

	// Check if system role
	var roleType string
	err := h.db.QueryRow("SELECT type FROM roles WHERE _id = $1", roleID).Scan(&roleType)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found", nil)
		return
	}
	if roleType == "SYSTEM" {
		respondError(w, http.StatusForbidden, "Cannot delete system role", nil)
		return
	}

	query := `DELETE FROM roles WHERE _id = $1 RETURNING _id`

	var id string
	err = h.db.QueryRow(query, roleID).Scan(&id)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Role deleted successfully",
		"id":      id,
	})
}

// ============================================================================
// HANDLERS - PERMISSIONS MANAGEMENT
// ============================================================================

// GetRolePermissions returns permissions for a role
func (h *RolesHandler) GetRolePermissions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleID := vars["id"]

	query := `
		SELECT permission_codes 
		FROM roles 
		WHERE _id = $1
	`

	var permCodes []string
	err := h.db.QueryRow(query, roleID).Scan(pq.Array(&permCodes))

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"permission_codes": permCodes,
	})
}

// UpdateRolePermissions updates all permissions for a role
func (h *RolesHandler) UpdateRolePermissions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleID := vars["id"]

	var req struct {
		PermissionCodes []string `json:"permission_codes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	query := `
		UPDATE roles 
		SET permission_codes = $1, version = version + 1
		WHERE _id = $2
		RETURNING permission_codes
	`

	var permCodes []string
	err := h.db.QueryRow(query, pq.Array(req.PermissionCodes), roleID).Scan(pq.Array(&permCodes))

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"permission_codes": permCodes,
	})
}

// AddPermission adds a single permission to role
func (h *RolesHandler) AddPermission(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleID := vars["id"]
	permCode := vars["code"]

	query := `
		UPDATE roles 
		SET permission_codes = array_append(permission_codes, $1),
		    version = version + 1
		WHERE _id = $2 
		  AND NOT ($1 = ANY(permission_codes))
		RETURNING permission_codes
	`

	var permCodes []string
	err := h.db.QueryRow(query, permCode, roleID).Scan(pq.Array(&permCodes))

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found or permission already exists", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"permission_codes": permCodes,
	})
}

// RemovePermission removes a single permission from role
func (h *RolesHandler) RemovePermission(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleID := vars["id"]
	permCode := vars["code"]

	query := `
		UPDATE roles 
		SET permission_codes = array_remove(permission_codes, $1),
		    version = version + 1
		WHERE _id = $2
		RETURNING permission_codes
	`

	var permCodes []string
	err := h.db.QueryRow(query, permCode, roleID).Scan(pq.Array(&permCodes))

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Role not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"permission_codes": permCodes,
	})
}

// ============================================================================
// HANDLERS - USER ROLE ASSIGNMENTS
// ============================================================================

// ListUserRoles returns all role assignments
func (h *RolesHandler) ListUserRoles(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	memberID := r.URL.Query().Get("member_id")

	query := `
		SELECT 
			_id, tenant_id, member_id, role_id,
			scope_type, scope_values, assigned_by, assigned_at
		FROM user_roles
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if tenantID != "" {
		query += fmt.Sprintf(" AND tenant_id = $%d", argIdx)
		args = append(args, tenantID)
		argIdx++
	}

	if memberID != "" {
		query += fmt.Sprintf(" AND member_id = $%d", argIdx)
		args = append(args, memberID)
		argIdx++
	}

	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	userRoles := []UserRole{}
	for rows.Next() {
		var ur UserRole
		err := rows.Scan(
			&ur.ID, &ur.TenantID, &ur.MemberID, &ur.RoleID,
			&ur.ScopeType, pq.Array(&ur.ScopeValues), &ur.AssignedBy, &ur.AssignedAt,
		)
		if err != nil {
			continue
		}
		userRoles = append(userRoles, ur)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": userRoles,
	})
}

// AssignRole assigns a role to a user
func (h *RolesHandler) AssignRole(w http.ResponseWriter, r *http.Request) {
	var req AssignRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Get tenant_id from role
	var tenantID string
	err := h.db.QueryRow("SELECT tenant_id FROM roles WHERE _id = $1", req.RoleID).Scan(&tenantID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid role ID", err)
		return
	}

	urID := uuid.New().String()

	query := `
		INSERT INTO user_roles (
			_id, tenant_id, member_id, role_id,
			scope_type, scope_values, assigned_by
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
		RETURNING _id, tenant_id, member_id, role_id, scope_type, assigned_at
	`

	var ur UserRole
	err = h.db.QueryRow(
		query,
		urID, tenantID, req.MemberID, req.RoleID,
		req.ScopeType, pq.Array(req.ScopeValues), nullString(req.AssignedBy),
	).Scan(
		&ur.ID, &ur.TenantID, &ur.MemberID, &ur.RoleID, &ur.ScopeType, &ur.AssignedAt,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			respondError(w, http.StatusConflict, "Role already assigned with this scope", err)
			return
		}
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusCreated, ur)
}

// UnassignRole removes a role assignment
func (h *RolesHandler) UnassignRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	urID := vars["id"]

	query := `DELETE FROM user_roles WHERE _id = $1 RETURNING _id`

	var id string
	err := h.db.QueryRow(query, urID).Scan(&id)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Assignment not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Role unassigned successfully",
		"id":      id,
	})
}

// GetUserRoles returns all roles for a specific user
func (h *RolesHandler) GetUserRoles(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userId"]

	query := `
		SELECT 
			ur._id, ur.tenant_id, ur.member_id, ur.role_id,
			ur.scope_type, ur.scope_values, ur.assigned_at,
			r.name as role_name, r.type as role_type, r.permission_codes
		FROM user_roles ur
		JOIN roles r ON ur.role_id = r._id
		WHERE ur.member_id = $1
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	type UserRoleDetail struct {
		UserRole
		RoleName        string   `json:"role_name"`
		RoleType        string   `json:"role_type"`
		PermissionCodes []string `json:"permission_codes"`
	}

	userRoles := []UserRoleDetail{}
	for rows.Next() {
		var urd UserRoleDetail
		err := rows.Scan(
			&urd.ID, &urd.TenantID, &urd.MemberID, &urd.RoleID,
			&urd.ScopeType, pq.Array(&urd.ScopeValues), &urd.AssignedAt,
			&urd.RoleName, &urd.RoleType, pq.Array(&urd.PermissionCodes),
		)
		if err != nil {
			continue
		}
		userRoles = append(userRoles, urd)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": userRoles,
	})
}

// ============================================================================
// HANDLERS - PERMISSIONS
// ============================================================================

// ListPermissions returns all permissions
func (h *RolesHandler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	appCode := r.URL.Query().Get("app_code")

	query := `
		SELECT 
			_id, app_code, code, parent_code, path, is_group,
			name, description, created_at, updated_at
		FROM permissions
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if appCode != "" {
		query += fmt.Sprintf(" AND app_code = $%d", argIdx)
		args = append(args, appCode)
		argIdx++
	}

	query += " ORDER BY path, code"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	permissions := []Permission{}
	for rows.Next() {
		var perm Permission
		err := rows.Scan(
			&perm.ID, &perm.AppCode, &perm.Code, &perm.ParentCode, &perm.Path, &perm.IsGroup,
			&perm.Name, &perm.Description, &perm.CreatedAt, &perm.UpdatedAt,
		)
		if err != nil {
			continue
		}
		permissions = append(permissions, perm)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": permissions,
	})
}

// GetPermission returns a specific permission
func (h *RolesHandler) GetPermission(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	permID := vars["id"]

	query := `
		SELECT 
			_id, app_code, code, parent_code, path, is_group,
			name, description, created_at, updated_at
		FROM permissions
		WHERE _id = $1
	`

	var perm Permission
	err := h.db.QueryRow(query, permID).Scan(
		&perm.ID, &perm.AppCode, &perm.Code, &perm.ParentCode, &perm.Path, &perm.IsGroup,
		&perm.Name, &perm.Description, &perm.CreatedAt, &perm.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Permission not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, perm)
}

// CreatePermission, UpdatePermission, DeletePermission - Implementation similar to above
func (h *RolesHandler) CreatePermission(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Create permission - Coming soon"})
}

func (h *RolesHandler) UpdatePermission(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Update permission - Coming soon"})
}

func (h *RolesHandler) DeletePermission(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Delete permission - Coming soon"})
}

// ============================================================================
// HANDLERS - SPECIAL OPERATIONS
// ============================================================================

// SearchRoles searches roles by name
func (h *RolesHandler) SearchRoles(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	tenantID := r.URL.Query().Get("tenant_id")

	if query == "" {
		respondError(w, http.StatusBadRequest, "Search query required", nil)
		return
	}

	sqlQuery := `
		SELECT _id, name, type, description
		FROM roles
		WHERE name ILIKE $1
	`
	args := []interface{}{"%" + query + "%"}

	if tenantID != "" {
		sqlQuery += " AND tenant_id = $2"
		args = append(args, tenantID)
	}

	sqlQuery += " ORDER BY type, name LIMIT 20"

	rows, err := h.db.Query(sqlQuery, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	roles := []Role{}
	for rows.Next() {
		var role Role
		err := rows.Scan(&role.ID, &role.Name, &role.Type, &role.Description)
		if err != nil {
			continue
		}
		roles = append(roles, role)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":  roles,
		"query": query,
	})
}

// GetStats returns statistics
func (h *RolesHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")

	query := `
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE type = 'SYSTEM') as system,
			COUNT(*) FILTER (WHERE type = 'CUSTOM') as custom
		FROM roles
		WHERE tenant_id = $1
	`

	var stats struct {
		Total  int `json:"total"`
		System int `json:"system"`
		Custom int `json:"custom"`
	}

	err := h.db.QueryRow(query, tenantID).Scan(&stats.Total, &stats.System, &stats.Custom)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

// GetPermissionsTree returns permissions in tree structure
func (h *RolesHandler) GetPermissionsTree(w http.ResponseWriter, r *http.Request) {
	appCode := r.URL.Query().Get("app_code")

	query := `
		SELECT 
			_id, app_code, code, parent_code, path, is_group, name
		FROM permissions
		WHERE app_code = $1
		ORDER BY path, code
	`

	rows, err := h.db.Query(query, appCode)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	permissions := []Permission{}
	for rows.Next() {
		var perm Permission
		err := rows.Scan(&perm.ID, &perm.AppCode, &perm.Code, &perm.ParentCode, &perm.Path, &perm.IsGroup, &perm.Name)
		if err != nil {
			continue
		}
		permissions = append(permissions, perm)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": permissions,
	})
}

// Helper function for nullable strings
func nullString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
