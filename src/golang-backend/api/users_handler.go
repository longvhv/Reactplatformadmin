package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// ============================================================================
// MODELS - User Management
// ============================================================================

// User represents a system user
type User struct {
	// I. ĐỊNH DANH (IDENTITY)
	ID           string  `json:"_id" db:"_id"`
	Email        string  `json:"email" db:"email"`
	PasswordHash *string `json:"-" db:"password_hash"` // Hidden from JSON
	FullName     string  `json:"full_name" db:"full_name"`
	AvatarURL    *string `json:"avatar_url,omitempty" db:"avatar_url"`
	PhoneNumber  *string `json:"phone_number,omitempty" db:"phone_number"`

	// II. TRẠNG THÁI & BẢO MẬT (SECURITY)
	Status         string `json:"status" db:"status"`
	IsSupportStaff bool   `json:"is_support_staff" db:"is_support_staff"`
	MFAEnabled     bool   `json:"mfa_enabled" db:"mfa_enabled"`
	MFASecret      *string `json:"-" db:"mfa_secret"` // Hidden
	IsVerified     bool   `json:"is_verified" db:"is_verified"`

	// III. CẤU HÌNH & THÔNG TIN THÊM
	Locale   string                 `json:"locale" db:"locale"`
	Metadata map[string]interface{} `json:"metadata" db:"metadata"`

	// IV. TRUY VẾT (AUDIT)
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// CreateUserRequest represents request body for creating a user
type CreateUserRequest struct {
	Email       string                 `json:"email" validate:"required,email"`
	Password    string                 `json:"password" validate:"required,min=8"`
	FullName    string                 `json:"full_name" validate:"required,min=1"`
	AvatarURL   *string                `json:"avatar_url,omitempty"`
	PhoneNumber *string                `json:"phone_number,omitempty"`
	Locale      string                 `json:"locale,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateUserRequest represents request body for updating a user
type UpdateUserRequest struct {
	FullName       *string                `json:"full_name,omitempty"`
	AvatarURL      *string                `json:"avatar_url,omitempty"`
	PhoneNumber    *string                `json:"phone_number,omitempty"`
	Status         *string                `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE BANNED DISABLED PENDING"`
	IsSupportStaff *bool                  `json:"is_support_staff,omitempty"`
	IsVerified     *bool                  `json:"is_verified,omitempty"`
	Locale         *string                `json:"locale,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// ChangePasswordRequest represents password change request
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// BulkActionRequest represents bulk operation request
type BulkActionRequest struct {
	UserIDs []string `json:"user_ids" validate:"required,min=1"`
	Action  string   `json:"action" validate:"required,oneof=delete disable enable verify"`
}

// UsersHandler handles user-related HTTP requests
type UsersHandler struct {
	db *sql.DB
}

// NewUsersHandler creates a new users handler
func NewUsersHandler(db *sql.DB) *UsersHandler {
	return &UsersHandler{db: db}
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// RegisterRoutes registers user API routes
func (h *UsersHandler) RegisterRoutes(r *mux.Router) {
	// CRUD
	r.HandleFunc("/api/users", h.ListUsers).Methods("GET")
	r.HandleFunc("/api/users/{id}", h.GetUser).Methods("GET")
	r.HandleFunc("/api/users", h.CreateUser).Methods("POST")
	r.HandleFunc("/api/users/{id}", h.UpdateUser).Methods("PUT", "PATCH")
	r.HandleFunc("/api/users/{id}", h.DeleteUser).Methods("DELETE")

	// Special operations
	r.HandleFunc("/api/users/{id}/password", h.ChangePassword).Methods("PATCH")
	r.HandleFunc("/api/users/{id}/verify", h.VerifyUser).Methods("POST")
	r.HandleFunc("/api/users/{id}/mfa", h.ToggleMFA).Methods("PATCH")
	r.HandleFunc("/api/users/search", h.SearchUsers).Methods("GET")
	r.HandleFunc("/api/users/bulk", h.BulkAction).Methods("POST")
	r.HandleFunc("/api/users/email/{email}", h.GetUserByEmail).Methods("GET")
}

// ============================================================================
// HANDLERS
// ============================================================================

// ListUsers returns all users with pagination and filtering
func (h *UsersHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	// Query parameters
	status := r.URL.Query().Get("status")
	verified := r.URL.Query().Get("verified")
	mfa := r.URL.Query().Get("mfa")
	support := r.URL.Query().Get("support_staff")
	page := getIntQueryParam(r, "page", 1)
	limit := getIntQueryParam(r, "limit", 20)
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT 
			_id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata,
			created_at, updated_at, deleted_at
		FROM users
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, strings.ToUpper(status))
		argIdx++
	}
	if verified == "true" {
		query += " AND is_verified = true"
	} else if verified == "false" {
		query += " AND is_verified = false"
	}
	if mfa == "true" {
		query += " AND mfa_enabled = true"
	} else if mfa == "false" {
		query += " AND mfa_enabled = false"
	}
	if support == "true" {
		query += " AND is_support_staff = true"
	}

	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var u User
		var metadataJSON []byte

		err := rows.Scan(
			&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
			&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
			&u.Locale, &metadataJSON,
			&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Scan error", err)
			return
		}

		json.Unmarshal(metadataJSON, &u.Metadata)
		users = append(users, u)
	}

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
	h.db.QueryRow(countQuery).Scan(&total)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data": users,
		"meta": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetUser returns a specific user by ID
func (h *UsersHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(userID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	query := `
		SELECT 
			_id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata,
			created_at, updated_at, deleted_at
		FROM users
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var u User
	var metadataJSON []byte

	err := h.db.QueryRow(query, userID).Scan(
		&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
		&u.Locale, &metadataJSON,
		&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "User not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(metadataJSON, &u.Metadata)

	respondJSON(w, http.StatusOK, u)
}

// GetUserByEmail returns a user by email
func (h *UsersHandler) GetUserByEmail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	email := vars["email"]

	query := `
		SELECT 
			_id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata,
			created_at, updated_at, deleted_at
		FROM users
		WHERE email = $1 AND deleted_at IS NULL
	`

	var u User
	var metadataJSON []byte

	err := h.db.QueryRow(query, email).Scan(
		&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
		&u.Locale, &metadataJSON,
		&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "User not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(metadataJSON, &u.Metadata)

	respondJSON(w, http.StatusOK, u)
}

// CreateUser creates a new user
func (h *UsersHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Validate email format
	emailRegex := regexp.MustCompile(`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		respondError(w, http.StatusBadRequest, "Invalid email format", nil)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Password hashing error", err)
		return
	}

	// Set defaults
	if req.Locale == "" {
		req.Locale = "vi-VN"
	}
	if req.Metadata == nil {
		req.Metadata = make(map[string]interface{})
	}

	// Encode metadata
	metadataJSON, _ := json.Marshal(req.Metadata)

	// Generate UUID
	userID := uuid.New().String()

	// Insert
	query := `
		INSERT INTO users (
			_id, email, password_hash, full_name, avatar_url, phone_number,
			locale, metadata, status, is_verified
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', false
		)
		RETURNING _id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata, created_at, updated_at
	`

	var u User
	var returnedMetadataJSON []byte

	err = h.db.QueryRow(
		query,
		userID, req.Email, string(hashedPassword), req.FullName, req.AvatarURL,
		req.PhoneNumber, req.Locale, metadataJSON,
	).Scan(
		&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
		&u.Locale, &returnedMetadataJSON,
		&u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique violation
				respondError(w, http.StatusConflict, "Email already exists", err)
				return
			}
		}
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(returnedMetadataJSON, &u.Metadata)

	respondJSON(w, http.StatusCreated, u)
}

// UpdateUser updates user information
func (h *UsersHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(userID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Build dynamic UPDATE query
	updates := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.FullName != nil {
		updates = append(updates, fmt.Sprintf("full_name = $%d", argIdx))
		args = append(args, *req.FullName)
		argIdx++
	}
	if req.AvatarURL != nil {
		updates = append(updates, fmt.Sprintf("avatar_url = $%d", argIdx))
		args = append(args, *req.AvatarURL)
		argIdx++
	}
	if req.PhoneNumber != nil {
		updates = append(updates, fmt.Sprintf("phone_number = $%d", argIdx))
		args = append(args, *req.PhoneNumber)
		argIdx++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, strings.ToUpper(*req.Status))
		argIdx++
	}
	if req.IsSupportStaff != nil {
		updates = append(updates, fmt.Sprintf("is_support_staff = $%d", argIdx))
		args = append(args, *req.IsSupportStaff)
		argIdx++
	}
	if req.IsVerified != nil {
		updates = append(updates, fmt.Sprintf("is_verified = $%d", argIdx))
		args = append(args, *req.IsVerified)
		argIdx++
	}
	if req.Locale != nil {
		updates = append(updates, fmt.Sprintf("locale = $%d", argIdx))
		args = append(args, *req.Locale)
		argIdx++
	}
	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(req.Metadata)
		updates = append(updates, fmt.Sprintf("metadata = $%d", argIdx))
		args = append(args, metadataJSON)
		argIdx++
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update", nil)
		return
	}

	// Add user ID
	args = append(args, userID)

	query := fmt.Sprintf(`
		UPDATE users 
		SET %s, updated_at = NOW()
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata, created_at, updated_at
	`, strings.Join(updates, ", "), argIdx)

	var u User
	var metadataJSON []byte

	err := h.db.QueryRow(query, args...).Scan(
		&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
		&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
		&u.Locale, &metadataJSON,
		&u.CreatedAt, &u.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "User not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	json.Unmarshal(metadataJSON, &u.Metadata)

	respondJSON(w, http.StatusOK, u)
}

// DeleteUser soft-deletes a user
func (h *UsersHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	// Validate UUID
	if _, err := uuid.Parse(userID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	query := `
		UPDATE users 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var id string
	err := h.db.QueryRow(query, userID).Scan(&id)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "User not found", nil)
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "User deleted successfully",
		"id":      id,
	})
}

// SearchUsers performs fuzzy search using trigram
func (h *UsersHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		respondError(w, http.StatusBadRequest, "Search query required", nil)
		return
	}

	limit := getIntQueryParam(r, "limit", 10)

	// Trigram search
	sqlQuery := `
		SELECT 
			_id, email, full_name, avatar_url, phone_number,
			status, is_support_staff, mfa_enabled, is_verified,
			locale, metadata, created_at, updated_at
		FROM users
		WHERE deleted_at IS NULL
			AND (
				full_name ILIKE $1 OR
				email ILIKE $1 OR
				phone_number ILIKE $1
			)
		ORDER BY 
			CASE 
				WHEN full_name ILIKE $2 THEN 1
				WHEN email ILIKE $2 THEN 2
				ELSE 3
			END,
			created_at DESC
		LIMIT $3
	`

	rows, err := h.db.Query(sqlQuery, "%"+query+"%", query+"%", limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error", err)
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var u User
		var metadataJSON []byte

		err := rows.Scan(
			&u.ID, &u.Email, &u.FullName, &u.AvatarURL, &u.PhoneNumber,
			&u.Status, &u.IsSupportStaff, &u.MFAEnabled, &u.IsVerified,
			&u.Locale, &metadataJSON, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(metadataJSON, &u.Metadata)
		users = append(users, u)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":  users,
		"query": query,
	})
}

// ChangePassword changes user password
func (h *UsersHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	// Get current password hash
	var currentHash string
	err := h.db.QueryRow(`
		SELECT password_hash FROM users WHERE _id = $1 AND deleted_at IS NULL
	`, userID).Scan(&currentHash)

	if err != nil {
		respondError(w, http.StatusNotFound, "User not found", err)
		return
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.OldPassword)); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid old password", nil)
		return
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Password hashing error", err)
		return
	}

	// Update
	_, err = h.db.Exec(`
		UPDATE users 
		SET password_hash = $1, updated_at = NOW()
		WHERE _id = $2
	`, string(newHash), userID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Update failed", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Password changed successfully",
	})
}

// VerifyUser verifies a user email
func (h *UsersHandler) VerifyUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	_, err := h.db.Exec(`
		UPDATE users 
		SET is_verified = true, updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`, userID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Verification failed", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "User verified successfully",
	})
}

// ToggleMFA toggles MFA for user
func (h *UsersHandler) ToggleMFA(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	_, err := h.db.Exec(`
		UPDATE users 
		SET mfa_enabled = $1, updated_at = NOW()
		WHERE _id = $2 AND deleted_at IS NULL
	`, req.Enabled, userID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Update failed", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":     "MFA updated successfully",
		"mfa_enabled": req.Enabled,
	})
}

// BulkAction performs bulk operations on users
func (h *UsersHandler) BulkAction(w http.ResponseWriter, r *http.Request) {
	var req BulkActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if len(req.UserIDs) == 0 {
		respondError(w, http.StatusBadRequest, "No user IDs provided", nil)
		return
	}

	var query string
	var args []interface{}

	switch req.Action {
	case "delete":
		query = `UPDATE users SET deleted_at = NOW() WHERE _id = ANY($1)`
		args = []interface{}{pq.Array(req.UserIDs)}
	case "disable":
		query = `UPDATE users SET status = 'DISABLED' WHERE _id = ANY($1)`
		args = []interface{}{pq.Array(req.UserIDs)}
	case "enable":
		query = `UPDATE users SET status = 'ACTIVE' WHERE _id = ANY($1)`
		args = []interface{}{pq.Array(req.UserIDs)}
	case "verify":
		query = `UPDATE users SET is_verified = true WHERE _id = ANY($1)`
		args = []interface{}{pq.Array(req.UserIDs)}
	default:
		respondError(w, http.StatusBadRequest, "Invalid action", nil)
		return
	}

	result, err := h.db.Exec(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Bulk action failed", err)
		return
	}

	affected, _ := result.RowsAffected()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":  fmt.Sprintf("Bulk %s completed", req.Action),
		"affected": affected,
	})
}
