package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

/**
 * Dashboard Handler
 * Provides comprehensive statistics and metrics for dashboard
 * 
 * Features:
 * - Overview statistics (users, tenants, subscriptions, etc.)
 * - Revenue metrics
 * - Growth trends
 * - Recent activities
 * - System health
 * - Chart data (monthly revenue, activity trends)
 * 
 * Data aggregated from multiple tables:
 * - users
 * - tenants
 * - tenant_subscriptions
 * - subscription_invoices
 * - subscription_orders
 * - webhooks
 * - notifications
 */

// DashboardOverview represents main dashboard statistics
type DashboardOverview struct {
	// Users & Tenants
	TotalUsers            int64   `json:"total_users"`
	ActiveUsers           int64   `json:"active_users"`
	NewUsersThisMonth     int64   `json:"new_users_this_month"`
	UsersGrowthPercent    float64 `json:"users_growth_percent"`
	
	TotalTenants          int64   `json:"total_tenants"`
	ActiveTenants         int64   `json:"active_tenants"`
	NewTenantsThisMonth   int64   `json:"new_tenants_this_month"`
	TenantsGrowthPercent  float64 `json:"tenants_growth_percent"`
	
	// Subscriptions
	TotalSubscriptions    int64   `json:"total_subscriptions"`
	ActiveSubscriptions   int64   `json:"active_subscriptions"`
	ExpiredSubscriptions  int64   `json:"expired_subscriptions"`
	ExpiringSubscriptions int64   `json:"expiring_subscriptions"` // Expiring in 7 days
	
	// Revenue
	TotalRevenue          float64 `json:"total_revenue"`
	MonthlyRevenue        float64 `json:"monthly_revenue"`
	RevenueGrowthPercent  float64 `json:"revenue_growth_percent"`
	
	// Orders & Invoices
	TotalOrders           int64   `json:"total_orders"`
	PendingOrders         int64   `json:"pending_orders"`
	PaidOrders            int64   `json:"paid_orders"`
	
	TotalInvoices         int64   `json:"total_invoices"`
	PendingInvoices       int64   `json:"pending_invoices"`
	PaidInvoices          int64   `json:"paid_invoices"`
	OverdueInvoices       int64   `json:"overdue_invoices"`
	
	// Webhooks
	TotalWebhooks         int64   `json:"total_webhooks"`
	ActiveWebhooks        int64   `json:"active_webhooks"`
	HealthyWebhooks       int64   `json:"healthy_webhooks"`
	UnhealthyWebhooks     int64   `json:"unhealthy_webhooks"`
	
	// Notifications
	TotalNotifications    int64   `json:"total_notifications"`
	UnreadNotifications   int64   `json:"unread_notifications"`
}

// RevenueChartData for monthly revenue chart
type RevenueChartData struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
	Orders  int64   `json:"orders"`
}

// ActivityChartData for activity trends
type ActivityChartData struct {
	Date           string `json:"date"`
	Users          int64  `json:"users"`
	Subscriptions  int64  `json:"subscriptions"`
	Orders         int64  `json:"orders"`
}

// RecentActivity represents recent system activities
type RecentActivity struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // user_created, subscription_created, order_paid, etc.
	Description string    `json:"description"`
	UserName    string    `json:"user_name,omitempty"`
	Timestamp   time.Time `json:"timestamp"`
	Icon        string    `json:"icon"`
	Color       string    `json:"color"`
}

// SystemHealth represents system health metrics
type SystemHealth struct {
	DatabaseStatus      string  `json:"database_status"`
	DatabaseResponseMs  float64 `json:"database_response_ms"`
	WebhooksHealth      string  `json:"webhooks_health"`
	SubscriptionsHealth string  `json:"subscriptions_health"`
	OverallHealth       string  `json:"overall_health"`
}

type DashboardHandler struct {
	db *sql.DB
}

func NewDashboardHandler(db *sql.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

/**
 * GET /api/v1/dashboard/overview
 * Get comprehensive dashboard overview statistics
 */
func (h *DashboardHandler) GetOverview(c *gin.Context) {
	overview := DashboardOverview{}

	// Get current and previous month dates
	now := time.Now()
	firstDayThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	firstDayLastMonth := firstDayThisMonth.AddDate(0, -1, 0)

	// 1. USERS STATISTICS
	err := h.db.QueryRow(`
		SELECT 
			COUNT(*) as total_users,
			COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
			COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_users_this_month
		FROM users
		WHERE deleted_at IS NULL
	`, firstDayThisMonth).Scan(
		&overview.TotalUsers,
		&overview.ActiveUsers,
		&overview.NewUsersThisMonth,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users statistics: " + err.Error()})
		return
	}

	// Calculate users growth
	var lastMonthUsers int64
	h.db.QueryRow(`
		SELECT COUNT(*) FROM users 
		WHERE created_at >= $1 AND created_at < $2 AND deleted_at IS NULL
	`, firstDayLastMonth, firstDayThisMonth).Scan(&lastMonthUsers)
	
	if lastMonthUsers > 0 {
		overview.UsersGrowthPercent = float64(overview.NewUsersThisMonth-lastMonthUsers) / float64(lastMonthUsers) * 100
	}

	// 2. TENANTS STATISTICS
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*) as total_tenants,
			COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_tenants,
			COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_tenants_this_month
		FROM tenants
		WHERE deleted_at IS NULL
	`, firstDayThisMonth).Scan(
		&overview.TotalTenants,
		&overview.ActiveTenants,
		&overview.NewTenantsThisMonth,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tenants statistics: " + err.Error()})
		return
	}

	// Calculate tenants growth
	var lastMonthTenants int64
	h.db.QueryRow(`
		SELECT COUNT(*) FROM tenants 
		WHERE created_at >= $1 AND created_at < $2 AND deleted_at IS NULL
	`, firstDayLastMonth, firstDayThisMonth).Scan(&lastMonthTenants)
	
	if lastMonthTenants > 0 {
		overview.TenantsGrowthPercent = float64(overview.NewTenantsThisMonth-lastMonthTenants) / float64(lastMonthTenants) * 100
	}

	// 3. SUBSCRIPTIONS STATISTICS
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*) as total_subscriptions,
			COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_subscriptions,
			COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired_subscriptions,
			COUNT(CASE WHEN status = 'ACTIVE' AND end_at IS NOT NULL 
				AND end_at BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 1 END) as expiring_subscriptions
		FROM tenant_subscriptions
		WHERE deleted_at IS NULL
	`).Scan(
		&overview.TotalSubscriptions,
		&overview.ActiveSubscriptions,
		&overview.ExpiredSubscriptions,
		&overview.ExpiringSubscriptions,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions statistics: " + err.Error()})
		return
	}

	// 4. REVENUE STATISTICS
	err = h.db.QueryRow(`
		SELECT 
			COALESCE(SUM(total_amount), 0) as total_revenue,
			COALESCE(SUM(CASE WHEN created_at >= $1 THEN total_amount ELSE 0 END), 0) as monthly_revenue
		FROM subscription_invoices
		WHERE status = 'PAID' AND deleted_at IS NULL
	`, firstDayThisMonth).Scan(
		&overview.TotalRevenue,
		&overview.MonthlyRevenue,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revenue statistics: " + err.Error()})
		return
	}

	// Calculate revenue growth
	var lastMonthRevenue float64
	h.db.QueryRow(`
		SELECT COALESCE(SUM(total_amount), 0) FROM subscription_invoices 
		WHERE status = 'PAID' 
		  AND created_at >= $1 AND created_at < $2 
		  AND deleted_at IS NULL
	`, firstDayLastMonth, firstDayThisMonth).Scan(&lastMonthRevenue)
	
	if lastMonthRevenue > 0 {
		overview.RevenueGrowthPercent = (overview.MonthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100
	}

	// 5. ORDERS STATISTICS
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*) as total_orders,
			COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
			COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_orders
		FROM subscription_orders
		WHERE deleted_at IS NULL
	`).Scan(
		&overview.TotalOrders,
		&overview.PendingOrders,
		&overview.PaidOrders,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders statistics: " + err.Error()})
		return
	}

	// 6. INVOICES STATISTICS
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*) as total_invoices,
			COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_invoices,
			COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_invoices,
			COUNT(CASE WHEN status IN ('PENDING', 'SENT') AND due_date < NOW() THEN 1 END) as overdue_invoices
		FROM subscription_invoices
		WHERE deleted_at IS NULL
	`).Scan(
		&overview.TotalInvoices,
		&overview.PendingInvoices,
		&overview.PaidInvoices,
		&overview.OverdueInvoices,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoices statistics: " + err.Error()})
		return
	}

	// 7. WEBHOOKS STATISTICS
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*) as total_webhooks,
			COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_webhooks,
			COUNT(CASE WHEN failure_count <= 5 THEN 1 END) as healthy_webhooks,
			COUNT(CASE WHEN failure_count > 5 THEN 1 END) as unhealthy_webhooks
		FROM webhooks
	`).Scan(
		&overview.TotalWebhooks,
		&overview.ActiveWebhooks,
		&overview.HealthyWebhooks,
		&overview.UnhealthyWebhooks,
	)
	if err != nil {
		// Webhooks table might not exist yet, ignore error
		overview.TotalWebhooks = 0
	}

	// 8. NOTIFICATIONS STATISTICS
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*) as total_notifications,
			COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications
		FROM notifications
		WHERE deleted_at IS NULL
	`).Scan(
		&overview.TotalNotifications,
		&overview.UnreadNotifications,
	)
	if err != nil {
		// Notifications table might not exist yet, ignore error
		overview.TotalNotifications = 0
	}

	c.JSON(http.StatusOK, overview)
}

/**
 * GET /api/v1/dashboard/revenue-chart
 * Get monthly revenue chart data (last 12 months)
 */
func (h *DashboardHandler) GetRevenueChart(c *gin.Context) {
	query := `
		SELECT 
			TO_CHAR(created_at, 'YYYY-MM') as month,
			COALESCE(SUM(total_amount), 0) as revenue,
			COUNT(*) as orders
		FROM subscription_invoices
		WHERE status = 'PAID' 
		  AND created_at >= NOW() - INTERVAL '12 months'
		  AND deleted_at IS NULL
		GROUP BY TO_CHAR(created_at, 'YYYY-MM')
		ORDER BY month ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revenue chart: " + err.Error()})
		return
	}
	defer rows.Close()

	data := []RevenueChartData{}
	for rows.Next() {
		var item RevenueChartData
		err := rows.Scan(&item.Month, &item.Revenue, &item.Orders)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan revenue data: " + err.Error()})
			return
		}
		data = append(data, item)
	}

	c.JSON(http.StatusOK, data)
}

/**
 * GET /api/v1/dashboard/activity-chart
 * Get activity chart data (last 30 days)
 */
func (h *DashboardHandler) GetActivityChart(c *gin.Context) {
	query := `
		SELECT 
			TO_CHAR(date, 'YYYY-MM-DD') as date,
			COALESCE(users, 0) as users,
			COALESCE(subscriptions, 0) as subscriptions,
			COALESCE(orders, 0) as orders
		FROM (
			SELECT 
				DATE(created_at) as date,
				COUNT(DISTINCT CASE WHEN table_name = 'users' THEN id END) as users,
				COUNT(DISTINCT CASE WHEN table_name = 'subscriptions' THEN id END) as subscriptions,
				COUNT(DISTINCT CASE WHEN table_name = 'orders' THEN id END) as orders
			FROM (
				SELECT _id as id, created_at, 'users' as table_name FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
				UNION ALL
				SELECT _id as id, created_at, 'subscriptions' as table_name FROM tenant_subscriptions WHERE created_at >= NOW() - INTERVAL '30 days'
				UNION ALL
				SELECT _id as id, created_at, 'orders' as table_name FROM subscription_orders WHERE created_at >= NOW() - INTERVAL '30 days'
			) combined
			GROUP BY DATE(created_at)
			ORDER BY date DESC
			LIMIT 30
		) activity_data
		ORDER BY date ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activity chart: " + err.Error()})
		return
	}
	defer rows.Close()

	data := []ActivityChartData{}
	for rows.Next() {
		var item ActivityChartData
		err := rows.Scan(&item.Date, &item.Users, &item.Subscriptions, &item.Orders)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan activity data: " + err.Error()})
			return
		}
		data = append(data, item)
	}

	c.JSON(http.StatusOK, data)
}

/**
 * GET /api/v1/dashboard/recent-activities
 * Get recent system activities (last 50)
 */
func (h *DashboardHandler) GetRecentActivities(c *gin.Context) {
	query := `
		SELECT 
			id, type, description, user_name, timestamp, icon, color
		FROM (
			SELECT 
				u._id::text as id,
				'user_created' as type,
				'New user registered: ' || u.full_name as description,
				u.full_name as user_name,
				u.created_at as timestamp,
				'user' as icon,
				'blue' as color
			FROM users u
			WHERE u.deleted_at IS NULL
			ORDER BY u.created_at DESC
			LIMIT 10
			
			UNION ALL
			
			SELECT 
				s._id::text as id,
				'subscription_created' as type,
				'New subscription created' as description,
				t.name as user_name,
				s.created_at as timestamp,
				'package' as icon,
				'green' as color
			FROM tenant_subscriptions s
			LEFT JOIN tenants t ON s.tenant_id = t._id
			WHERE s.deleted_at IS NULL
			ORDER BY s.created_at DESC
			LIMIT 10
			
			UNION ALL
			
			SELECT 
				o._id::text as id,
				CASE WHEN o.status = 'PAID' THEN 'order_paid' ELSE 'order_created' END as type,
				'Order #' || o.order_number || ' - ' || o.status as description,
				t.name as user_name,
				o.created_at as timestamp,
				'shopping-cart' as icon,
				CASE WHEN o.status = 'PAID' THEN 'green' ELSE 'yellow' END as color
			FROM subscription_orders o
			LEFT JOIN tenants t ON o.tenant_id = t._id
			WHERE o.deleted_at IS NULL
			ORDER BY o.created_at DESC
			LIMIT 10
			
			UNION ALL
			
			SELECT 
				i._id::text as id,
				CASE WHEN i.status = 'PAID' THEN 'invoice_paid' ELSE 'invoice_created' END as type,
				'Invoice #' || i.invoice_number || ' - ' || i.status as description,
				t.name as user_name,
				i.created_at as timestamp,
				'file-text' as icon,
				CASE WHEN i.status = 'PAID' THEN 'green' ELSE 'orange' END as color
			FROM subscription_invoices i
			LEFT JOIN tenants t ON i.tenant_id = t._id
			WHERE i.deleted_at IS NULL
			ORDER BY i.created_at DESC
			LIMIT 10
		) all_activities
		ORDER BY timestamp DESC
		LIMIT 50
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recent activities: " + err.Error()})
		return
	}
	defer rows.Close()

	activities := []RecentActivity{}
	for rows.Next() {
		var activity RecentActivity
		err := rows.Scan(
			&activity.ID,
			&activity.Type,
			&activity.Description,
			&activity.UserName,
			&activity.Timestamp,
			&activity.Icon,
			&activity.Color,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan activity: " + err.Error()})
			return
		}
		activities = append(activities, activity)
	}

	c.JSON(http.StatusOK, activities)
}

/**
 * GET /api/v1/dashboard/system-health
 * Get system health status
 */
func (h *DashboardHandler) GetSystemHealth(c *gin.Context) {
	health := SystemHealth{
		DatabaseStatus:     "healthy",
		WebhooksHealth:     "healthy",
		SubscriptionsHealth: "healthy",
		OverallHealth:      "healthy",
	}

	// Test database connection speed
	start := time.Now()
	err := h.db.Ping()
	health.DatabaseResponseMs = float64(time.Since(start).Milliseconds())

	if err != nil {
		health.DatabaseStatus = "unhealthy"
		health.OverallHealth = "unhealthy"
	} else if health.DatabaseResponseMs > 100 {
		health.DatabaseStatus = "degraded"
		health.OverallHealth = "degraded"
	}

	// Check webhooks health
	var unhealthyWebhooks int64
	h.db.QueryRow("SELECT COUNT(*) FROM webhooks WHERE failure_count > 5").Scan(&unhealthyWebhooks)
	if unhealthyWebhooks > 10 {
		health.WebhooksHealth = "unhealthy"
		if health.OverallHealth == "healthy" {
			health.OverallHealth = "degraded"
		}
	}

	// Check subscriptions health (expiring soon)
	var expiringSubscriptions int64
	h.db.QueryRow(`
		SELECT COUNT(*) FROM tenant_subscriptions 
		WHERE status = 'ACTIVE' 
		  AND end_at IS NOT NULL 
		  AND end_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
		  AND deleted_at IS NULL
	`).Scan(&expiringSubscriptions)
	
	if expiringSubscriptions > 50 {
		health.SubscriptionsHealth = "warning"
	}

	c.JSON(http.StatusOK, health)
}
