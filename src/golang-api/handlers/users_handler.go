// Package handlers provides HTTP handlers for user management operations
package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	db *sql.DB
}

// NewUserHandler creates a new UserHandler instance
func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{db: db}
}

// User represents a user entity
type User struct {
	ID             string         `json:"_id"`
	Email          string         `json:"email"`
	PasswordHash   *string        `json:"-"` // Never expose password hash
	FullName       string         `json:"full_name"`
	AvatarURL      *string        `json:"avatar_url,omitempty"`
	PhoneNumber    *string        `json:"phone_number,omitempty"`
	Status         string         `json:"status"`
	IsSupportStaff bool           `json:"is_support_staff"`
	MFAEnabled     bool           `json:"mfa_enabled"`
	MFASecret      *string        `json:"-"` // Never expose MFA secret
	IsVerified     bool           `json:"is_verified"`
	Locale         string         `json:"locale"`
	Metadata       map[string]any `json:"metadata"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      *time.Time     `json:"deleted_at,omitempty"`
}

// CreateUserRequest represents the request body for creating a user
type CreateUserRequest struct {
	Email       string         `json:"email" binding:"required,email"`
	Password    string         `json:"password" binding:"required,min=8"`
	FullName    string         `json:"full_name" binding:"required"`
	AvatarURL   *string        `json:"avatar_url,omitempty"`
	PhoneNumber *string        `json:"phone_number,omitempty"`
	Locale      string         `json:"locale,omitempty"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	FullName    *string        `json:"full_name,omitempty"`
	AvatarURL   *string        `json:"avatar_url,omitempty"`
	PhoneNumber *string        `json:"phone_number,omitempty"`
	Locale      *string        `json:"locale,omitempty"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

// UpdateUserStatusRequest represents the request body for updating user status
type UpdateUserStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=ACTIVE BANNED DISABLED PENDING"`
}

// GetAll retrieves all users with optional filtering
// @Summary List users
// @Description Get list of users with optional filters
// @Tags users
// @Accept json
// @Produce json
// @Param status query string false "Filter by status" Enums(ACTIVE, BANNED, DISABLED, PENDING)
// @Param locale query string false "Filter by locale"
// @Param search query string false "Search by email or full name"
// @Param is_verified query boolean false "Filter by verification status"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} User
// @Failure 500 {object} map[string]string
// @Router /users [get]
func (h *UserHandler) GetAll(c *gin.Context) {
	// Parse query parameters
	status := c.Query("status")
	locale := c.Query("locale")
	search := c.Query("search")
	isVerified := c.Query("is_verified")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	// Build query
	query := `
		SELECT _id, email, full_name, avatar_url, phone_number, status,
		       is_support_staff, mfa_enabled, is_verified, locale, metadata,
		       created_at, updated_at, deleted_at
		FROM users
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argCount := 1

	// Apply filters
	if status != "" {
		query += ` AND status = $` + string(rune(argCount+48))
		args = append(args, status)
		argCount++
	}

	if locale != "" {
		query += ` AND locale = $` + string(rune(argCount+48))
		args = append(args, locale)
		argCount++
	}

	if isVerified != "" {
		query += ` AND is_verified = $` + string(rune(argCount+48))
		args = append(args, isVerified == "true")
		argCount++
	}

	if search != "" {
		query += ` AND (LOWER(email) LIKE $` + string(rune(argCount+48)) +
			` OR LOWER(full_name) LIKE $` + string(rune(argCount+48)) + `)`
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern)
		argCount++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + string(rune(argCount+48)) +
		` OFFSET $` + string(rune(argCount+49))
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	// Parse results
	users := []User{}
	for rows.Next() {
		var user User
		var metadata []byte

		err := rows.Scan(
			&user.ID, &user.Email, &user.FullName, &user.AvatarURL,
			&user.PhoneNumber, &user.Status, &user.IsSupportStaff,
			&user.MFAEnabled, &user.IsVerified, &user.Locale, &metadata,
			&user.CreatedAt, &user.UpdatedAt, &user.DeletedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse user data: " + err.Error(),
			})
			return
		}

		// Parse JSONB metadata
		if len(metadata) > 0 {
			// In production, use proper JSON parsing
			user.Metadata = map[string]any{}
		}

		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

// GetByID retrieves a user by ID
// @Summary Get user by ID
// @Description Get detailed information about a specific user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {object} User
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id} [get]
func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	var user User
	var metadata []byte

	query := `
		SELECT _id, email, full_name, avatar_url, phone_number, status,
		       is_support_staff, mfa_enabled, is_verified, locale, metadata,
		       created_at, updated_at, deleted_at
		FROM users
		WHERE _id = $1 AND deleted_at IS NULL
	`

	err := h.db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.FullName, &user.AvatarURL,
		&user.PhoneNumber, &user.Status, &user.IsSupportStaff,
		&user.MFAEnabled, &user.IsVerified, &user.Locale, &metadata,
		&user.CreatedAt, &user.UpdatedAt, &user.DeletedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user: " + err.Error(),
		})
		return
	}

	// Parse JSONB metadata
	if len(metadata) > 0 {
		user.Metadata = map[string]any{}
	}

	c.JSON(http.StatusOK, user)
}

// Create creates a new user
// @Summary Create new user
// @Description Create a new user account
// @Tags users
// @Accept json
// @Produce json
// @Param user body CreateUserRequest true "User data"
// @Success 201 {object} User
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users [post]
func (h *UserHandler) Create(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Generate UUID
	userID := uuid.New().String()

	// Hash password (in production, use bcrypt/argon2)
	passwordHash := hashPassword(req.Password)

	// Set defaults
	if req.Locale == "" {
		req.Locale = "vi-VN"
	}
	if req.Metadata == nil {
		req.Metadata = map[string]any{}
	}

	// Insert user
	query := `
		INSERT INTO users (
			_id, email, password_hash, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified, locale, metadata
		) VALUES (
			$1, $2, $3, $4, $5, $6, 'PENDING', false, false, false, $7, $8
		)
		RETURNING _id, email, full_name, avatar_url, phone_number, status,
		          is_support_staff, mfa_enabled, is_verified, locale, metadata,
		          created_at, updated_at
	`

	var user User
	var metadata []byte

	err := h.db.QueryRow(
		query, userID, req.Email, passwordHash, req.FullName,
		req.AvatarURL, req.PhoneNumber, req.Locale, "{}",
	).Scan(
		&user.ID, &user.Email, &user.FullName, &user.AvatarURL,
		&user.PhoneNumber, &user.Status, &user.IsSupportStaff,
		&user.MFAEnabled, &user.IsVerified, &user.Locale, &metadata,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if isDuplicateKeyError(err) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "User with this email already exists",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user: " + err.Error(),
		})
		return
	}

	user.Metadata = req.Metadata

	c.JSON(http.StatusCreated, user)
}

// Update updates an existing user
// @Summary Update user
// @Description Update user information
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param user body UpdateUserRequest true "Update data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id} [patch]
func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Build dynamic update query
	query := `UPDATE users SET updated_at = NOW()`
	args := []interface{}{}
	argCount := 1

	if req.FullName != nil {
		query += `, full_name = $` + string(rune(argCount+48))
		args = append(args, *req.FullName)
		argCount++
	}

	if req.AvatarURL != nil {
		query += `, avatar_url = $` + string(rune(argCount+48))
		args = append(args, *req.AvatarURL)
		argCount++
	}

	if req.PhoneNumber != nil {
		query += `, phone_number = $` + string(rune(argCount+48))
		args = append(args, *req.PhoneNumber)
		argCount++
	}

	if req.Locale != nil {
		query += `, locale = $` + string(rune(argCount+48))
		args = append(args, *req.Locale)
		argCount++
	}

	query += ` WHERE _id = $` + string(rune(argCount+48)) +
		` AND deleted_at IS NULL RETURNING updated_at`
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "User updated successfully",
		"updated_at": updatedAt,
	})
}

// UpdateStatus updates user status
// @Summary Update user status
// @Description Update user account status
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param status body UpdateUserStatusRequest true "Status data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id}/status [patch]
func (h *UserHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req UpdateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	query := `
		UPDATE users 
		SET status = $1, updated_at = NOW()
		WHERE _id = $2 AND deleted_at IS NULL
		RETURNING status, updated_at
	`

	var status string
	var updatedAt time.Time

	err := h.db.QueryRow(query, req.Status, id).Scan(&status, &updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update status: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "User status updated successfully",
		"status":     status,
		"updated_at": updatedAt,
	})
}

// Delete soft deletes a user
// @Summary Delete user
// @Description Soft delete a user (set deleted_at timestamp)
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id} [delete]
func (h *UserHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	query := `
		UPDATE users 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete user: " + err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

// Helper functions

func hashPassword(password string) string {
	// In production, use bcrypt or argon2id
	// This is just a placeholder
	return "hashed_" + password
}

func isDuplicateKeyError(err error) bool {
	// Check for PostgreSQL duplicate key error
	// This is a simplified check
	return err != nil && (err.Error() == "duplicate key value")
}
