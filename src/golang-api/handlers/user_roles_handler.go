package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

/**
 * User Roles Handler
 * Quản lý vai trò của user (user_roles table)
 * 
 * Features:
 * - CRUD operations cho user roles
 * - Unique constraint: user_id + role_id
 * - Soft delete support
 * - List roles by user_id hoặc role_id
 * 
 * Database Table: user_roles
 * Columns: _id, user_id, role_id, assigned_at, assigned_by, expires_at, is_active, created_at, updated_at, deleted_at
 */

type UserRole struct {
	ID         string     `json:"_id" db:"_id"`
	UserID     string     `json:"user_id" db:"user_id"`
	RoleID     string     `json:"role_id" db:"role_id"`
	AssignedAt time.Time  `json:"assigned_at" db:"assigned_at"`
	AssignedBy *string    `json:"assigned_by" db:"assigned_by"`
	ExpiresAt  *time.Time `json:"expires_at" db:"expires_at"`
	IsActive   bool       `json:"is_active" db:"is_active"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at" db:"deleted_at"`
	
	// Joined fields
	UserEmail    *string `json:"user_email,omitempty" db:"user_email"`
	UserFullName *string `json:"user_full_name,omitempty" db:"user_full_name"`
	RoleName     *string `json:"role_name,omitempty" db:"role_name"`
	RoleSlug     *string `json:"role_slug,omitempty" db:"role_slug"`
}

type UserRoleHandler struct {
	db *sql.DB
}

func NewUserRoleHandler(db *sql.DB) *UserRoleHandler {
	return &UserRoleHandler{db: db}
}

/**
 * GET /api/v1/user-roles
 * Lấy danh sách user roles với filters
 * Query params: user_id, role_id, is_active, limit, offset
 */
func (h *UserRoleHandler) GetAll(c *gin.Context) {
	userID := c.Query("user_id")
	roleID := c.Query("role_id")
	isActive := c.Query("is_active")
	
	query := `
		SELECT 
			ur._id, ur.user_id, ur.role_id, ur.assigned_at, ur.assigned_by, 
			ur.expires_at, ur.is_active, ur.created_at, ur.updated_at,
			u.email as user_email, u.full_name as user_full_name,
			r.name as role_name, r.slug as role_slug
		FROM user_roles ur
		LEFT JOIN users u ON ur.user_id = u._id
		LEFT JOIN roles r ON ur.role_id = r._id
		WHERE ur.deleted_at IS NULL
	`
	args := []interface{}{}
	argCount := 1
	
	if userID != "" {
		query += ` AND ur.user_id = $` + string(rune(argCount+'0'))
		args = append(args, userID)
		argCount++
	}
	if roleID != "" {
		query += ` AND ur.role_id = $` + string(rune(argCount+'0'))
		args = append(args, roleID)
		argCount++
	}
	if isActive != "" {
		query += ` AND ur.is_active = $` + string(rune(argCount+'0'))
		args = append(args, isActive == "true")
		argCount++
	}
	
	query += ` ORDER BY ur.assigned_at DESC`
	
	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user roles: " + err.Error()})
		return
	}
	defer rows.Close()
	
	userRoles := []UserRole{}
	for rows.Next() {
		var ur UserRole
		err := rows.Scan(
			&ur.ID, &ur.UserID, &ur.RoleID, &ur.AssignedAt, &ur.AssignedBy,
			&ur.ExpiresAt, &ur.IsActive, &ur.CreatedAt, &ur.UpdatedAt,
			&ur.UserEmail, &ur.UserFullName, &ur.RoleName, &ur.RoleSlug,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan user role: " + err.Error()})
			return
		}
		userRoles = append(userRoles, ur)
	}
	
	c.JSON(http.StatusOK, userRoles)
}

/**
 * GET /api/v1/user-roles/:id
 * Lấy user role theo ID
 */
func (h *UserRoleHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	
	query := `
		SELECT 
			ur._id, ur.user_id, ur.role_id, ur.assigned_at, ur.assigned_by, 
			ur.expires_at, ur.is_active, ur.created_at, ur.updated_at,
			u.email as user_email, u.full_name as user_full_name,
			r.name as role_name, r.slug as role_slug
		FROM user_roles ur
		LEFT JOIN users u ON ur.user_id = u._id
		LEFT JOIN roles r ON ur.role_id = r._id
		WHERE ur._id = $1 AND ur.deleted_at IS NULL
	`
	
	var ur UserRole
	err := h.db.QueryRow(query, id).Scan(
		&ur.ID, &ur.UserID, &ur.RoleID, &ur.AssignedAt, &ur.AssignedBy,
		&ur.ExpiresAt, &ur.IsActive, &ur.CreatedAt, &ur.UpdatedAt,
		&ur.UserEmail, &ur.UserFullName, &ur.RoleName, &ur.RoleSlug,
	)
	
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User role not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user role: " + err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, ur)
}

/**
 * POST /api/v1/user-roles
 * Tạo user role mới
 * Body: { user_id, role_id, assigned_by?, expires_at?, is_active? }
 */
func (h *UserRoleHandler) Create(c *gin.Context) {
	var req struct {
		UserID     string     `json:"user_id" binding:"required"`
		RoleID     string     `json:"role_id" binding:"required"`
		AssignedBy *string    `json:"assigned_by"`
		ExpiresAt  *time.Time `json:"expires_at"`
		IsActive   *bool      `json:"is_active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	
	// Check duplicate (user_id + role_id)
	var exists bool
	err := h.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2 AND deleted_at IS NULL)",
		req.UserID, req.RoleID,
	).Scan(&exists)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check duplicate: " + err.Error()})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "User already has this role"})
		return
	}
	
	// Default values
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	
	// Generate UUID
	id := uuid.New().String()
	now := time.Now()
	
	query := `
		INSERT INTO user_roles (
			_id, user_id, role_id, assigned_at, assigned_by, 
			expires_at, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, assigned_at, created_at
	`
	
	var ur UserRole
	err = h.db.QueryRow(
		query, id, req.UserID, req.RoleID, now, req.AssignedBy,
		req.ExpiresAt, isActive, now, now,
	).Scan(&ur.ID, &ur.AssignedAt, &ur.CreatedAt)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user role: " + err.Error()})
		return
	}
	
	ur.UserID = req.UserID
	ur.RoleID = req.RoleID
	ur.IsActive = isActive
	
	c.JSON(http.StatusCreated, ur)
}

/**
 * PATCH /api/v1/user-roles/:id
 * Cập nhật user role
 * Body: { is_active?, expires_at?, assigned_by? }
 */
func (h *UserRoleHandler) Update(c *gin.Context) {
	id := c.Param("id")
	
	var req struct {
		IsActive   *bool      `json:"is_active"`
		ExpiresAt  *time.Time `json:"expires_at"`
		AssignedBy *string    `json:"assigned_by"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	
	// Check exists
	var exists bool
	err := h.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM user_roles WHERE _id = $1 AND deleted_at IS NULL)",
		id,
	).Scan(&exists)
	
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User role not found"})
		return
	}
	
	// Build dynamic update query
	query := "UPDATE user_roles SET updated_at = NOW()"
	args := []interface{}{}
	argCount := 1
	
	if req.IsActive != nil {
		argCount++
		query += `, is_active = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.IsActive)
	}
	if req.ExpiresAt != nil {
		argCount++
		query += `, expires_at = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.ExpiresAt)
	}
	if req.AssignedBy != nil {
		argCount++
		query += `, assigned_by = $` + string(rune(argCount+'0'-1))
		args = append(args, *req.AssignedBy)
	}
	
	args = append(args, id)
	query += ` WHERE _id = $` + string(rune(argCount+'0')) + ` AND deleted_at IS NULL RETURNING updated_at`
	
	var updatedAt time.Time
	err = h.db.QueryRow(query, args...).Scan(&updatedAt)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role: " + err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":    "User role updated successfully",
		"updated_at": updatedAt,
	})
}

/**
 * DELETE /api/v1/user-roles/:id
 * Xóa user role (soft delete)
 */
func (h *UserRoleHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	
	query := `UPDATE user_roles SET deleted_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	
	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user role: " + err.Error()})
		return
	}
	
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User role not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "User role deleted successfully"})
}

/**
 * POST /api/v1/user-roles/bulk-assign
 * Gán nhiều roles cho 1 user
 * Body: { user_id, role_ids: [], assigned_by? }
 */
func (h *UserRoleHandler) BulkAssign(c *gin.Context) {
	var req struct {
		UserID     string   `json:"user_id" binding:"required"`
		RoleIDs    []string `json:"role_ids" binding:"required"`
		AssignedBy *string  `json:"assigned_by"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	
	created := 0
	skipped := 0
	
	for _, roleID := range req.RoleIDs {
		// Check duplicate
		var exists bool
		h.db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2 AND deleted_at IS NULL)",
			req.UserID, roleID,
		).Scan(&exists)
		
		if exists {
			skipped++
			continue
		}
		
		// Insert
		id := uuid.New().String()
		now := time.Now()
		
		_, err := h.db.Exec(
			`INSERT INTO user_roles (_id, user_id, role_id, assigned_at, assigned_by, is_active, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			id, req.UserID, roleID, now, req.AssignedBy, true, now, now,
		)
		
		if err == nil {
			created++
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Bulk assign completed",
		"created": created,
		"skipped": skipped,
	})
}
