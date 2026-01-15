package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

/**
 * Tenant Details Handler
 * API bổ sung cho trang chi tiết tenant
 * 
 * Features:
 * - Tenant statistics (members, departments, groups, locations)
 * - Tenant activities/audit logs
 * - Tenant overview with related data
 * - Tenant members list
 * - Tenant hierarchy (parent/children)
 */

type TenantDetailsHandler struct {
	db *sql.DB
}

func NewTenantDetailsHandler(db *sql.DB) *TenantDetailsHandler {
	return &TenantDetailsHandler{db: db}
}

/**
 * Statistics Data Structures
 */

type TenantStats struct {
	// Basic info
	TenantID   string    `json:"tenant_id"`
	TenantName string    `json:"tenant_name"`
	TenantCode string    `json:"tenant_code"`
	Tier       string    `json:"tier"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`

	// Counts
	MembersCount     int `json:"members_count"`
	ActiveMembers    int `json:"active_members"`
	DepartmentsCount int `json:"departments_count"`
	UserGroupsCount  int `json:"user_groups_count"`
	LocationsCount   int `json:"locations_count"`
	RolesCount       int `json:"roles_count"`

	// Subscriptions & Billing
	ActiveSubscriptions int     `json:"active_subscriptions"`
	MonthlyRevenue      float64 `json:"monthly_revenue"`
	TotalOrders         int     `json:"total_orders"`
	UnpaidInvoices      int     `json:"unpaid_invoices"`

	// API & Technical
	AppRoutesCount  int `json:"app_routes_count"`
	WebhooksCount   int `json:"webhooks_count"`
	RateLimitsCount int `json:"rate_limits_count"`
	SSOConfigsCount int `json:"sso_configs_count"`

	// Storage & Usage
	StorageUsedGB  float64 `json:"storage_used_gb"`
	APICallsMonth  int     `json:"api_calls_month"`
	LastActivityAt *time.Time `json:"last_activity_at"`
}

type TenantActivity struct {
	ID        string    `json:"_id"`
	TenantID  string    `json:"tenant_id"`
	UserID    string    `json:"user_id"`
	UserName  string    `json:"user_name"`
	UserEmail string    `json:"user_email"`
	Action    string    `json:"action"`
	Resource  string    `json:"resource"`
	Details   string    `json:"details"`
	IPAddress string    `json:"ip_address"`
	CreatedAt time.Time `json:"created_at"`
}

type TenantMemberDetail struct {
	ID          string     `json:"_id"`
	UserID      string     `json:"user_id"`
	Email       string     `json:"email"`
	FullName    string     `json:"full_name"`
	AvatarURL   *string    `json:"avatar_url"`
	DisplayName *string    `json:"display_name"`
	Status      string     `json:"status"`
	JoinedAt    time.Time  `json:"joined_at"`
	Roles       []string   `json:"roles"`
	Departments []string   `json:"departments"`
	LastLoginAt *time.Time `json:"last_login_at"`
}

type TenantHierarchy struct {
	ID       string             `json:"_id"`
	Code     string             `json:"code"`
	Name     string             `json:"name"`
	Tier     string             `json:"tier"`
	Status   string             `json:"status"`
	Parent   *TenantHierarchy   `json:"parent,omitempty"`
	Children []*TenantHierarchy `json:"children,omitempty"`
}

/**
 * GET /api/v1/tenants/:id/stats
 * Lấy thống kê tổng quan của tenant
 */
func (h *TenantDetailsHandler) GetStats(c *gin.Context) {
	tenantID := c.Param("id")

	var stats TenantStats

	// Get basic tenant info
	err := h.db.QueryRow(`
		SELECT _id, name, code, tier, status, created_at
		FROM tenants
		WHERE _id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(
		&stats.TenantID,
		&stats.TenantName,
		&stats.TenantCode,
		&stats.Tier,
		&stats.Status,
		&stats.CreatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tenant: " + err.Error()})
		return
	}

	// Count members
	h.db.QueryRow(`
		SELECT COUNT(*), 
		       COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)
		FROM tenant_members
		WHERE tenant_id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(&stats.MembersCount, &stats.ActiveMembers)

	// Count departments
	h.db.QueryRow(`
		SELECT COUNT(*) FROM departments
		WHERE tenant_id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(&stats.DepartmentsCount)

	// Count user groups
	h.db.QueryRow(`
		SELECT COUNT(*) FROM user_groups
		WHERE tenant_id = $1
	`, tenantID).Scan(&stats.UserGroupsCount)

	// Count locations
	h.db.QueryRow(`
		SELECT COUNT(*) FROM locations
		WHERE tenant_id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(&stats.LocationsCount)

	// Count roles
	h.db.QueryRow(`
		SELECT COUNT(*) FROM roles
		WHERE tenant_id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(&stats.RolesCount)

	// Count subscriptions
	h.db.QueryRow(`
		SELECT COUNT(*) FROM tenant_subscriptions
		WHERE tenant_id = $1 AND status = 'ACTIVE'
	`, tenantID).Scan(&stats.ActiveSubscriptions)

	// Count orders
	h.db.QueryRow(`
		SELECT COUNT(*) FROM subscription_orders
		WHERE tenant_id = $1
	`, tenantID).Scan(&stats.TotalOrders)

	// Count unpaid invoices
	h.db.QueryRow(`
		SELECT COUNT(*) FROM subscription_invoices
		WHERE tenant_id = $1 AND status = 'PENDING'
	`, tenantID).Scan(&stats.UnpaidInvoices)

	// App routes, webhooks, rate limits, SSO configs
	h.db.QueryRow(`SELECT COUNT(*) FROM app_routes WHERE tenant_id = $1`, tenantID).Scan(&stats.AppRoutesCount)
	h.db.QueryRow(`SELECT COUNT(*) FROM webhooks WHERE tenant_id = $1`, tenantID).Scan(&stats.WebhooksCount)
	h.db.QueryRow(`SELECT COUNT(*) FROM rate_limits WHERE tenant_id = $1`, tenantID).Scan(&stats.RateLimitsCount)
	h.db.QueryRow(`SELECT COUNT(*) FROM sso_configs WHERE tenant_id = $1`, tenantID).Scan(&stats.SSOConfigsCount)

	// Last activity (from audit_logs - ClickHouse or fallback)
	h.db.QueryRow(`
		SELECT MAX(created_at) FROM audit_logs
		WHERE tenant_id = $1
	`, tenantID).Scan(&stats.LastActivityAt)

	c.JSON(http.StatusOK, stats)
}

/**
 * GET /api/v1/tenants/:id/activities
 * Lấy lịch sử hoạt động của tenant
 * Query params: limit, offset
 */
func (h *TenantDetailsHandler) GetActivities(c *gin.Context) {
	tenantID := c.Param("id")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT 
			al._id, al.tenant_id, al.user_id, al.action, al.resource, 
			al.details, al.ip_address, al.created_at,
			u.full_name, u.email
		FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u._id
		WHERE al.tenant_id = $1
		ORDER BY al.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := h.db.Query(query, tenantID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activities: " + err.Error()})
		return
	}
	defer rows.Close()

	activities := []TenantActivity{}
	for rows.Next() {
		var a TenantActivity
		err := rows.Scan(
			&a.ID, &a.TenantID, &a.UserID, &a.Action, &a.Resource,
			&a.Details, &a.IPAddress, &a.CreatedAt,
			&a.UserName, &a.UserEmail,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan activity: " + err.Error()})
			return
		}
		activities = append(activities, a)
	}

	c.JSON(http.StatusOK, activities)
}

/**
 * GET /api/v1/tenants/:id/members-detailed
 * Lấy danh sách members với thông tin chi tiết (roles, departments)
 */
func (h *TenantDetailsHandler) GetMembersDetailed(c *gin.Context) {
	tenantID := c.Param("id")

	query := `
		SELECT 
			tm._id, tm.user_id, u.email, u.full_name, u.avatar_url,
			tm.display_name, tm.status, tm.joined_at
		FROM tenant_members tm
		JOIN users u ON tm.user_id = u._id
		WHERE tm.tenant_id = $1 AND tm.deleted_at IS NULL
		ORDER BY tm.joined_at DESC
	`

	rows, err := h.db.Query(query, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch members: " + err.Error()})
		return
	}
	defer rows.Close()

	members := []TenantMemberDetail{}
	for rows.Next() {
		var m TenantMemberDetail
		err := rows.Scan(
			&m.ID, &m.UserID, &m.Email, &m.FullName, &m.AvatarURL,
			&m.DisplayName, &m.Status, &m.JoinedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan member: " + err.Error()})
			return
		}

		// Get member roles
		rolesQuery := `
			SELECT r.name FROM user_roles ur
			JOIN roles r ON ur.role_id = r._id
			WHERE ur.user_id = $1 AND ur.tenant_id = $2 AND ur.is_active = true
		`
		rolesRows, _ := h.db.Query(rolesQuery, m.UserID, tenantID)
		roles := []string{}
		for rolesRows.Next() {
			var roleName string
			rolesRows.Scan(&roleName)
			roles = append(roles, roleName)
		}
		rolesRows.Close()
		m.Roles = roles

		// Get member departments
		deptQuery := `
			SELECT d.name FROM department_members dm
			JOIN departments d ON dm.department_id = d._id
			WHERE dm.member_id = $1 AND dm.tenant_id = $2
		`
		deptRows, _ := h.db.Query(deptQuery, m.ID, tenantID)
		departments := []string{}
		for deptRows.Next() {
			var deptName string
			deptRows.Scan(&deptName)
			departments = append(departments, deptName)
		}
		deptRows.Close()
		m.Departments = departments

		members = append(members, m)
	}

	c.JSON(http.StatusOK, members)
}

/**
 * GET /api/v1/tenants/:id/hierarchy
 * Lấy cấu trúc phân cấp của tenant (parent & children)
 */
func (h *TenantDetailsHandler) GetHierarchy(c *gin.Context) {
	tenantID := c.Param("id")

	var hierarchy TenantHierarchy

	// Get current tenant
	err := h.db.QueryRow(`
		SELECT _id, code, name, tier, status
		FROM tenants
		WHERE _id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(&hierarchy.ID, &hierarchy.Code, &hierarchy.Name, &hierarchy.Tier, &hierarchy.Status)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tenant: " + err.Error()})
		return
	}

	// Get parent
	var parentID *string
	h.db.QueryRow(`SELECT parent_tenant_id FROM tenants WHERE _id = $1`, tenantID).Scan(&parentID)
	if parentID != nil {
		var parent TenantHierarchy
		h.db.QueryRow(`
			SELECT _id, code, name, tier, status
			FROM tenants
			WHERE _id = $1 AND deleted_at IS NULL
		`, *parentID).Scan(&parent.ID, &parent.Code, &parent.Name, &parent.Tier, &parent.Status)
		hierarchy.Parent = &parent
	}

	// Get children
	childrenRows, _ := h.db.Query(`
		SELECT _id, code, name, tier, status
		FROM tenants
		WHERE parent_tenant_id = $1 AND deleted_at IS NULL
		ORDER BY name
	`, tenantID)
	defer childrenRows.Close()

	children := []*TenantHierarchy{}
	for childrenRows.Next() {
		var child TenantHierarchy
		childrenRows.Scan(&child.ID, &child.Code, &child.Name, &child.Tier, &child.Status)
		children = append(children, &child)
	}
	hierarchy.Children = children

	c.JSON(http.StatusOK, hierarchy)
}

/**
 * GET /api/v1/tenants/:id/overview
 * Lấy tổng quan đầy đủ (basic info + stats + recent activities)
 */
func (h *TenantDetailsHandler) GetOverview(c *gin.Context) {
	tenantID := c.Param("id")

	type TenantOverview struct {
		Tenant     Tenant           `json:"tenant"`
		Stats      TenantStats      `json:"stats"`
		Activities []TenantActivity `json:"recent_activities"`
		Members    int              `json:"total_members"`
	}

	var overview TenantOverview

	// Get tenant basic info
	err := h.db.QueryRow(`
		SELECT _id, code, data_region, compliance_level, parent_tenant_id, path,
		       name, tier, billing_type, timezone, profile, settings,
		       status, created_at, updated_at, version
		FROM tenants
		WHERE _id = $1 AND deleted_at IS NULL
	`, tenantID).Scan(
		&overview.Tenant.ID, &overview.Tenant.Code, &overview.Tenant.DataRegion,
		&overview.Tenant.ComplianceLevel, &overview.Tenant.ParentTenantID, &overview.Tenant.Path,
		&overview.Tenant.Name, &overview.Tenant.Tier, &overview.Tenant.BillingType,
		&overview.Tenant.Timezone, &overview.Tenant.Profile, &overview.Tenant.Settings,
		&overview.Tenant.Status, &overview.Tenant.CreatedAt, &overview.Tenant.UpdatedAt,
		&overview.Tenant.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tenant: " + err.Error()})
		return
	}

	// Get stats (simplified)
	h.db.QueryRow(`SELECT COUNT(*) FROM tenant_members WHERE tenant_id = $1 AND deleted_at IS NULL`, tenantID).Scan(&overview.Members)

	// Get recent activities (last 10)
	actRows, _ := h.db.Query(`
		SELECT al._id, al.action, al.resource, al.created_at, u.full_name
		FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u._id
		WHERE al.tenant_id = $1
		ORDER BY al.created_at DESC
		LIMIT 10
	`, tenantID)
	defer actRows.Close()

	activities := []TenantActivity{}
	for actRows.Next() {
		var a TenantActivity
		actRows.Scan(&a.ID, &a.Action, &a.Resource, &a.CreatedAt, &a.UserName)
		activities = append(activities, a)
	}
	overview.Activities = activities

	c.JSON(http.StatusOK, overview)
}
