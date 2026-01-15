/**
 * Roles API Handler
 * Handles role management with permission assignments
 */

package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type RolesHandler struct {
	db *sql.DB
}

func NewRolesHandler(db *sql.DB) *RolesHandler {
	return &RolesHandler{db: db}
}

// ==================== TYPES ====================

type Role struct {
	ID              string    `json:"_id"`
	TenantID        string    `json:"tenant_id"`
	Name            string    `json:"name"`
	Description     *string   `json:"description,omitempty"`
	Type            string    `json:"type"`
	PermissionCodes []string  `json:"permission_codes"`
	Version         int64     `json:"version"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type RoleWithDetails struct {
	Role
	TenantName      string `json:"tenant_name"`
	MemberCount     int    `json:"member_count"`
	PermissionCount int    `json:"permission_count"`
}

type CreateRoleRequest struct {
	TenantID        string   `json:"tenant_id" binding:"required"`
	Name            string   `json:"name" binding:"required"`
	Description     *string  `json:"description"`
	Type            *string  `json:"type"`
	PermissionCodes []string `json:"permission_codes"`
}

type UpdateRoleRequest struct {
	Name            *string  `json:"name"`
	Description     *string  `json:"description"`
	PermissionCodes []string `json:"permission_codes"`
}

type AssignPermissionsRequest struct {
	PermissionCodes []string `json:"permission_codes" binding:"required"`
}

type RoleMember struct {
	ID          string    `json:"_id"`
	MemberID    string    `json:"member_id"`
	MemberName  string    `json:"member_name"`
	MemberEmail string    `json:"member_email"`
	ScopeType   string    `json:"scope_type"`
	ScopeValues []string  `json:"scope_values"`
	AssignedBy  *string   `json:"assigned_by,omitempty"`
	AssignedAt  time.Time `json:"assigned_at"`
}

// ==================== HANDLERS ====================

// GetAll godoc
// @Summary List roles
// @Description Get list of roles with filtering
// @Tags roles
// @Accept json
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param type query string false "Filter by type (SYSTEM/CUSTOM)"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} Role
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles [get]
func (h *RolesHandler) GetAll(c *gin.Context) {
	tenantID := c.Query("tenant_id")
	roleType := c.Query("type")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT _id, tenant_id, name, description, type, permission_codes,
		       version, created_at, updated_at
		FROM roles
		WHERE 1=1
	`
	args := []interface{}{}
	argPos := 1

	if tenantID != "" {
		query += ` AND tenant_id = $` + fmt.Sprint(argPos)
		args = append(args, tenantID)
		argPos++
	}

	if roleType != "" {
		query += ` AND type = $` + fmt.Sprint(argPos)
		args = append(args, roleType)
		argPos++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprint(argPos) +
		` OFFSET $` + fmt.Sprint(argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch roles: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	roles := []Role{}
	for rows.Next() {
		var r Role
		err := rows.Scan(
			&r.ID, &r.TenantID, &r.Name, &r.Description, &r.Type,
			pq.Array(&r.PermissionCodes), &r.Version,
			&r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			continue
		}
		roles = append(roles, r)
	}

	c.JSON(http.StatusOK, roles)
}

// GetByID godoc
// @Summary Get role by ID
// @Description Get a single role by ID
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Success 200 {object} Role
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles/{id} [get]
func (h *RolesHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID format",
		})
		return
	}

	query := `
		SELECT _id, tenant_id, name, description, type, permission_codes,
		       version, created_at, updated_at
		FROM roles
		WHERE _id = $1
	`

	var r Role
	err := h.db.QueryRow(query, id).Scan(
		&r.ID, &r.TenantID, &r.Name, &r.Description, &r.Type,
		pq.Array(&r.PermissionCodes), &r.Version,
		&r.CreatedAt, &r.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch role: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, r)
}

// GetWithDetails godoc
// @Summary Get role with details
// @Description Get role with tenant info and member count
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Success 200 {object} RoleWithDetails
// @Failure 404 {object} ErrorResponse
// @Router /roles/{id}/details [get]
func (h *RolesHandler) GetWithDetails(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID format",
		})
		return
	}

	query := `
		SELECT 
			r._id, r.tenant_id, r.name, r.description, r.type,
			r.permission_codes, r.version, r.created_at, r.updated_at,
			t.name as tenant_name,
			COALESCE(COUNT(DISTINCT ur.member_id), 0) as member_count,
			COALESCE(array_length(r.permission_codes, 1), 0) as permission_count
		FROM roles r
		JOIN tenants t ON r.tenant_id = t._id
		LEFT JOIN user_roles ur ON ur.role_id = r._id
		WHERE r._id = $1
		GROUP BY r._id, r.tenant_id, r.name, r.description, r.type,
		         r.permission_codes, r.version, r.created_at, r.updated_at, t.name
	`

	var rd RoleWithDetails
	err := h.db.QueryRow(query, id).Scan(
		&rd.ID, &rd.TenantID, &rd.Name, &rd.Description, &rd.Type,
		pq.Array(&rd.PermissionCodes), &rd.Version,
		&rd.CreatedAt, &rd.UpdatedAt,
		&rd.TenantName, &rd.MemberCount, &rd.PermissionCount,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch role details: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, rd)
}

// Create godoc
// @Summary Create role
// @Description Create a new role
// @Tags roles
// @Accept json
// @Produce json
// @Param role body CreateRoleRequest true "Role data"
// @Success 201 {object} Role
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles [post]
func (h *RolesHandler) Create(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Check tenant exists
	var tenantExists bool
	err := h.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM tenants WHERE _id = $1)`,
		req.TenantID,
	).Scan(&tenantExists)

	if err != nil || !tenantExists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tenant not found",
		})
		return
	}

	// Check for duplicate name in tenant
	var nameExists bool
	err = h.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM roles WHERE tenant_id = $1 AND name = $2)`,
		req.TenantID, req.Name,
	).Scan(&nameExists)

	if err == nil && nameExists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Role name already exists in this tenant",
		})
		return
	}

	roleType := "CUSTOM"
	if req.Type != nil {
		roleType = *req.Type
	}

	id := uuid.New().String()

	insertQuery := `
		INSERT INTO roles (
			_id, tenant_id, name, description, type, permission_codes
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING _id, tenant_id, name, description, type, permission_codes,
		          version, created_at, updated_at
	`

	var r Role
	err = h.db.QueryRow(
		insertQuery,
		id, req.TenantID, req.Name, req.Description, roleType,
		pq.Array(req.PermissionCodes),
	).Scan(
		&r.ID, &r.TenantID, &r.Name, &r.Description, &r.Type,
		pq.Array(&r.PermissionCodes), &r.Version,
		&r.CreatedAt, &r.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create role: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, r)
}

// Update godoc
// @Summary Update role
// @Description Update an existing role
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Param role body UpdateRoleRequest true "Role data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles/{id} [patch]
func (h *RolesHandler) Update(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID format",
		})
		return
	}

	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argPos))
		args = append(args, *req.Name)
		argPos++
	}

	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argPos))
		args = append(args, *req.Description)
		argPos++
	}

	if req.PermissionCodes != nil {
		updates = append(updates, fmt.Sprintf("permission_codes = $%d", argPos))
		args = append(args, pq.Array(req.PermissionCodes))
		argPos++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No fields to update",
		})
		return
	}

	updates = append(updates, "updated_at = NOW()")
	updates = append(updates, "version = version + 1")

	query := fmt.Sprintf(
		"UPDATE roles SET %s WHERE _id = $%d RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update role: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Role updated successfully",
		"updated_at": updatedAt,
	})
}

// Delete godoc
// @Summary Delete role
// @Description Delete a role
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles/{id} [delete]
func (h *RolesHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID format",
		})
		return
	}

	// Check if role is SYSTEM type
	var roleType string
	err := h.db.QueryRow(`SELECT type FROM roles WHERE _id = $1`, id).Scan(&roleType)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	if roleType == "SYSTEM" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete system role",
		})
		return
	}

	query := `DELETE FROM roles WHERE _id = $1 RETURNING _id`

	var deletedID string
	err = h.db.QueryRow(query, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete role: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role deleted successfully",
	})
}

// AssignPermissions godoc
// @Summary Assign permissions to role
// @Description Replace all permissions for a role
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Param permissions body AssignPermissionsRequest true "Permission codes"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Router /roles/{id}/permissions [post]
func (h *RolesHandler) AssignPermissions(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID format",
		})
		return
	}

	var req AssignPermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	query := `
		UPDATE roles 
		SET permission_codes = $1, 
		    updated_at = NOW(),
		    version = version + 1
		WHERE _id = $2
		RETURNING updated_at
	`

	var updatedAt time.Time
	err := h.db.QueryRow(query, pq.Array(req.PermissionCodes), id).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to assign permissions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Permissions assigned successfully",
		"permission_count": len(req.PermissionCodes),
		"updated_at":       updatedAt,
	})
}

// GetMembers godoc
// @Summary Get role members
// @Description Get list of members assigned to this role
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Success 200 {array} RoleMember
// @Failure 404 {object} ErrorResponse
// @Router /roles/{id}/members [get]
func (h *RolesHandler) GetMembers(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID format",
		})
		return
	}

	query := `
		SELECT 
			ur._id, ur.member_id, ur.scope_type, ur.scope_values,
			ur.assigned_by, ur.assigned_at,
			u.name as member_name, u.email as member_email
		FROM user_roles ur
		JOIN users u ON ur.member_id = u._id
		WHERE ur.role_id = $1
		ORDER BY ur.assigned_at DESC
	`

	rows, err := h.db.Query(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch role members: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	members := []RoleMember{}
	for rows.Next() {
		var m RoleMember
		err := rows.Scan(
			&m.ID, &m.MemberID, &m.ScopeType,
			pq.Array(&m.ScopeValues), &m.AssignedBy, &m.AssignedAt,
			&m.MemberName, &m.MemberEmail,
		)
		if err != nil {
			continue
		}
		members = append(members, m)
	}

	c.JSON(http.StatusOK, members)
}

// SearchByPermission godoc
// @Summary Search roles by permission
// @Description Find roles that contain a specific permission code
// @Tags roles
// @Accept json
// @Produce json
// @Param permission_code query string true "Permission code"
// @Param tenant_id query string false "Filter by tenant"
// @Success 200 {array} Role
// @Failure 400 {object} ErrorResponse
// @Router /roles/search-by-permission [get]
func (h *RolesHandler) SearchByPermission(c *gin.Context) {
	permissionCode := c.Query("permission_code")
	tenantID := c.Query("tenant_id")

	if permissionCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "permission_code is required",
		})
		return
	}

	query := `
		SELECT _id, tenant_id, name, description, type, permission_codes,
		       version, created_at, updated_at
		FROM roles
		WHERE $1 = ANY(permission_codes)
	`

	args := []interface{}{permissionCode}
	if tenantID != "" {
		query += ` AND tenant_id = $2`
		args = append(args, tenantID)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to search roles: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	roles := []Role{}
	for rows.Next() {
		var r Role
		err := rows.Scan(
			&r.ID, &r.TenantID, &r.Name, &r.Description, &r.Type,
			pq.Array(&r.PermissionCodes), &r.Version,
			&r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			continue
		}
		roles = append(roles, r)
	}

	c.JSON(http.StatusOK, roles)
}
