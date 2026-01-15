// Package handlers provides HTTP handlers for user detail operations
package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// UserDetailsHandler handles user detail-related HTTP requests
type UserDetailsHandler struct {
	db *sql.DB
}

// NewUserDetailsHandler creates a new UserDetailsHandler instance
func NewUserDetailsHandler(db *sql.DB) *UserDetailsHandler {
	return &UserDetailsHandler{db: db}
}

// UserStats represents comprehensive user statistics
type UserStats struct {
	UserID      string    `json:"user_id"`
	Email       string    `json:"email"`
	FullName    string    `json:"full_name"`
	Status      string    `json:"status"`
	IsVerified  bool      `json:"is_verified"`
	MFAEnabled  bool      `json:"mfa_enabled"`
	CreatedAt   time.Time `json:"created_at"`

	// Tenants & Organizations
	TenantsCount       int `json:"tenants_count"`
	ActiveMemberships  int `json:"active_memberships"`
	PrimaryTenantCount int `json:"primary_tenant_count"`

	// Roles & Permissions
	RolesCount       int `json:"roles_count"`
	GroupsCount      int `json:"groups_count"`
	DelegationsCount int `json:"delegations_count"`

	// Activity
	SessionsCount      int        `json:"sessions_count"`
	ActiveSessions     int        `json:"active_sessions"`
	DevicesCount       int        `json:"devices_count"`
	LastLoginAt        *time.Time `json:"last_login_at,omitempty"`
	LastActivityAt     *time.Time `json:"last_activity_at,omitempty"`
	TotalLoginsCount   int        `json:"total_logins_count"`

	// Security
	FailedLoginsCount  int        `json:"failed_logins_count"`
	LastFailedLoginAt  *time.Time `json:"last_failed_login_at,omitempty"`
	PasswordChangedAt  *time.Time `json:"password_changed_at,omitempty"`
}

// UserActivity represents user activity log
type UserActivity struct {
	ID           string    `json:"_id"`
	UserID       string    `json:"user_id"`
	TenantID     *string   `json:"tenant_id,omitempty"`
	Action       string    `json:"action"`
	Resource     string    `json:"resource"`
	ResourceID   *string   `json:"resource_id,omitempty"`
	Details      string    `json:"details"`
	IPAddress    string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	Status       string    `json:"status"`
	EventTime    time.Time `json:"event_time"`
}

// UserTenant represents user's tenant membership
type UserTenant struct {
	TenantID     string    `json:"tenant_id"`
	TenantCode   string    `json:"tenant_code"`
	TenantName   string    `json:"tenant_name"`
	TenantTier   string    `json:"tenant_tier"`
	DisplayName  *string   `json:"display_name,omitempty"`
	Status       string    `json:"status"`
	JoinedAt     time.Time `json:"joined_at"`
	RolesCount   int       `json:"roles_count"`
	IsPrimary    bool      `json:"is_primary"`
}

// UserSession represents user session information
type UserSession struct {
	ID           string     `json:"_id"`
	UserID       string     `json:"user_id"`
	TenantID     *string    `json:"tenant_id,omitempty"`
	DeviceID     *string    `json:"device_id,omitempty"`
	IPAddress    string     `json:"ip_address"`
	UserAgent    string     `json:"user_agent"`
	IsActive     bool       `json:"is_active"`
	LastSeenAt   time.Time  `json:"last_seen_at"`
	ExpiresAt    time.Time  `json:"expires_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

// UserDevice represents user device information
type UserDevice struct {
	ID             string     `json:"_id"`
	UserID         string     `json:"user_id"`
	DeviceName     string     `json:"device_name"`
	DeviceType     string     `json:"device_type"`
	OS             *string    `json:"os,omitempty"`
	Browser        *string    `json:"browser,omitempty"`
	IsTrusted      bool       `json:"is_trusted"`
	LastSeenAt     time.Time  `json:"last_seen_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

// GetStats retrieves comprehensive user statistics
// @Summary Get user statistics
// @Description Get detailed statistics for a specific user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {object} UserStats
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id}/stats [get]
func (h *UserDetailsHandler) GetStats(c *gin.Context) {
	userID := c.Param("id")

	query := `
		SELECT 
			u._id,
			u.email,
			u.full_name,
			u.status,
			u.is_verified,
			u.mfa_enabled,
			u.created_at,
			
			-- Tenants & Organizations
			COUNT(DISTINCT tm._id) as tenants_count,
			COUNT(DISTINCT CASE WHEN tm.status = 'ACTIVE' THEN tm._id END) as active_memberships,
			
			-- Roles & Permissions
			COUNT(DISTINCT ur._id) as roles_count,
			COUNT(DISTINCT gm._id) as groups_count,
			COUNT(DISTINCT ud._id) as delegations_count,
			
			-- Sessions & Devices
			COUNT(DISTINCT us._id) as sessions_count,
			COUNT(DISTINCT CASE WHEN us.is_active THEN us._id END) as active_sessions,
			COUNT(DISTINCT udev._id) as devices_count,
			
			-- Activity
			MAX(us.last_seen_at) as last_activity_at
			
		FROM users u
		LEFT JOIN tenant_members tm ON u._id = tm.user_id AND tm.deleted_at IS NULL
		LEFT JOIN user_roles ur ON u._id = ur.user_id AND ur.deleted_at IS NULL
		LEFT JOIN group_members gm ON tm._id = gm.member_id
		LEFT JOIN user_delegations ud ON u._id = ud.delegator_id AND ud.deleted_at IS NULL
		LEFT JOIN user_sessions us ON u._id = us.user_id
		LEFT JOIN user_devices udev ON u._id = udev.user_id
		WHERE u._id = $1 AND u.deleted_at IS NULL
		GROUP BY u._id, u.email, u.full_name, u.status, u.is_verified, u.mfa_enabled, u.created_at
	`

	var stats UserStats
	err := h.db.QueryRow(query, userID).Scan(
		&stats.UserID,
		&stats.Email,
		&stats.FullName,
		&stats.Status,
		&stats.IsVerified,
		&stats.MFAEnabled,
		&stats.CreatedAt,
		&stats.TenantsCount,
		&stats.ActiveMemberships,
		&stats.RolesCount,
		&stats.GroupsCount,
		&stats.DelegationsCount,
		&stats.SessionsCount,
		&stats.ActiveSessions,
		&stats.DevicesCount,
		&stats.LastActivityAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user stats: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetActivities retrieves user activity logs
// @Summary Get user activities
// @Description Get paginated list of user activities
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Param action query string false "Filter by action"
// @Success 200 {array} UserActivity
// @Failure 500 {object} map[string]string
// @Router /users/{id}/activities [get]
func (h *UserDetailsHandler) GetActivities(c *gin.Context) {
	userID := c.Param("id")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")
	action := c.Query("action")

	query := `
		SELECT _id, user_id, tenant_id, action, resource, resource_id,
		       details, ip_address, user_agent, status, event_time
		FROM audit_logs
		WHERE user_id = $1
	`
	args := []interface{}{userID}
	argCount := 2

	if action != "" {
		query += ` AND action = $` + string(rune(argCount+48))
		args = append(args, action)
		argCount++
	}

	query += ` ORDER BY event_time DESC LIMIT $` + string(rune(argCount+48)) +
		` OFFSET $` + string(rune(argCount+49))
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch activities: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	activities := []UserActivity{}
	for rows.Next() {
		var activity UserActivity
		err := rows.Scan(
			&activity.ID,
			&activity.UserID,
			&activity.TenantID,
			&activity.Action,
			&activity.Resource,
			&activity.ResourceID,
			&activity.Details,
			&activity.IPAddress,
			&activity.UserAgent,
			&activity.Status,
			&activity.EventTime,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse activity: " + err.Error(),
			})
			return
		}
		activities = append(activities, activity)
	}

	c.JSON(http.StatusOK, activities)
}

// GetTenants retrieves user's tenant memberships
// @Summary Get user tenants
// @Description Get list of tenants user belongs to
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {array} UserTenant
// @Failure 500 {object} map[string]string
// @Router /users/{id}/tenants [get]
func (h *UserDetailsHandler) GetTenants(c *gin.Context) {
	userID := c.Param("id")

	query := `
		SELECT 
			t._id as tenant_id,
			t.code as tenant_code,
			t.name as tenant_name,
			t.tier as tenant_tier,
			tm.display_name,
			tm.status,
			tm.joined_at,
			COUNT(DISTINCT ur._id) as roles_count
		FROM tenant_members tm
		JOIN tenants t ON tm.tenant_id = t._id
		LEFT JOIN user_roles ur ON tm._id = ur.user_id AND ur.deleted_at IS NULL
		WHERE tm.user_id = $1 AND tm.deleted_at IS NULL AND t.deleted_at IS NULL
		GROUP BY t._id, t.code, t.name, t.tier, tm.display_name, tm.status, tm.joined_at
		ORDER BY tm.joined_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch tenants: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	tenants := []UserTenant{}
	for rows.Next() {
		var tenant UserTenant
		err := rows.Scan(
			&tenant.TenantID,
			&tenant.TenantCode,
			&tenant.TenantName,
			&tenant.TenantTier,
			&tenant.DisplayName,
			&tenant.Status,
			&tenant.JoinedAt,
			&tenant.RolesCount,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse tenant: " + err.Error(),
			})
			return
		}
		tenants = append(tenants, tenant)
	}

	c.JSON(http.StatusOK, tenants)
}

// GetSessions retrieves user's active sessions
// @Summary Get user sessions
// @Description Get list of user's active sessions
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {array} UserSession
// @Failure 500 {object} map[string]string
// @Router /users/{id}/sessions [get]
func (h *UserDetailsHandler) GetSessions(c *gin.Context) {
	userID := c.Param("id")

	query := `
		SELECT _id, user_id, tenant_id, device_id, ip_address, user_agent,
		       is_active, last_seen_at, expires_at, created_at
		FROM user_sessions
		WHERE user_id = $1 AND expires_at > NOW()
		ORDER BY last_seen_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch sessions: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	sessions := []UserSession{}
	for rows.Next() {
		var session UserSession
		err := rows.Scan(
			&session.ID,
			&session.UserID,
			&session.TenantID,
			&session.DeviceID,
			&session.IPAddress,
			&session.UserAgent,
			&session.IsActive,
			&session.LastSeenAt,
			&session.ExpiresAt,
			&session.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse session: " + err.Error(),
			})
			return
		}
		sessions = append(sessions, session)
	}

	c.JSON(http.StatusOK, sessions)
}

// GetDevices retrieves user's registered devices
// @Summary Get user devices
// @Description Get list of user's registered devices
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {array} UserDevice
// @Failure 500 {object} map[string]string
// @Router /users/{id}/devices [get]
func (h *UserDetailsHandler) GetDevices(c *gin.Context) {
	userID := c.Param("id")

	query := `
		SELECT _id, user_id, device_name, device_type, os, browser,
		       is_trusted, last_seen_at, created_at
		FROM user_devices
		WHERE user_id = $1
		ORDER BY last_seen_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch devices: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	devices := []UserDevice{}
	for rows.Next() {
		var device UserDevice
		err := rows.Scan(
			&device.ID,
			&device.UserID,
			&device.DeviceName,
			&device.DeviceType,
			&device.OS,
			&device.Browser,
			&device.IsTrusted,
			&device.LastSeenAt,
			&device.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse device: " + err.Error(),
			})
			return
		}
		devices = append(devices, device)
	}

	c.JSON(http.StatusOK, devices)
}

// RevokeSession revokes a specific user session
// @Summary Revoke session
// @Description Revoke/logout a specific user session
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param session_id path string true "Session ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id}/sessions/{session_id} [delete]
func (h *UserDetailsHandler) RevokeSession(c *gin.Context) {
	userID := c.Param("id")
	sessionID := c.Param("session_id")

	query := `
		UPDATE user_sessions
		SET is_active = false, expires_at = NOW()
		WHERE _id = $1 AND user_id = $2
	`

	result, err := h.db.Exec(query, sessionID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to revoke session: " + err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Session not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Session revoked successfully",
	})
}

// RemoveDevice removes a user device
// @Summary Remove device
// @Description Remove a registered device
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param device_id path string true "Device ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id}/devices/{device_id} [delete]
func (h *UserDetailsHandler) RemoveDevice(c *gin.Context) {
	userID := c.Param("id")
	deviceID := c.Param("device_id")

	query := `
		DELETE FROM user_devices
		WHERE _id = $1 AND user_id = $2
	`

	result, err := h.db.Exec(query, deviceID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to remove device: " + err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Device not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Device removed successfully",
	})
}
